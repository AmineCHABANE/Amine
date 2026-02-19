import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function App() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user);
    });
  }, []);

  const fetchData = async (user) => {
    const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
    setCredits(profile?.credits || 0);
    const { data: key } = await supabase.from('api_keys').select('key_value').eq('user_id', user.id).single();
    if (key) setApiKey(key.key_value);
  };

  const handleAds = async (type) => {
    if (type === 'standard') {
      window.open("https://ton-lien-monetag.com", "_blank"); // REMPLACE ICI
      setLoading(true);
      await fetch('/api/reward', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${session?.access_token}` } 
      });
      fetchData(session.user);
      setLoading(false);
    } else {
      alert("Format Premium Google bientôt disponible !");
    }
  };

  if (!session) return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Amine API</h1>
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '10px' }} />
      <button onClick={() => supabase.auth.signInWithOtp({ email })} style={{ padding: '10px', background: 'black', color: 'white' }}>Accéder</button>
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Espace Créateur</h2>
        <button onClick={() => supabase.auth.signOut()}>Quitter</button>
      </header>

      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h3>💰 Crédits : {credits}</h3>
        <button onClick={() => handleAds('standard')} style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', borderRadius: '5px' }}>
          ⚡ Recharge Rapide (+5)
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h3>🔑 Ta Clé API</h3>
        <code style={{ background: '#eee', padding: '5px', display: 'block' }}>{apiKey || "Générez votre clé..."}</code>
        {!apiKey && <button onClick={async () => {
          const newK = `amine_live_${Math.random().toString(36).substring(7)}`;
          await supabase.from('api_keys').insert([{ user_id: session.user.id, key_value: newK }]);
          setApiKey(newK);
        }} style={{ width: '100%', marginTop: '10px' }}>Générer</button>}
      </div>

      <div style={{ marginTop: '30px', background: '#1e1e1e', color: '#fff', padding: '15px', borderRadius: '8px' }}>
        <h4>Documentation Express</h4>
        <pre style={{ fontSize: '12px' }}>{`fetch('https://api-amine.vercel.app/api/v1/chat', {
  headers: { 'x-api-key': '${apiKey || 'TA_CLE'}' },
  method: 'POST',
  body: JSON.stringify({ prompt: '...' })
})`}</pre>
      </div>
    </div>
  );
}

export default App;
