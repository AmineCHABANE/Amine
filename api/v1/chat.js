import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST requis' });

  const { prompt } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (!prompt || !apiKey) return res.status(400).json({ error: 'Données manquantes' });

  try {
    // 1. IDENTIFICATION
    const { data: keyData } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
    if (!keyData) return res.status(403).json({ error: 'Clé invalide' });

    // 2. SÉCURITÉ (RATE LIMIT) - On vérifie le cooldown de 2 secondes
    const { data: lastUsage } = await supabase
      .from('usage_logs')
      .select('created_at')
      .eq('user_id', keyData.user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastUsage) {
      const diff = new Date() - new Date(lastUsage.created_at);
      if (diff < 2000) { 
        return res.status(429).json({ error: "Trop de requêtes. Attendez 2 secondes entre chaque appel." });
      }
    }

    // 3. VÉRIFICATION CRÉDITS
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', keyData.user_id).single();
    if (!profile || profile.credits <= 0) return res.status(402).json({ error: 'Solde épuisé' });

    // 4. APPEL OPENAI (GPT-4o-mini)
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt.substring(0, 500) }], // On limite la taille du texte envoyé
        max_tokens: 300
      })
    });

    const aiData = await aiRes.json();
    const resultText = aiData.choices[0].message.content;

    // 5. ENREGISTREMENT DU LOG (Essentiel pour le rate limit et l'historique)
    await supabase.from('usage_logs').insert([
      { user_id: keyData.user_id, prompt: prompt.substring(0, 100) + "..." }
    ]);

    // 6. DÉBIT DU CRÉDIT
    await supabase.rpc('decrement_credits', { user_id_input: keyData.user_id });

    return res.status(200).json({ result: resultText });

  } catch (error) {
    return res.status(500).json({ error: 'Erreur technique. Crédit non débité.' });
  }
}
