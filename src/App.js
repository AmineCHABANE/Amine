import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function App() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user);
    });
  }, []);

  const fetchData = async (user) => {
    // Récupérer les crédits
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    setCredits(profile?.credits || 0);

    // Récupérer la clé API si elle existe déjà
    const { data: keyData } = await supabase.from('api_keys').select('key_value').eq('user_id', user.id).single();
    if (keyData) setApiKey(keyData.key_value);
  };

  const generateNewKey = async () => {
    setLoading(true);
    const newKey = `amine_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    const { error } = await supabase.from('api_keys').insert([
      { user_id: session.user.id, key_value: newKey }
    ]);

    if (error) {
      alert("Erreur : Vous avez peut-être déjà une clé ou un problème de connexion.");
    } else {
      setApiKey(newKey);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert("Lien envoyé par email !");
    setLoading(false);
  };

  if (!session) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Amine API</h1>
        <p>Espace Créateur - Accès Gratuit à l'IA</p>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px', width: '250px' }} />
        <button onClick={handleLogin} style={{ padding: '10px 20px', marginLeft: '10px', background: 'black', color: 'white' }}>Se connecter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <h1>Dashboard Créateur</h1>
      
      {/* SECTION CREDITS */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #eee' }}>
        <h3>💰 Tes Crédits : {credits}</h3>
        <p style={{ fontSize: '0.9em', color: '#666' }}>Regarde une publicité pour recharger ton compte et utiliser l'API gratuitement.</p>
        <button style={{ width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          📺 Regarder une Pub (+10 Crédits)
        </button>
      </div>

      {/* SECTION API KEY */}
      <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', border: '1px solid #ddd' }}>
        <h3>🔑 Ta Clé API</h3>
        {apiKey ? (
          <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '5px', wordBreak: 'break-all', fontWeight: 'mono', border: '1px dashed #adb5bd' }}>
            <code>{apiKey}</code>
          </div>
        ) : (
          <button onClick={generateNewKey} disabled={loading} style={{ width: '100%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
            {loading ? "Génération..." : "Générer ma clé API"}
          </button>
        )}
        <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
          Garde cette clé secrète. Elle te permet d'appeler notre service depuis tes propres applications.
        </p>
      </div>

      <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '30px', background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>Se déconnecter</button>
    </div>
  );
}

export default App;
