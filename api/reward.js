import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return res.status(401).json({ error: "Non autorisé" });

  await supabase.rpc('manage_credits', { target_user_id: user.id, amount: 10 });
  return res.status(200).json({ success: true });
}
