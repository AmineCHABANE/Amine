import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/* ═══════════════════════════════════════════
   STYLES — Glass Noir mobile-first
   ═══════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  :root {
    --bg: #060608;
    --surface: rgba(255,255,255,0.035);
    --surface-2: rgba(255,255,255,0.06);
    --surface-3: rgba(255,255,255,0.09);
    --glass: rgba(6,6,8,0.88);
    --border: rgba(255,255,255,0.07);
    --border-hi: rgba(255,255,255,0.14);
    --text: #f0f0f3;
    --text-2: #a0a3b1;
    --text-3: #5a5d6e;
    --mint: #34d399;
    --mint-dim: rgba(52,211,153,0.1);
    --blue: #818cf8;
    --blue-dim: rgba(129,140,248,0.1);
    --amber: #fbbf24;
    --amber-dim: rgba(251,191,36,0.1);
    --red: #f87171;
    --red-dim: rgba(248,113,113,0.1);
    --font: 'DM Sans', system-ui, sans-serif;
    --mono: 'JetBrains Mono', monospace;
    --r: 14px;
    --r-sm: 10px;
  }

  * { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

  body {
    background: var(--bg); color: var(--text);
    font-family: var(--font); -webkit-font-smoothing: antialiased;
    overflow-x: hidden; min-height: 100dvh;
  }

  ::selection { background: var(--mint); color: var(--bg); }

  .ambient {
    position:fixed; top:-40%; left:-20%; width:140%; height:80%;
    background: radial-gradient(ellipse at 30% 50%, rgba(52,211,153,0.04) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 30%, rgba(129,140,248,0.03) 0%, transparent 50%);
    pointer-events:none; z-index:0;
  }

  @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
  @keyframes spin { to{transform:rotate(360deg)} }

  .fade { animation: fadeIn .45s ease-out both; }
  .d1{animation-delay:.06s} .d2{animation-delay:.12s} .d3{animation-delay:.18s} .d4{animation-delay:.24s}

  /* Buttons — 44px min touch */
  .btn {
    font-family:var(--font); font-weight:500; font-size:14px;
    padding:11px 20px; border-radius:var(--r-sm);
    border:1px solid var(--border); background:var(--surface-2);
    color:var(--text); cursor:pointer; transition:all .2s;
    display:inline-flex; align-items:center; justify-content:center; gap:8px;
    min-height:44px; white-space:nowrap;
  }
  .btn:active{transform:scale(.97)} .btn:disabled{opacity:.35;cursor:not-allowed;transform:none}
  .btn-mint{background:var(--mint);color:var(--bg);border-color:var(--mint);font-weight:600}
  .btn-mint:hover{box-shadow:0 0 20px rgba(52,211,153,.2);color:var(--bg)}
  .btn-blue{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:600}
  .btn-amber{background:linear-gradient(135deg,var(--amber),#f59e0b);color:var(--bg);border-color:var(--amber);font-weight:600}
  .btn-amber:hover{box-shadow:0 0 20px rgba(251,191,36,.2);color:var(--bg)}
  .btn-ghost{background:transparent;border-color:transparent;color:var(--text-2)}
  .btn-ghost:hover{color:var(--text);background:var(--surface)}
  .btn-block{width:100%}

  /* Cards */
  .card {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r); padding:18px; transition:border-color .3s;
    backdrop-filter:blur(16px);
  }

  /* Tags */
  .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.3px}
  .tag-mint{background:var(--mint-dim);color:var(--mint)}
  .tag-blue{background:var(--blue-dim);color:var(--blue)}
  .tag-amber{background:var(--amber-dim);color:var(--amber)}
  .tag-red{background:var(--red-dim);color:var(--red)}

  /* Code */
  .code{background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:14px;font-family:var(--mono);font-size:12px;line-height:1.7;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .code .cm{color:var(--text-3)} .code .str{color:var(--mint)} .code .fn{color:#60a5fa}

  /* Toast */
  .toast{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:10002;padding:12px 22px;border-radius:var(--r);font-size:13px;font-weight:500;max-width:calc(100vw - 32px);animation:fadeIn .3s;backdrop-filter:blur(16px);text-align:center}
  .toast-success{background:rgba(52,211,153,.92);color:var(--bg)}
  .toast-error{background:rgba(248,113,113,.92);color:#fff}

  /* Input */
  input,textarea{font-family:var(--mono);font-size:14px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);padding:12px 14px;color:var(--text);width:100%;outline:none;transition:border-color .2s;min-height:44px}
  input:focus,textarea:focus{border-color:var(--mint)}

  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-thumb{background:var(--border-hi);border-radius:3px}

  /* Bottom nav */
  .bnav{position:fixed;bottom:0;left:0;right:0;background:var(--glass);backdrop-filter:blur(24px);border-top:1px solid var(--border);display:flex;justify-content:space-around;align-items:center;padding:4px 0 calc(4px + env(safe-area-inset-bottom,0px));z-index:200}
  .bnav button{background:none;border:none;color:var(--text-3);font-size:10px;font-family:var(--font);display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 14px;cursor:pointer;transition:color .2s;min-width:52px}
  .bnav button.on{color:var(--mint)}
  .bnav .ni{font-size:20px;line-height:1}

  @media(min-width:768px){.bnav{display:none}.mob{display:none!important}}
  @media(max-width:767px){.desk{display:none!important}}
`;

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const API_CATALOG = [
  { id:'chat', name:'AI Chat', icon:'🧠', method:'POST', endpoint:'/api/chat',
    description:'GPT-4o-mini text generation with caching', status:'live', cost:1,
    example:{ request:`curl -X POST https://api-amine.vercel.app/api/chat \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "Explain quantum computing"}'`,
      response:`{\n  "result": "Quantum computing uses qubits...",\n  "cached": false,\n  "credits_remaining": 42\n}` }},
  { id:'email-verify', name:'Email Verify', icon:'📧', method:'GET', endpoint:'/api/email-verify',
    description:'Validate emails: syntax, MX, disposable', status:'coming', cost:1,
    example:{ request:`curl "https://api-amine.vercel.app/api/email-verify?email=test@gmail.com" \\\n  -H "x-api-key: YOUR_KEY"`,
      response:`{\n  "valid": true,\n  "mx_found": true,\n  "disposable": false\n}` }},
  { id:'currency', name:'Currency', icon:'💱', method:'GET', endpoint:'/api/currency',
    description:'Real-time rates 170+ fiat & 50+ crypto', status:'coming', cost:1,
    example:{ request:`curl "https://api-amine.vercel.app/api/currency?from=EUR&to=USD&amount=100" \\\n  -H "x-api-key: YOUR_KEY"`,
      response:`{\n  "from": "EUR", "to": "USD",\n  "rate": 1.0847, "result": 108.47\n}` }},
  { id:'qrcode', name:'QR Code', icon:'📱', method:'GET', endpoint:'/api/qrcode',
    description:'Generate QR codes with custom colors', status:'coming', cost:1,
    example:{ request:`curl "https://api-amine.vercel.app/api/qrcode?data=hello&size=300" \\\n  -H "x-api-key: YOUR_KEY"`,
      response:`// Returns PNG image\n// Content-Type: image/png` }},
  { id:'ip-geo', name:'IP Geo', icon:'🌍', method:'GET', endpoint:'/api/ip-geo',
    description:'IP to location, VPN/proxy detection', status:'coming', cost:1,
    example:{ request:`curl "https://api-amine.vercel.app/api/ip-geo?ip=8.8.8.8" \\\n  -H "x-api-key: YOUR_KEY"`,
      response:`{\n  "ip": "8.8.8.8",\n  "country": "US",\n  "city": "Mountain View"\n}` }},
  { id:'shorten', name:'URL Short', icon:'🔗', method:'POST', endpoint:'/api/shorten',
    description:'Shorten URLs with click analytics', status:'coming', cost:1,
    example:{ request:`curl -X POST https://api-amine.vercel.app/api/shorten \\\n  -H "x-api-key: YOUR_KEY" \\\n  -d '{"url": "https://long-url.com/path"}'`,
      response:`{\n  "short_url": "https://api-amine.vercel.app/s/x7kQ2",\n  "clicks": 0\n}` }}
];

