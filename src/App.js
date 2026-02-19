import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function App() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user);
    });
  }, []);

  const fetchData = async (user) => {
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    setCredits(profile?.credits || 0);
    const { data: keyData } = await supabase.from('api_keys').select('key_value').eq('user_id', user.id).single();
    if (keyData) setApiKey(keyData.key_value);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateNewKey = async () => {
    setLoading(true);
    const newKey = `amine_live_${Math.random().toString(36).substring(2, 15)}`;
    const { error } = await supabase.from('api_keys').insert([{ user_id: session.user.id, key_value: newKey }]);
    if (error) alert("Erreur : Clé déjà existante.");
    else setApiKey(newKey);
    setLoading(false);
  };

  if (!session) return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Amine API Gateway</h1>
      <p>Accès IA gratuit pour développeurs</p>
      <input type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '12px', width: '250px', borderRadius: '5px', border: '1px solid #ccc' }} />
      <button onClick={() => supabase.auth.signInWithOtp({ email })} style={{ padding: '12px 20px', marginLeft: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Connexion</button>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto', fontFamily: 'system-ui' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Dashboard Amine API</h2>
        <button onClick={() => supabase.auth.signOut()} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Déconnexion</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* COMPTEUR DE CRÉDITS */}
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea', background: '#fafafa' }}>
          <h3>Statut du compte</h3>
          <div style={{ fontSize: '2em', fontWeight: 'bold' }}>{credits} <span style={{ fontSize: '0.4em' }}>crédits</span></div>
          <p style={{ color: credits > 0 ? 'green' : 'red', fontWeight: 'bold' }}>● {credits > 0 ? 'Clé Active' : 'Clé Suspendue'}</p>
          <button style={{ width: '100%', padding: '15px', marginTop: '10px', background: '#FFD700', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
            📺 Recharger via Publicité
          </button>
        </div>

        {/* GESTION CLÉ API */}
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #eaeaea' }}>
          <h3>Ma Clé API</h3>
          {apiKey ? (
            <div>
              <div style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: '10px' }}>{apiKey}</div>
              <button onClick={copyToClipboard} style={{ width: '100%', padding: '10px' }}>{copied ? "✅ Copié !" : "📋 Copier la clé"}</button>
            </div>
          ) : (
            <button onClick={generateNewKey} style={{ width: '100%', padding: '15px', background: '#000', color: '#fff', borderRadius: '8px' }}>Générer ma clé</button>
          )}
        </div>
      </div>

      {/* DOCUMENTATION */}
      <div style={{ marginTop: '40px' }}>
        <h3>🚀 Intégration Rapide</h3>
        <p>Utilisez cet endpoint dans votre code :</p>
        <div style={{ background: '#1e1e1e', color: '#fff', padding: '20px', borderRadius: '8px', overflowX: 'auto' }}>
          <pre>{`// Endpoint : POST https://api-amine.vercel.app/api/v1/chat
// Header : x-api-key: ${apiKey || 'VOTRE_CLE'}

fetch('https://api-amine.vercel.app/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-api-key': '${apiKey || 'VOTRE_CLE'}' },
  body: JSON.stringify({ prompt: 'Bonjour !' })
})`}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;
