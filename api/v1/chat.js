import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });

  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];
  if (!prompt || !apiKey) return res.status(400).json({ error: 'Données manquantes' });

  const hash = crypto.createHash('md5').update(prompt.toLowerCase().trim()).digest('hex');

  try {
    // Vérification de la clé et de l'utilisateur
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
    if (!keyData) return res.status(403).json({ error: 'Clé API invalide' });

    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', keyData.user_id).single();
    if (!profile || profile.credits <= 0) return res.status(402).json({ error: 'Crédits insuffisants. Rechargez sur le site.' });

    // OPTIMISATION : Vérification du Cache
    const { data: cached } = await supabase.from('ai_cache').select('response_text').eq('prompt_hash', hash).single();
    if (cached) {
      await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });
      return res.status(200).json({ result: cached.response_text, info: 'Serveur optimisé (Cache)' });
    }

    // Appel OpenAI (Modèle économique GPT-4o-mini)
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
    const resultText = aiData.choices[0].message.content;

    // Mise en cache + Débit
    await supabase.from('ai_cache').insert([{ prompt_hash: hash, response_text: resultText }]);
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur technique backend' });
  }
}
