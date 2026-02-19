import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Connexion automatique à ta base de données via les variables Vercel
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL, 
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function App() {
  const [credits, setCredits] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Charger les crédits au démarrage
  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      setCredits(data?.credits || 0);
    }
  };

  // LOGIQUE PUB : Simule le gain de 10 crédits après une pub
  const handleWatchAd = async () => {
    alert("Lecture de la publicité... (Simulé)");
    // On appelle ton API backend 'reward.js' pour ajouter les crédits
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/reward', {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    fetchCredits();
    alert("Bravo ! +10 crédits ajoutés.");
  };

  // LOGIQUE IA : Appelle ton backend 'generate.js'
  const handleGenerate = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${session?.access_token}` 
      },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    setResult(data.result);
    setLoading(false);
    fetchCredits();
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>Amine AI Creator</h1>
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px' }}>
        <p>💰 Crédits : <strong>{credits}</strong></p>
        <button onClick={handleWatchAd} style={{ background: '#FFD700', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
          📺 Regarder une Pub (+10)
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <textarea 
          placeholder="Posez votre question ici..." 
          style={{ width: '100%', height: '100px' }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={handleGenerate} 
          disabled={loading || credits < 1}
          style={{ width: '100%', padding: '15px', background: 'black', color: 'white', marginTop: '10px', borderRadius: '5px' }}
        >
          {loading ? "Génération..." : "Générer (1 Crédit)"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <strong>Résultat :</strong>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
