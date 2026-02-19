import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Anti-abuse: track reward claims per user (max 10/day)
const DAILY_REWARD_LIMIT = 10;
const COOLDOWN_MS = 60000; // 1 minute between rewards

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid session' });

  try {
    // ─── Anti-abuse: Check cooldown ──────────────────────
    const { data: lastReward } = await supabase
      .from('reward_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastReward) {
      const elapsed = Date.now() - new Date(lastReward.created_at).getTime();
      if (elapsed < COOLDOWN_MS) {
        return res.status(429).json({
          error: 'Please wait before claiming another reward',
          retry_after_ms: COOLDOWN_MS - elapsed
        });
      }
    }

    // ─── Anti-abuse: Check daily limit ───────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('reward_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());

    if (count >= DAILY_REWARD_LIMIT) {
      return res.status(429).json({
        error: 'Daily reward limit reached',
        limit: DAILY_REWARD_LIMIT,
        resets_at: new Date(today.getTime() + 86400000).toISOString()
      });
    }

    // ─── Grant credits & log ─────────────────────────────
    const amount = 5;
    await supabase.rpc('increment_credits', { user_id_input: user.id, amount });
    await supabase.from('reward_logs').insert([{
      user_id: user.id,
      credits_granted: amount,
      source: 'ad_view',
      ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress
    }]);

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    return res.status(200).json({
      success: true,
      credits_added: amount,
      credits_total: profile?.credits || amount,
      rewards_remaining_today: DAILY_REWARD_LIMIT - (count + 1)
    });

  } catch (e) {
    console.error('[AmineAPI] reward error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
