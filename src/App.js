import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

function App() {
  const [session, setSession] = useState(null);
  const [credits, setCredits] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchData(session.user); fetchLogs(session.user); }
    });
  }, []);

  const fetchData = async (u) => {
    const { data: p } = await supabase.from('profiles').select('credits').eq('id', u.id).single();
    setCredits(p?.credits || 0);
    const { data: k } = await supabase.from('api_keys').select('key_value').eq('user_id', u.id).single();
    if (k) setApiKey(k.key_value);
  };

  const fetchLogs = async (u) => {
    const { data } = await supabase.from('usage_logs').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(5);
    setLogs(data || []);
  };

  const handleWaterfall = async (t) => {
    setLoading(true);
    if (t === 'fast') window.open("https://ton-lien-monetag.com", "_blank");
    else alert("Google Ads Premium - Chargement...");
    
    await fetch('/api/reward', { method: 'POST', headers: { 'Authorization': `Bearer ${session?.access_token}` } });
    fetchData(session.user);
    setLoading(false);
  };

  if (!session) return <div style={{textAlign: 'center', marginTop: '100px'}}><h1>Amine API</h1><button onClick={() => supabase.auth.signInWithOtp({email: prompt("Ton email ?")})}>Connexion par Email</button></div>;

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto', fontFamily: 'sans-serif' }}>
      <div style={{display:'flex', justifyContent:'space-between'}}><h2>Console Développeur</h2><button onClick={() => supabase.auth.signOut()}>Sortir</button></div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
        <div style={{background:'#f9f9f9', padding:'20px', borderRadius:'10px', border:'1px solid #ddd'}}>
          <h3>💰 Solde : {credits}</h3>
          <button onClick={() => handleWaterfall('fast')} style={{width:'100%', padding:'10px', background:'black', color:'white', marginBottom:'10px'}}>⚡ Recharge +5 (Rapide)</button>
          <button onClick={() => handleWaterfall('premium')} style={{width:'100%', padding:'10px', background:'#FFD700', border:'none', fontWeight:'bold'}}>💎 Recharge +20 (Premium)</button>
        </div>
        <div style={{padding:'20px', border:'1px solid #ddd', borderRadius:'10px'}}>
          <h3>🔑 Clé API</h3>
          <code style={{fontSize:'12px', background:'#eee', padding:'5px'}}>{apiKey || "---"}</code>
          {!apiKey && <button onClick={async () => {
            const key = `amine_live_${Math.random().toString(36).substring(7)}`;
            await supabase.from('api_keys').insert([{user_id: session.user.id, key_value: key}]);
            setApiKey(key);
          }} style={{width:'100%', marginTop:'10px'}}>Générer</button>}
        </div>
      </div>

      <div style={{marginTop:'30px'}}>
        <h3>📊 Historique des appels</h3>
        <table style={{width:'100%', fontSize:'13px', borderCollapse:'collapse'}}>
          {logs.map(l => (
            <tr key={l.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px'}}>{new Date(l.created_at).toLocaleTimeString()}</td><td>{l.prompt_summary}</td><td style={{color:'green'}}>-1 Crédit</td></tr>
          ))}
        </table>
      </div>
    </div>
  );
}
export default App;
