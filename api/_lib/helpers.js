import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

export function setCors(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}

/**
 * Authenticate API key, check credits, apply rate limit.
 * Returns { userId, credits } or sends error response.
 */
export async function auth(req, res) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) { res.status(401).json({ error: 'Missing x-api-key header' }); return null; }

  const { data: keyData } = await supabase
    .from('api_keys').select('user_id').eq('key_value', apiKey).single();
  if (!keyData) { res.status(403).json({ error: 'Invalid API key' }); return null; }

  const userId = keyData.user_id;

  // Rate limit: 2s between requests
  const { data: lastLog } = await supabase
    .from('usage_logs').select('created_at').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(1).single();
  if (lastLog) {
    const elapsed = Date.now() - new Date(lastLog.created_at).getTime();
    if (elapsed < 2000) {
      res.status(429).json({ error: 'Rate limited', retry_after_ms: 2000 - elapsed });
      return null;
    }
  }

  // Check credits
  const { data: profile } = await supabase
    .from('profiles').select('credits').eq('id', userId).single();
  if (!profile || profile.credits <= 0) {
    res.status(402).json({ error: 'Insufficient credits', credits_remaining: 0, message: 'Top up at https://api-amine.vercel.app' });
    return null;
  }

  return { userId, credits: profile.credits };
}

/**
 * Deduct 1 credit and log the request.
 */
export async function deductAndLog(userId, endpoint, summary = '') {
  await Promise.all([
    supabase.rpc('decrement_credits', { user_id_input: userId }),
    supabase.from('usage_logs').insert([{
      user_id: userId,
      endpoint,
      prompt_summary: summary.substring(0, 80),
      status_code: 200,
    }]),
  ]);
}

export { supabase };
