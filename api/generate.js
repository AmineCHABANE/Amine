import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Connexion à ta base Supabase
const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function App() {
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const session = supabase.auth.session();
    setUser(session?.user ?? null);
    if (session?.user) fetchCredits(session.user.id);
  }, []);

  const fetchCredits = async (userId) => {
    const { data } = await supabase.from('profiles').select('credits').eq('id', userId).single();
    if (data) setCredits(data.credits);
  };

  // --- LE MOTEUR DE REVENUS : LA PUB ---
  const watchAdAndEarn = async () => {
    alert("Lancement de la publicité... (Simulé pour le MVP)");
    
    // ICI : Tu intégreras ton script Google AdSense ou Monetag
    setTimeout(async () => {
      // Une fois la pub finie, on appelle notre API pour ajouter 10 crédits
      await fetch('/api/reward', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabase.auth.session()?.access_token}` }
      });
      fetchCredits(user.id);
      alert("Bravo ! +10 crédits ajoutés.");
    }, 5000); // On simule 5 secondes de pub
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Amine API Hub</h1>
      
      {!user ? (
        <button onClick={() => supabase.auth.signIn({ provider: 'google' })}>Se connecter avec Google</button>
      ) : (
        <div>
          <p>Bienvenue ! 💰 <strong>Solde : {credits} crédits</strong></p>
          
          <button onClick={watchAdAndEarn} style={{ background: 'gold', padding: '10px' }}>
            📺 Regarder une pub (+10 crédits)
          </button>

          <hr />

          <h3>Tester l'IA</h3>
          <button 
            onClick={async () => {
              setLoading(true);
              const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${supabase.auth.session()?.access_token}`
                },
                body: JSON.stringify({ prompt: "Écris un slogan pour une API d'IA gratuite." })
              });
              const data = await res.json();
              setResult(data.result);
              setLoading(false);
              fetchCredits(user.id);
            }}
            disabled={loading || credits < 1}
          >
            {loading ? "Calcul en cours..." : "Générer (1 crédit)"}
          </button>

          {result && <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>{result}</div>}
        </div>
      )}
    </div>
  );
}

export default App;
