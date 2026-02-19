import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto'; // Pour créer le hash du prompt

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });

  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (!prompt || !apiKey) return res.status(400).json({ error: 'Données manquantes' });

  // Générer un ID unique pour ce texte (Hash)
  const hash = crypto.createHash('md5').update(prompt.toLowerCase().trim()).digest('hex');

  try {
    // 1. Vérification Clé & Crédits
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
    if (!keyData) return res.status(403).json({ error: 'Clé invalide' });

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', keyData.user_id).single();
    if (!profile || profile.credits <= 0) return res.status(402).json({ error: 'Solde épuisé' });

    // 2. OPTIMISATION 1 : Vérifier le Cache (Gain de temps et d'argent)
    const { data: cachedResponse } = await supabase.from('ai_cache').select('response_text').eq('prompt_hash', hash).single();

    if (cachedResponse) {
      await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });
      return res.status(200).json({ result: cachedResponse.response_text, source: 'cache' });
    }

    // 3. Appel OpenAI (Modèle GPT-4o-mini : Plus performant et moins cher)
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      })
    });

    const aiData = await aiRes.json();
    const finalResult = aiData.choices[0].message.content;

    // 4. Sauvegarder dans le cache pour la prochaine fois
    await supabase.from('ai_cache').insert([{ prompt_hash: hash, response_text: finalResult }]);

    // 5. Débit du crédit
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result: finalResult, source: 'openai' });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur technique' });
  }
}
