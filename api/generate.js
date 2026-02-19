import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  const { prompt, max_tokens = 300 } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "prompt"' });
  }

  try {
    // Check credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return res.status(402).json({ error: 'Insufficient credits', credits_remaining: 0 });
    }

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Math.min(max_tokens, 1000),
    });

    const result = completion.choices[0].message.content;

    // Debit & log
    await Promise.all([
      supabase.rpc('decrement_credits', { user_id_input: user.id }),
      supabase.from('usage_logs').insert([{
        user_id: user.id,
        prompt_summary: prompt.substring(0, 80)
      }])
    ]);

    return res.status(200).json({
      result,
      model: 'gpt-4o-mini',
      credits_remaining: profile.credits - 1
    });

  } catch (e) {
    console.error('[AmineAPI] generate error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