const PRICING = [
  { id:'free', name:'Free', price:'0', requests:'1,000 / month', features:['All APIs','10 req/min','Dashboard','Community support'], cta:'Start Free', pop:false },
  { id:'pro', name:'Pro', price:'19', requests:'50,000 / month', features:['Priority endpoints','100 req/min','Email support','Webhooks'], cta:'Upgrade', pop:true },
  { id:'enterprise', name:'Enterprise', price:'99', requests:'Unlimited', features:['Dedicated endpoints','No rate limit','Slack + SLA','Custom integrations'], cta:'Go Enterprise', pop:false },
];

const PACKS = [
  { id:'credits_5k', name:'5K', credits:5000, price:'$5', cents:500 },
  { id:'credits_25k', name:'25K', credits:25000, price:'$15', cents:1500 },
];


/* ═══ TOAST ═══ */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}


/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
function LandingPage({ onGoogleLogin, onEmailLogin }) {
  const [sel, setSel] = useState('chat');
  const api = API_CATALOG.find(a => a.id === sel);

  const GoogleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
  );

  return (
    <div style={{ position:'relative', zIndex:1 }}>
      {/* Nav */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--glass)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <span style={{ fontWeight:700, fontSize:17, color:'var(--mint)', letterSpacing:-.5 }}>⚡ AmineAPI</span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost desk" onClick={onEmailLogin} style={{ fontSize:13, padding:'8px 12px', minHeight:38 }}>Email</button>
          <button className="btn btn-mint" onClick={onGoogleLogin} style={{ fontSize:13, padding:'9px 16px', minHeight:38 }}>
            <GoogleIcon /> Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'48px 20px 40px', maxWidth:640, margin:'0 auto', textAlign:'center' }}>
        <div className="fade"><span className="tag tag-mint">✦ 1,000 free requests / month</span></div>
        <h1 className="fade d1" style={{ fontSize:'clamp(26px,7vw,48px)', fontWeight:700, lineHeight:1.08, margin:'16px 0', letterSpacing:-1.5, background:'linear-gradient(135deg, var(--text) 20%, var(--mint) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          One API key.<br/>Every tool you need.
        </h1>
        <p className="fade d2" style={{ color:'var(--text-2)', fontSize:'clamp(14px,3.5vw,16px)', maxWidth:400, margin:'0 auto 28px', lineHeight:1.65 }}>
          AI Chat, Email Verify, Currency, QR Codes, IP Geo — one fast REST API.
        </p>
        <div className="fade d3" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-mint" onClick={onGoogleLogin} style={{ fontSize:15, padding:'13px 28px' }}>Get Free API Key →</button>
          <button className="btn" onClick={onEmailLogin} style={{ padding:'13px 20px' }}>✉ Email</button>
        </div>

        <div className="fade d4" style={{ marginTop:36, textAlign:'left' }}>
          <div className="code">
            <span className="cm"># One line. That's it.</span><br/>
            <span className="fn">curl</span> <span className="str">-X POST</span> https://api-amine.vercel.app/api/chat \<br/>
            &nbsp;&nbsp;<span className="str">-H</span> <span className="str">"x-api-key: YOUR_KEY"</span> \<br/>
            &nbsp;&nbsp;<span className="str">-d</span> <span className="str">'{`{"prompt":"Hello"}`}'</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', padding:'16px' }}>
        <div style={{ maxWidth:640, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, textAlign:'center' }}>
          {[{l:'APIs',v:'6+'},{l:'Latency',v:'<120ms'},{l:'Uptime',v:'99.9%'},{l:'Free',v:'1K/mo'}].map((s,i) => (
            <div key={i}><div style={{ fontSize:'clamp(16px,4vw,22px)', fontWeight:700, color:'var(--mint)' }}>{s.v}</div><div style={{ fontSize:9, color:'var(--text-3)', marginTop:2, letterSpacing:1, textTransform:'uppercase' }}>{s.l}</div></div>
          ))}
        </div>
      </div>

      {/* APIs */}
      <section style={{ padding:'40px 16px', maxWidth:640, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(20px,5vw,26px)', fontWeight:700, marginBottom:6, textAlign:'center', letterSpacing:-.5 }}>Available APIs</h2>
        <p style={{ color:'var(--text-2)', textAlign:'center', marginBottom:24, fontSize:13 }}>One key. All included.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {API_CATALOG.map(a => (
            <div key={a.id} onClick={() => setSel(a.id)} className="card" style={{ cursor:'pointer', padding:12, textAlign:'center', borderColor:sel===a.id?'var(--mint)':undefined, background:sel===a.id?'var(--mint-dim)':undefined }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{a.icon}</div>
              <div style={{ fontSize:11, fontWeight:600 }}>{a.name}</div>
              <span className={`tag ${a.status==='live'?'tag-mint':'tag-amber'}`} style={{ fontSize:8, marginTop:4 }}>{a.status==='live'?'LIVE':'SOON'}</span>
            </div>
          ))}
        </div>
        {api && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, marginBottom:4 }}>REQUEST</div>
            <div className="code" style={{ fontSize:11, marginBottom:10 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--mint)' }}>{api.example.request}</pre></div>
            <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, marginBottom:4 }}>RESPONSE</div>
            <div className="code" style={{ fontSize:11 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--text-2)' }}>{api.example.response}</pre></div>
          </div>
        )}
      </section>

      {/* Pricing */}
      <section style={{ padding:'40px 16px', maxWidth:640, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(20px,5vw,26px)', fontWeight:700, marginBottom:6, textAlign:'center', letterSpacing:-.5 }}>Simple Pricing</h2>
        <p style={{ color:'var(--text-2)', textAlign:'center', marginBottom:24, fontSize:13 }}>Start free. Scale when ready.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {PRICING.map(t => (
            <div key={t.id} className="card" style={{ borderColor:t.pop?'var(--mint)':undefined, position:'relative', overflow:'hidden' }}>
              {t.pop && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--mint)' }} />}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                    <span style={{ fontSize:16, fontWeight:700 }}>{t.name}</span>
                    {t.pop && <span className="tag tag-mint" style={{ fontSize:9 }}>POPULAR</span>}
                  </div>
                  <span style={{ fontSize:24, fontWeight:700 }}>${t.price}</span>
                  <span style={{ color:'var(--text-3)', fontSize:12 }}>/mo · </span>
                  <span style={{ color:'var(--mint)', fontSize:12 }}>{t.requests}</span>
                </div>
                <button className={`btn ${t.pop?'btn-mint':''}`} onClick={onGoogleLogin} style={{ minWidth:100 }}>{t.cta}</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:10 }}>
                {t.features.map((f,i) => <span key={i} style={{ fontSize:11, color:'var(--text-2)', background:'var(--surface-2)', padding:'2px 8px', borderRadius:16 }}>✓ {f}</span>)}
                {t.id==='free' && <span style={{ fontSize:11, color:'var(--amber)', background:'var(--amber-dim)', padding:'2px 8px', borderRadius:16 }}>🎬 +ads for bonus</span>}
              </div>
            </div>
          ))}
        </div>
        <p style={{ color:'var(--text-3)', textAlign:'center', margin:'24px 0 12px', fontSize:12 }}>Or buy credit packs</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:340, margin:'0 auto' }}>
          {PACKS.map(p => (
            <div key={p.id} className="card" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--amber)' }}>{p.name}</div>
              <div style={{ fontSize:11, color:'var(--text-2)', margin:'4px 0' }}>{p.credits.toLocaleString()} req</div>
              <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>{p.price}</div>
              <button className="btn btn-amber btn-block" onClick={onGoogleLogin} style={{ fontSize:12, minHeight:38 }}>Buy</button>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop:'1px solid var(--border)', padding:'20px 16px', textAlign:'center' }}>
        <div style={{ fontSize:11, color:'var(--text-3)' }}>© 2026 AmineAPI — <a href="https://github.com/AmineCHABANE" style={{ color:'var(--text-2)', textDecoration:'none' }}>Amine Chabane</a> · Secured by <span style={{ color:'var(--blue)' }}>Stripe</span></div>
      </footer>
    </div>
  );
}


