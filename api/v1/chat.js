import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ─── CORS headers ──────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export default async function handler(req, res) {
  // Handle preflight
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed. Use POST.', ...CORS });

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  const { prompt, max_tokens = 300, temperature = 0.7 } = req.body || {};
  const apiKey = req.headers['x-api-key'];

  // ─── Validation ──────────────────────────────────────
  if (!apiKey) return res.status(401).json({ error: 'Missing x-api-key header' });
  if (!prompt) return res.status(400).json({ error: 'Missing "prompt" in request body' });
  if (typeof prompt !== 'string' || prompt.length > 4000) {
    return res.status(400).json({ error: 'Prompt must be a string under 4000 characters' });
  }

  const hash = crypto.createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex');
  const startTime = Date.now();

  try {
    // ─── 1. Authenticate API Key ─────────────────────────
    const { data: keyData, error: keyErr } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .single();

    if (keyErr || !keyData) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    const userId = keyData.user_id;

    // ─── 2. Rate Limiting (2s cooldown) ──────────────────
    const { data: lastLog } = await supabase
      .from('usage_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastLog) {
      const elapsed = Date.now() - new Date(lastLog.created_at).getTime();
      if (elapsed < 2000) {
        return res.status(429).json({
          error: 'Rate limited',
          message: 'Please wait 2 seconds between requests',
          retry_after_ms: 2000 - elapsed
        });
      }
    }

    // ─── 3. Check Credits ────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (!profile || profile.credits <= 0) {
      return res.status(402).json({
        error: 'Insufficient credits',
        credits_remaining: 0,
        message: 'Top up your credits at https://amineapi.dev'
      });
    }

    // ─── 4. Cache Check ──────────────────────────────────
    const { data: cache } = await supabase
      .from('ai_cache')
      .select('response_text')
      .eq('prompt_hash', hash)
      .single();

    if (cache) {
      await supabase.rpc('decrement_credits', { user_id_input: userId });
      await supabase.from('usage_logs').insert([{
        user_id: userId,
        prompt_summary: prompt.substring(0, 80),
        cached: true
      }]);

      return res.status(200).json({
        result: cache.response_text,
        cached: true,
        credits_remaining: profile.credits - 1,
        latency_ms: Date.now() - startTime
      });
    }

    // ─── 5. Call OpenAI ──────────────────────────────────
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: Math.min(max_tokens, 1000),
        temperature: Math.min(Math.max(temperature, 0), 2)
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'AI provider error', details: err.error?.message });
    }

    const aiData = await aiRes.json();
    const result = aiData.choices?.[0]?.message?.content;

    if (!result) {
      return res.status(502).json({ error: 'Empty response from AI provider' });
    }

    // ─── 6. Save: Log + Cache + Debit ────────────────────
    await Promise.all([
      supabase.from('usage_logs').insert([{
        user_id: userId,
        prompt_summary: prompt.substring(0, 80),
        cached: false
      }]),
      supabase.from('ai_cache').insert([{
        prompt_hash: hash,
        response_text: result
      }]),
      supabase.rpc('decrement_credits', { user_id_input: userId })
    ]);

    return res.status(200).json({
      result,
      cached: false,
      model: 'gpt-4o-mini',
      credits_remaining: profile.credits - 1,
      latency_ms: Date.now() - startTime
    });

  } catch (e) {
    console.error('[AmineAPI] chat error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
