import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const CREDITS_PER_REWARD = 3;
const MAX_REWARDS_PER_DAY = 5;
const COOLDOWN_SECONDS = 120;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing auth token' });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';

    const { data: lastReward } = await supabase
      .from('reward_logs').select('created_at').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single();

    if (lastReward) {
      const elapsed = (Date.now() - new Date(lastReward.created_at).getTime()) / 1000;
      if (elapsed < COOLDOWN_SECONDS) {
        return res.status(429).json({ error: 'Too soon', retry_after_seconds: Math.ceil(COOLDOWN_SECONDS - elapsed) });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('reward_logs').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', today.toISOString());

    if (count >= MAX_REWARDS_PER_DAY) {
      return res.status(429).json({ error: 'Daily limit reached', rewards_today: count, max: MAX_REWARDS_PER_DAY });
    }

    await supabase.rpc('increment_credits', { user_id_input: user.id, amount: CREDITS_PER_REWARD });
    await supabase.from('reward_logs').insert([{ user_id: user.id, credits_granted: CREDITS_PER_REWARD, source: 'rewarded_video', ip_address: ip }]);

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();

    return res.status(200).json({
      success: true,
      credits_granted: CREDITS_PER_REWARD,
      credits_balance: profile?.credits || 0,
      rewards_remaining_today: MAX_REWARDS_PER_DAY - (count + 1),
    });
  } catch (e) {
    console.error('[AmineAPI] reward error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
