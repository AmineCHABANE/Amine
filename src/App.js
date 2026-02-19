import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Récupération des clés
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// 2. Initialisation conditionnelle
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

function App() {
  const [credits, setCredits] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Diagnostic précis si les clés manquent
    if (!supabase) {
      const urlStatus = supabaseUrl ? "URL: OK" : "URL: MANQUANTE";
      const keyStatus = supabaseKey ? "KEY: OK" : "KEY: MANQUANTE";
      setErrorMsg(`Erreur de Cache Vercel -> ${urlStatus} | ${keyStatus}`);
      return;
    }
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      setCredits(data?.credits || 0);
    }
  };

  const handleWatchAd = async () => {
    alert("Lecture de la publicité...");
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/reward', {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    fetchCredits();
  };

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
    setResult(data.result || data.error);
    setLoading(false);
    fetchCredits();
  };

  // L'ÉCRAN D'ERREUR (Vérification du cache)
  if (errorMsg) {
    return (
      <div style={{ padding: '20px', background: '#ffebee', color: '#c62828', fontFamily: 'sans-serif', margin: '20px', borderRadius: '10px' }}>
        <h2>🚨 Diagnostic v2</h2>
        <p>{errorMsg}</p>
        <p><strong>Action :</strong> Va sur Vercel > onglet Deployments > clique sur les 3 points du dernier déploiement > <strong>Redeploy</strong> (décoche "Use existing build cache" si demandé).</p>
      </div>
    );
  }

  // L'ÉCRAN NORMAL
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>Amine AI Creator (v2)</h1>
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px' }}>
        <p>💰 Crédits : <strong>{credits}</strong></p>
        <button onClick={handleWatchAd} style={{ background: '#FFD700', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
          📺 Regarder une Pub (+10)
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <textarea 
          placeholder="Posez votre question ici..." 
          style={{ width: '100%', height: '100px', padding: '10px', boxSizing: 'border-box' }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={handleGenerate} 
          disabled={loading}
          style={{ width: '100%', padding: '15px', background: 'black', color: 'white', marginTop: '10px', borderRadius: '5px', fontWeight: 'bold' }}
        >
          {loading ? "Génération en cours..." : "Générer (1 Crédit)"}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px', background: '#fff' }}>
          <strong>Résultat IA :</strong>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