/* ═══════════════════════════════════════════
   DASHBOARD — Mobile-first + bottom nav
   ═══════════════════════════════════════════ */
function Dashboard({ session }) {
  const [credits, setCredits] = useState(0);
  const [plan, setPlan] = useState('free');
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [rewardInfo, setRewardInfo] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchData = useCallback(async () => {
    const { data: p } = await supabase.from('profiles').select('credits, plan').eq('id', session.user.id).single();
    setCredits(p?.credits || 0); setPlan(p?.plan || 'free');
    const { data: k } = await supabase.from('api_keys').select('key_value').eq('user_id', session.user.id).single();
    if (k) setApiKey(k.key_value);
  }, [session]);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase.from('usage_logs').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(20);
    setLogs(data || []);
  }, [session]);

  useEffect(() => {
    fetchData(); fetchLogs();
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') { showToast('Payment successful! Credits added.'); window.history.replaceState({}, '', window.location.pathname); setTimeout(fetchData, 2000); }
    else if (params.get('checkout') === 'cancelled') { showToast('Checkout cancelled.', 'error'); window.history.replaceState({}, '', window.location.pathname); }
  }, [fetchData, fetchLogs]);

  const generateKey = async () => {
    const a = new Uint8Array(24); crypto.getRandomValues(a);
    const key = `amineapi_live_${Array.from(a, b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)}`;
    await supabase.from('api_keys').upsert([{ user_id: session.user.id, key_value: key }]); setApiKey(key);
  };
  const copyKey = () => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const testApi = async () => {
    if (!testPrompt || !apiKey) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: testPrompt }) });
      const data = await res.json(); setTestResult(data); fetchData(); fetchLogs();
    } catch (e) { setTestResult({ error: e.message }); }
    setTesting(false);
  };

  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: planId, user_id: session.user.id, user_email: session.user.email }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url; else showToast(data.error || 'Failed', 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    setCheckoutLoading(null);
  };

  /* Ad Modal */
  const [adOpen, setAdOpen] = useState(false);
  const [adCount, setAdCount] = useState(30);
  const [adDone, setAdDone] = useState(false);
  const [adOk, setAdOk] = useState(false);
  const [adFail, setAdFail] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const openAd = () => { setAdOpen(true); setAdCount(30); setAdDone(false); setAdOk(false); setAdFail(false); };

  useEffect(() => {
    if (!adOpen || !adOk || adCount <= 0) { if (adCount <= 0 && adOk) setAdDone(true); return; }
    const t = setTimeout(() => setAdCount(c => c - 1), 1000); return () => clearTimeout(t);
  }, [adOpen, adCount, adOk]);

  useEffect(() => {
    if (!adOpen) return;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
    const at = setTimeout(() => {
      const c = document.getElementById('ad-box');
      if (!c) return;
      const f = document.getElementById('ad-msg'); if (f) f.style.display = 'none';
      window.atOptions = { key: '4597b34efe7f59ee1a483dc7cb84fc78', format: 'iframe', height: 250, width: 300, params: {} };
      const s = document.createElement('script'); s.src = 'https://www.highperformanceformat.com/4597b34efe7f59ee1a483dc7cb84fc78/invoke.js'; s.async = true; c.appendChild(s);
    }, 1500);
    const chk = setInterval(() => {
      const c = document.getElementById('ad-box'); if (!c) return;
      if (c.querySelector('iframe') || document.querySelector('.adsbygoogle[data-ad-status="filled"]')) { setAdOk(true); setAdFail(false); clearInterval(chk); }
    }, 1000);
    const fl = setTimeout(() => { setAdOk(ok => { if (!ok) setAdFail(true); return ok; }); }, 10000);
    return () => { clearTimeout(at); clearInterval(chk); clearTimeout(fl); };
  }, [adOpen]);

  const claim = async () => {
    if (!adDone) return; setClaiming(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const res = await fetch('/api/reward', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.access_token}` } });
      const data = await res.json();
      if (data.success) { setCredits(data.credits_balance); setRewardInfo({ remaining: data.rewards_remaining_today }); showToast(`+${data.credits_granted} credits! ${data.rewards_remaining_today} left today.`); setAdOpen(false); }
      else showToast(data.error || 'Failed', 'error');
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
    setClaiming(false);
  };

  const pLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const pColor = plan === 'enterprise' ? 'var(--amber)' : plan === 'pro' ? 'var(--blue)' : 'var(--mint)';
  const today = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;

  const TABS = [{ id:'overview', icon:'⚡', label:'Home' },{ id:'playground', icon:'🧪', label:'Test' },{ id:'billing', icon:'💳', label:'Billing' },{ id:'docs', icon:'📚', label:'Docs' }];

  return (
    <div style={{ position:'relative', zIndex:1, paddingBottom:72 }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* AD MODAL */}
      {adOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#0c0d11', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:22, maxWidth:400, width:'100%', textAlign:'center', position:'relative' }}>
            <button onClick={() => setAdOpen(false)} style={{ position:'absolute', top:10, right:14, background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:20, padding:4 }}>✕</button>
            <div style={{ fontSize:22, marginBottom:4 }}>🎬</div>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Watch Ad → 3 Credits</h3>
            <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:14 }}>View 30 seconds to claim.</p>

            <div style={{ background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', minHeight:250, marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
              <ins className="adsbygoogle" style={{ display:'block', width:'100%', height:250 }} data-ad-client="ca-pub-7526517043500512" data-ad-slot="auto" data-ad-format="rectangle" data-full-width-responsive="true" />
              <div id="ad-box" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div id="ad-msg" style={{ padding:14, textAlign:'center', color:'var(--text-3)', fontSize:11 }}>
                  <div style={{ fontSize:32, marginBottom:6, opacity:.3 }}>📢</div>Loading ad...
                </div>
              </div>
            </div>

            {!adDone ? (
              <div>
                <div style={{ width:50, height:50, borderRadius:'50%', border:`3px solid ${adOk?'var(--amber)':'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 8px', fontSize:20, fontWeight:700, color:adOk?'var(--amber)':'var(--text-3)' }}>
                  {adOk ? adCount : '⏸'}
                </div>
                <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:6 }}>{adOk ? `${adCount}s remaining` : 'Waiting for ad...'}</p>
                <div style={{ width:'100%', height:3, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:adOk?`${((30-adCount)/30)*100}%`:'0%', height:'100%', background:'var(--amber)', borderRadius:2, transition:'width 1s linear' }} />
                </div>
                {adFail && (
                  <div style={{ marginTop:12, padding:10, background:'var(--red-dim)', borderRadius:'var(--r-sm)' }}>
                    <p style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>Ad failed — no credits</p>
                    <p style={{ fontSize:10, color:'var(--text-3)', marginTop:2 }}>Disable ad blocker or buy credits.</p>
                    <div style={{ display:'flex', gap:6, marginTop:8, justifyContent:'center' }}>
                      <button className="btn" onClick={() => { setAdOpen(false); setTimeout(openAd, 300); }} style={{ fontSize:11, padding:'6px 14px', minHeight:34 }}>🔄 Retry</button>
                      <button className="btn btn-blue" onClick={() => { setAdOpen(false); setActiveTab('billing'); }} style={{ fontSize:11, padding:'6px 14px', minHeight:34 }}>💳 Buy</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn btn-mint btn-block" onClick={claim} disabled={claiming} style={{ fontSize:15, padding:14, animation:'pulse 1.5s infinite' }}>
                {claiming ? '⏳ Claiming...' : '✓ Claim +3 Credits!'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top bar */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--glass)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:16, color:'var(--mint)' }}>⚡</span>
          <div className="desk" style={{ display:'flex', gap:2 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background:activeTab===t.id?'var(--surface-2)':'transparent', border:'none', color:activeTab===t.id?'var(--text)':'var(--text-3)', cursor:'pointer', fontSize:13, fontFamily:'var(--font)', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'all .2s' }}>{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="tag" style={{ background:`${pColor}15`, color:pColor, fontSize:10 }}>{pLabel}</span>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()} style={{ fontSize:11, padding:'5px 10px', minHeight:34 }}>Sign Out</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth:640, margin:'0 auto', padding:'16px' }}>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              <div className="card"><div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Credits</div><div style={{ fontSize:26, fontWeight:700, color:credits>10?'var(--mint)':'var(--red)' }}>{credits.toLocaleString()}</div></div>
              <div className="card"><div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>Today</div><div style={{ fontSize:26, fontWeight:700 }}>{today}</div></div>
            </div>

            <div className="card" style={{ marginBottom:14, borderColor:'rgba(251,191,36,.15)', background:'linear-gradient(135deg,var(--surface),rgba(251,191,36,.03))' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>🎬 Watch & Earn</div>
                  <p style={{ fontSize:12, color:'var(--text-2)', lineHeight:1.4 }}>{rewardInfo ? `${rewardInfo.remaining} left today` : '5×/day = 15 free credits'}</p>
                </div>
                <button className="btn btn-amber" onClick={openAd}>▶ Watch (+3)</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:13, fontWeight:600 }}>🔑 API Key</span>
                {apiKey && <button className="btn btn-ghost" onClick={copyKey} style={{ fontSize:11, padding:'3px 10px', minHeight:30 }}>{copied ? '✓ Copied' : 'Copy'}</button>}
              </div>
              {apiKey ? (
                <code style={{ fontSize:11, color:'var(--mint)', background:'var(--surface-2)', padding:'10px 12px', borderRadius:8, display:'block', wordBreak:'break-all', fontFamily:'var(--mono)' }}>{apiKey}</code>
              ) : (
                <button className="btn btn-mint btn-block" onClick={generateKey}>Generate API Key</button>
              )}
            </div>

            {credits <= 0 && (
              <div className="card" style={{ borderColor:'rgba(248,113,113,.15)', textAlign:'center', padding:18 }}>
                <p style={{ color:'var(--red)', fontWeight:600, marginBottom:10, fontSize:13 }}>No credits remaining</p>
                <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                  <button className="btn btn-amber" onClick={openAd}>🎬 Watch (+3)</button>
                  <button className="btn btn-blue" onClick={() => setActiveTab('billing')}>💳 Buy</button>
                </div>
              </div>
            )}

            {logs.length > 0 && (
              <div style={{ marginTop:14 }}>
                <h3 style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Recent Activity</h3>
                <div className="card" style={{ padding:0, overflow:'hidden' }}>
                  {logs.slice(0, 6).map((l, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 14px', borderTop:i>0?'1px solid var(--border)':'none', fontSize:11 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ color:l.status_code===200?'var(--mint)':'var(--red)', fontSize:8 }}>●</span>
                        <code style={{ fontFamily:'var(--mono)', color:'var(--text-2)', fontSize:10 }}>{l.endpoint}</code>
                      </div>
                      <span style={{ color:'var(--text-3)', fontSize:9 }}>{new Date(l.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLAYGROUND */}
        {activeTab === 'playground' && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🧪 Playground</h2>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:16 }}>Test the AI Chat API.</p>
            <div className="card">
              <label style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, textTransform:'uppercase', display:'block', marginBottom:4 }}>Prompt</label>
              <textarea rows={3} value={testPrompt} onChange={e => setTestPrompt(e.target.value)} placeholder="Ask anything..." style={{ resize:'vertical', marginBottom:10 }} />
              <button className="btn btn-mint btn-block" onClick={testApi} disabled={testing || !testPrompt || !apiKey}>
                {testing ? '⏳ Running...' : '▶ Send Request'}
              </button>
              {!apiKey && <p style={{ textAlign:'center', color:'var(--amber)', fontSize:12, marginTop:10 }}>Generate an API key first</p>}
              {testResult && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:10, color:'var(--text-3)', letterSpacing:1, marginBottom:4 }}>RESPONSE</div>
                  <div className="code" style={{ fontSize:11 }}>
                    <pre style={{ whiteSpace:'pre-wrap', margin:0, color:testResult.error?'var(--red)':'var(--text-2)' }}>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BILLING */}
        {activeTab === 'billing' && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>💳 Billing</h2>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:16 }}>{credits.toLocaleString()} credits · {pLabel} plan</p>

            <div className="card" style={{ marginBottom:16, borderColor:'rgba(251,191,36,.12)', background:'linear-gradient(135deg,var(--surface),rgba(251,191,36,.03))', textAlign:'center' }}>
              <div style={{ fontSize:28, marginBottom:4 }}>🎬</div>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Free Credits</h3>
              <p style={{ fontSize:12, color:'var(--text-2)', marginBottom:12 }}>{rewardInfo ? `${rewardInfo.remaining} left today` : '5× per day = 15 free'}</p>
              <button className="btn btn-amber" onClick={openAd} style={{ padding:'12px 28px' }}>▶ Watch Ad (+3)</button>
            </div>

            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>⚡ Credit Packs</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
              {PACKS.map(p => (
                <div key={p.id} className="card" style={{ textAlign:'center', padding:14 }}>
                  <div style={{ fontSize:20, fontWeight:700, color:'var(--amber)' }}>{p.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-2)', margin:'3px 0' }}>{p.credits.toLocaleString()} req</div>
                  <div style={{ fontSize:10, color:'var(--mint)', marginBottom:3 }}>${(p.cents / p.credits * 100).toFixed(2)}/100</div>
                  <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{p.price}</div>
                  <button className="btn btn-amber btn-block" onClick={() => handleCheckout(p.id)} disabled={checkoutLoading===p.id} style={{ fontSize:12, minHeight:38 }}>
                    {checkoutLoading===p.id ? '⏳...' : `Buy ${p.price}`}
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>🚀 Monthly Plans</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {PRICING.map(t => {
                const cur = plan === t.id;
                return (
                  <div key={t.id} className="card" style={{ borderColor:cur?pColor:t.pop?'var(--mint)':undefined, opacity:cur?.65:1, position:'relative', overflow:'hidden' }}>
                    {t.pop && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--mint)' }} />}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <span style={{ fontSize:15, fontWeight:700 }}>{t.name}</span>
                          {cur && <span className="tag tag-mint" style={{ fontSize:9 }}>CURRENT</span>}
                        </div>
                        <span style={{ fontSize:22, fontWeight:700 }}>${t.price}</span>
                        <span style={{ color:'var(--text-3)', fontSize:11 }}>/mo · </span>
                        <span style={{ color:'var(--mint)', fontSize:11 }}>{t.requests}</span>
                      </div>
                      <button className={`btn ${t.pop&&!cur?'btn-blue':''}`} onClick={() => t.id!=='free'&&!cur&&handleCheckout(t.id)} disabled={cur||t.id==='free'||checkoutLoading===t.id} style={{ minWidth:90 }}>
                        {cur ? '✓ Current' : checkoutLoading===t.id ? '⏳...' : t.id==='free' ? 'Free' : t.cta}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--text-3)' }}>🔒 Payments by <span style={{ color:'var(--blue)' }}>Stripe</span></p>
          </div>
        )}

        {/* DOCS */}
        {activeTab === 'docs' && (
          <div>
            <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📚 API Docs</h2>
            <p style={{ color:'var(--text-2)', fontSize:13, marginBottom:16 }}>Complete endpoint reference.</p>
            {API_CATALOG.map(a => (
              <div key={a.id} className="card" style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:6 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:18 }}>{a.icon}</span>
                    <div><div style={{ fontSize:13, fontWeight:700 }}>{a.name}</div><div style={{ fontSize:10, color:'var(--text-3)' }}>{a.description}</div></div>
                  </div>
                  <div style={{ display:'flex', gap:4 }}>
                    <span className="tag tag-blue" style={{ fontSize:9 }}>{a.method}</span>
                    <span className={`tag ${a.status==='live'?'tag-mint':'tag-amber'}`} style={{ fontSize:9 }}>{a.status==='live'?'LIVE':'SOON'}</span>
                  </div>
                </div>
                <div style={{ fontSize:9, color:'var(--text-3)', letterSpacing:1, marginBottom:3 }}>REQUEST</div>
                <div className="code" style={{ fontSize:10, marginBottom:8 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--mint)' }}>{a.example.request}</pre></div>
                <div style={{ fontSize:9, color:'var(--text-3)', letterSpacing:1, marginBottom:3 }}>RESPONSE</div>
                <div className="code" style={{ fontSize:10 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--text-2)' }}>{a.example.response}</pre></div>
              </div>
            ))}
            <div className="card">
              <h3 style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Error Codes</h3>
              {[{c:400,m:'Bad Request'},{c:401,m:'Unauthorized'},{c:402,m:'No credits'},{c:429,m:'Rate limited'},{c:500,m:'Server error'}].map(e => (
                <div key={e.c} style={{ display:'flex', gap:8, padding:'6px 0', borderTop:'1px solid var(--border)', fontSize:11 }}>
                  <code style={{ color:'var(--red)', fontWeight:600, minWidth:28, fontFamily:'var(--mono)' }}>{e.c}</code>
                  <span style={{ color:'var(--text-2)' }}>{e.m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div className="bnav">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={activeTab===t.id?'on':''}>
            <span className="ni">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}


/* ═══ ROOT ═══ */
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const gl = async () => { const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } }); if (error) alert(error.message); };
  const el = async () => { const e = prompt('Enter your email:'); if (!e) return; const { error } = await supabase.auth.signInWithOtp({ email: e }); if (error) alert(error.message); else alert('Check your email!'); };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'var(--bg)' }}>
      <div style={{ animation:'spin 1s linear infinite', width:24, height:24, border:'2px solid rgba(255,255,255,.1)', borderTopColor:'var(--mint)', borderRadius:'50%' }} />
    </div>
  );

  return (<><style>{CSS}</style><div className="ambient" />{session ? <Dashboard session={session} /> : <LandingPage onGoogleLogin={gl} onEmailLogin={el} />}</>);
}

export default App;
