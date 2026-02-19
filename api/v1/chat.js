import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  // Sécurité 1 : Méthode autorisée uniquement
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });

  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];

  // Sécurité 2 : Validation des entrées
  if (!prompt || prompt.length < 2) return res.status(400).json({ error: 'Prompt trop court ou manquant' });
  if (!apiKey) return res.status(401).json({ error: 'Clé API requise' });

  try {
    // Sécurité 3 : Identification
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
    if (!keyData) return res.status(403).json({ error: 'Clé invalide' });

    // Sécurité 4 : Vérification crédits
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', keyData.user_id).single();
    if (!profile || profile.credits <= 0) {
      return res.status(402).json({ error: 'Solde épuisé', recharge_url: 'https://api-amine.vercel.app' });
    }

    // Sécurité 5 : Appel OpenAI sécurisé
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }], max_tokens: 500 })
    });

    const aiData = await aiRes.json();
    if (aiData.error) throw new Error(aiData.error.message);

    // Sécurité 6 : Débit atomique (RPC)
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result: aiData.choices[0].message.content });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur technique. Crédit non débité.' });
  }
}
