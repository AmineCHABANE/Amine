import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Non identifié' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Session invalide' });

  // Ajout de 5 crédits pour une pub standard
  await supabase.rpc('increment_credits', { user_id_input: user.id, amount: 5 });

  return res.status(200).json({ success: true, message: '5 Crédits ajoutés' });
}
