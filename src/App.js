import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchCredits(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchCredits(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCredits = async (user) => {
    const { data } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    setCredits(data?.credits || 0);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert("Erreur : " + error.message);
    else alert("Vérifie ta boîte mail ! Clique sur le lien pour te connecter.");
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (credits <= 0) {
      setResult("Vous n'avez plus de crédits. Veuillez regarder une publicité.");
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.result) {
        setResult(data.result);
        fetchCredits(session.user);
      } else {
        setResult("Erreur IA : " + JSON.stringify(data));
      }
    } catch (e) {
      setResult("Erreur de communication avec le serveur.");
    }
    setLoading(false);
  };

  const handleWatchAd = async () => {
    alert("Lancement de la publicité...");
    try {
      const res = await fetch('/api/reward', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await res.json();
      if(data.success) {
         alert("10 Crédits ajoutés !");
         fetchCredits(session.user);
      } else {
         alert("Erreur validation : " + JSON.stringify(data));
      }
    } catch (e) {
      alert("Erreur de réseau avec la régie publicitaire.");
    }
  };

  // 🔒 ÉCRAN DE CONNEXION (Si non connecté)
  if (!session) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Amine AI Creator</h1>
        <p>Identifie-toi pour accéder à l'IA</p>
        <input 
          type="email" 
          placeholder="Ton adresse email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', padding: '10px', background: 'black', color: 'white', fontWeight: 'bold' }}>
          {loading ? "Envoi en cours..." : "Recevoir mon lien d'accès"}
        </button>
      </div>
    );
  }

  // 🔓 ÉCRAN PRINCIPAL (Si connecté)
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Amine AI</h1>
        <button onClick={() => supabase.auth.signOut()} style={{ background: 'transparent', border: '1px solid #ccc', padding: '5px 10px', borderRadius: '5px' }}>Déconnexion</button>
      </div>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px' }}>
        <p>💰 Crédits : <strong>{credits}</strong></p>
        <button onClick={handleWatchAd} style={{ background: '#FFD700', border: 'none', padding: '10px', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
          📺 Regarder une Pub (+10)
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <textarea 
          placeholder="Pose ton prompt ici..." 
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
