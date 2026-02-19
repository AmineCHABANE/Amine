import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST' });
  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (!prompt || !apiKey) return res.status(400).json({ error: 'Missing data' });
  const hash = crypto.createHash('md5').update(prompt.toLowerCase().trim()).digest('hex');

  try {
    // 1. Auth & Rate Limit (2s cooldown)
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
    if (!keyData) return res.status(403).json({ error: 'Invalid API Key' });

    const { data: lastLog } = await supabase.from('usage_logs').select('created_at').eq('user_id', keyData.user_id).order('created_at', { ascending: false }).limit(1).single();
    if (lastLog && (new Date() - new Date(lastLog.created_at) < 2000)) return res.status(429).json({ error: 'Rate limit: 1 request / 2s' });

    // 2. Cache check
    const { data: cache } = await supabase.from('ai_cache').select('response_text').eq('prompt_hash', hash).single();
    if (cache) {
      await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });
      return res.status(200).json({ result: cache.response_text, cached: true });
    }

    // 3. Credits check & OpenAI (GPT-4o-mini)
    const { data: prof } = await supabase.from('profiles').select('credits').eq('id', keyData.user_id).single();
    if (prof.credits <= 0) return res.status(402).json({ error: 'Insufficient credits' });

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 300 })
    });
    const aiData = await aiRes.json();
    const result = aiData.choices[0].message.content;

    // 4. Finalize: Log, Cache, Debit
    await supabase.from('usage_logs').insert([{ user_id: keyData.user_id, prompt_summary: prompt.substring(0, 50) }]);
    await supabase.from('ai_cache').insert([{ prompt_hash: hash, response_text: result }]);
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result });
  } catch (e) { return res.status(500).json({ error: 'Server Error' }); }
}
