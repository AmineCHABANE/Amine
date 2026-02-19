import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec la clé de service (Admin)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key']; // La clé transmise par le créateur

  if (!apiKey) return res.status(401).json({ error: 'Clé API manquante' });

  try {
    // 1. Vérifier si la clé API appartient à un utilisateur
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id')
      .eq('key_value', apiKey)
      .single();

    if (keyError || !keyData) return res.status(403).json({ error: 'Clé API invalide' });

    // 2. Vérifier le solde de crédits de cet utilisateur
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', keyData.user_id)
      .single();

    if (profError || (profile?.credits || 0) <= 0) {
      return res.status(402).json({
        error: "Crédits insuffisants",
        message: "Votre solde est de 0. Rechargez sur https://api-amine.vercel.app via la publicité."
      });
    }

    // 3. Appeler OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const aiData = await aiResponse.json();
    const resultText = aiData.choices[0].message.content;

    // 4. Débiter 1 crédit et enregistrer le succès
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result: resultText, remaining_credits: profile.credits - 1 });

  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur interne" });
  }
}
