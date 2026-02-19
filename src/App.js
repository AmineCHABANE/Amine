import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/* ═══════════════════════════════════════════
   STYLES — Terminal-meets-Stripe aesthetic
   ═══════════════════════════════════════════ */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Sora:wght@300;400;500;600;700&display=swap');

  :root {
    --bg: #07080a;
    --surface: #0d0f12;
    --surface-2: #141720;
    --border: #1e2230;
    --border-hover: #2a3045;
    --text: #e2e4ea;
    --text-muted: #6b7280;
    --text-dim: #3d4455;
    --accent: #10b981;
    --accent-glow: rgba(16, 185, 129, 0.15);
    --accent-2: #6366f1;
    --accent-3: #f59e0b;
    --danger: #ef4444;
    --font-display: 'Sora', sans-serif;
    --font-mono: 'IBM Plex Mono', monospace;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font-mono);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  ::selection { background: var(--accent); color: var(--bg); }
  
  .grain {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9999;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }

  .animate { animation: fadeUp 0.6s ease-out forwards; opacity: 0; }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }
  .delay-5 { animation-delay: 0.5s; }

  .btn {
    font-family: var(--font-mono);
    font-size: 13px;
    font-weight: 500;
    padding: 10px 20px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn:hover { border-color: var(--accent); color: var(--accent); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  
  .btn-primary {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
    font-weight: 600;
  }
  .btn-primary:hover { 
    background: #0ea472;
    box-shadow: 0 0 20px var(--accent-glow);
    color: var(--bg);
  }

  .btn-stripe {
    background: var(--accent-2);
    color: white;
    border-color: var(--accent-2);
    font-weight: 600;
  }
  .btn-stripe:hover {
    background: #5558e6;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
    color: white;
  }

  .btn-gold {
    background: linear-gradient(135deg, var(--accent-3), #d97706);
    color: var(--bg);
    border-color: var(--accent-3);
    font-weight: 600;
  }
  .btn-gold:hover {
    box-shadow: 0 0 20px rgba(245,158,11,0.3);
    color: var(--bg);
  }

  .code-block {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.7;
    overflow-x: auto;
    position: relative;
  }
  .code-block .line-kw { color: #c084fc; }
  .code-block .line-str { color: #34d399; }
  .code-block .line-fn { color: #60a5fa; }
  .code-block .line-cm { color: var(--text-dim); }
  .code-block .line-num { color: var(--accent-3); }

  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
  .tag-green { background: rgba(16,185,129,0.12); color: var(--accent); border: 1px solid rgba(16,185,129,0.2); }
  .tag-blue { background: rgba(99,102,241,0.12); color: var(--accent-2); border: 1px solid rgba(99,102,241,0.2); }
  .tag-amber { background: rgba(245,158,11,0.12); color: var(--accent-3); border: 1px solid rgba(245,158,11,0.2); }

  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    transition: all 0.3s;
  }
  .card:hover { border-color: var(--border-hover); transform: translateY(-2px); }

  .toast {
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    padding: 16px 24px; border-radius: 8px;
    font-size: 13px; font-family: var(--font-mono);
    animation: fadeUp 0.3s ease-out;
  }
  .toast-success { background: var(--accent); color: var(--bg); }
  .toast-error { background: var(--danger); color: white; }

  input, textarea {
    font-family: var(--font-mono);
    font-size: 13px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 14px;
    color: var(--text);
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus { border-color: var(--accent); }
`;

/* ═══════════════════════════════════════════
   API DATA — Available APIs catalog
   ═══════════════════════════════════════════ */
const API_CATALOG = [
  {
    id: 'chat', name: 'AI Chat', icon: '🧠', method: 'POST', endpoint: '/api/chat',
    description: 'GPT-4o-mini powered text generation with smart caching', status: 'live', cost: 1,
    example: {
      request: `curl -X POST https://api-amine.vercel.app/api/chat \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt": "Explain quantum computing"}'`,
      response: `{
  "result": "Quantum computing uses qubits...",
  "cached": false,
  "credits_remaining": 42
}`
    }
  },
  {
    id: 'email-verify', name: 'Email Verify', icon: '📧', method: 'GET', endpoint: '/api/email-verify',
    description: 'Validate emails: syntax, MX records, disposable detection', status: 'coming', cost: 1,
    example: {
      request: `curl "https://api-amine.vercel.app/api/email-verify?email=test@gmail.com" \\
  -H "x-api-key: YOUR_KEY"`,
      response: `{
  "valid": true,
  "mx_found": true,
  "disposable": false,
  "risk_score": 0.1
}`
    }
  },
  {
    id: 'currency', name: 'Currency Exchange', icon: '💱', method: 'GET', endpoint: '/api/currency',
    description: 'Real-time exchange rates for 170+ fiat & 50+ crypto', status: 'coming', cost: 1,
    example: {
      request: `curl "https://api-amine.vercel.app/api/currency?from=EUR&to=USD&amount=100" \\
  -H "x-api-key: YOUR_KEY"`,
      response: `{
  "from": "EUR",
  "to": "USD",
  "rate": 1.0847,
  "result": 108.47
}`
    }
  },
  {
    id: 'qrcode', name: 'QR Code', icon: '📱', method: 'GET', endpoint: '/api/qrcode',
    description: 'Generate QR codes with custom colors, sizes, and logos', status: 'coming', cost: 1,
    example: {
      request: `curl "https://api-amine.vercel.app/api/qrcode?data=https://example.com&size=300" \\
  -H "x-api-key: YOUR_KEY"`,
      response: `// Returns PNG image binary
// Content-Type: image/png`
    }
  },
  {
    id: 'ip-geo', name: 'IP Geolocation', icon: '🌍', method: 'GET', endpoint: '/api/ip-geo',
    description: 'IP to location, VPN/proxy detection, ASN lookup', status: 'coming', cost: 1,
    example: {
      request: `curl "https://api-amine.vercel.app/api/ip-geo?ip=8.8.8.8" \\
  -H "x-api-key: YOUR_KEY"`,
      response: `{
  "ip": "8.8.8.8",
  "country": "US",
  "city": "Mountain View",
  "is_vpn": false
}`
    }
  },
  {
    id: 'shorten', name: 'URL Shortener', icon: '🔗', method: 'POST', endpoint: '/api/shorten',
    description: 'Shorten URLs with click analytics and expiration', status: 'coming', cost: 1,
    example: {
      request: `curl -X POST https://api-amine.vercel.app/api/shorten \\
  -H "x-api-key: YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://very-long-url.com/path"}'`,
      response: `{
  "short_url": "https://api-amine.vercel.app/s/x7kQ2",
  "clicks": 0
}`
    }
  }
];

const PRICING_TIERS = [
  { id: 'free', name: 'Free', price: '0', requests: '1,000 / month', features: ['All APIs included', '10 req/min rate limit', 'Community support', 'Dashboard & analytics'], cta: 'Start Free', highlight: false },
  { id: 'pro', name: 'Pro', price: '19', requests: '50,000 / month', features: ['Priority endpoints', '100 req/min rate limit', 'Email support', 'Webhook notifications'], cta: 'Upgrade to Pro', highlight: true },
  { id: 'enterprise', name: 'Enterprise', price: '99', requests: 'Unlimited', features: ['Dedicated endpoints', 'No rate limit', 'Slack support + SLA', 'Custom integrations'], cta: 'Go Enterprise', highlight: false },
];

const CREDIT_PACKS = [
  { id: 'credits_5k', name: '5K Credits', credits: 5000, price: '$5', price_cents: 500 },
  { id: 'credits_25k', name: '25K Credits', credits: 25000, price: '$15', price_cents: 1500 },
];


/* ═══════════════════════════════════════════
   TOAST NOTIFICATION
   ═══════════════════════════════════════════ */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className={`toast toast-${type}`}>{message}</div>;
}


/* ═══════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════ */
function LandingPage({ onGoogleLogin, onEmailLogin }) {
  const [activeApi, setActiveApi] = useState('chat');
  const selected = API_CATALOG.find(a => a.id === activeApi);

  return (
    <div>
      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(7,8,10,0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--accent)' }}>⚡ AmineAPI</span>
          <a href="#apis" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>APIs</a>
          <a href="#docs" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>Docs</a>
          <a href="#pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>Pricing</a>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={onEmailLogin}>Email Sign In</button>
          <button className="btn btn-primary" onClick={onGoogleLogin} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Sign in with Google
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '100px 40px 80px', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div className="animate" style={{ marginBottom: 16 }}>
          <span className="tag tag-green">✦ Free 1,000 requests / month</span>
        </div>
        <h1 className="animate delay-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(to right, var(--text), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          One API key.<br/>Every tool you need.
        </h1>
        <p className="animate delay-2" style={{ color: 'var(--text-muted)', fontSize: 16, maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7, fontFamily: 'var(--font-display)' }}>
          AI Chat, Email Verification, Currency Exchange, QR Codes, IP Geolocation — all through a single, fast, well-documented REST API.
        </p>
        <div className="animate delay-3" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onGoogleLogin} style={{ fontSize: 14, padding: '12px 28px', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Get Free API Key
          </button>
          <a href="#docs" className="btn" style={{ fontSize: 14, padding: '12px 28px', textDecoration: 'none' }}>Read the Docs</a>
          <button className="btn" onClick={onEmailLogin} style={{ fontSize: 13, padding: '12px 20px' }}>✉ Email Sign In</button>
        </div>

        <div className="animate delay-4" style={{ marginTop: 50, textAlign: 'left' }}>
          <div className="code-block">
            <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 11, color: 'var(--text-dim)' }}>bash</div>
            <span className="line-cm"># Get an answer from AI in one line</span><br/>
            <span className="line-fn">curl</span> <span className="line-str">-X POST</span> https://api-amine.vercel.app/api/chat \<br/>
            &nbsp;&nbsp;<span className="line-str">-H</span> <span className="line-str">"x-api-key: YOUR_KEY"</span> \<br/>
            &nbsp;&nbsp;<span className="line-str">-H</span> <span className="line-str">"Content-Type: application/json"</span> \<br/>
            &nbsp;&nbsp;<span className="line-str">-d</span> <span className="line-str">'{`{"prompt": "Hello world"}`}'</span>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '24px 40px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center' }}>
          {[
            { label: 'APIs Available', value: '6+' },
            { label: 'Avg Response', value: '<120ms' },
            { label: 'Uptime', value: '99.9%' },
            { label: 'Free Requests', value: '1,000/mo' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* API CATALOG */}
      <section id="apis" style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, marginBottom: 12 }}>Available APIs</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>One key, one dashboard. All APIs included in every plan.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {API_CATALOG.map(api => (
            <div key={api.id} className="card" onClick={() => setActiveApi(api.id)}
              style={{ cursor: 'pointer', borderColor: activeApi === api.id ? 'var(--accent)' : undefined, position: 'relative' }}>
              {activeApi === api.id && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 28 }}>{api.icon}</span>
                <span className={`tag ${api.status === 'live' ? 'tag-green' : 'tag-amber'}`} style={{ fontSize: 10 }}>
                  {api.status === 'live' ? '● Live' : '◌ Soon'}
                </span>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{api.name}</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{api.description}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="tag tag-blue">{api.method}</span>
                <code style={{ fontSize: 11, color: 'var(--text-dim)' }}>{api.endpoint}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive docs preview */}
        <div id="docs" style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Request</div>
            <div className="code-block" style={{ fontSize: 12 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--accent)' }}>{selected?.example.request}</pre>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Response</div>
            <div className="code-block" style={{ fontSize: 12 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-muted)' }}>{selected?.example.response}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '80px 40px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 600, marginBottom: 12 }}>Simple Pricing</h2>
          <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Start free. Watch ads for bonus credits. Scale with a plan.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PRICING_TIERS.map((tier, i) => (
            <div key={i} className="card" style={{ borderColor: tier.highlight ? 'var(--accent)' : undefined, position: 'relative', overflow: 'hidden' }}>
              {tier.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />}
              {tier.highlight && <span className="tag tag-green" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10 }}>POPULAR</span>}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{tier.name}</h3>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700 }}>${tier.price}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>/month</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--accent)', marginBottom: 20, fontWeight: 500 }}>{tier.requests}</div>
              {tier.features.map((f, fi) => (
                <div key={fi} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                </div>
              ))}
              {tier.id === 'free' && (
                <div style={{ fontSize: 11, color: 'var(--accent-3)', padding: '8px 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎬</span> + Watch ads for bonus credits
                </div>
              )}
              <button
                className={`btn ${tier.highlight ? 'btn-primary' : ''}`}
                onClick={onGoogleLogin}
                style={{ width: '100%', marginTop: 20 }}
              >{tier.cta}</button>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        <div style={{ textAlign: 'center', marginTop: 48, marginBottom: 24 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: 'var(--font-display)' }}>Or buy credit packs — no subscription required</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 500, margin: '0 auto' }}>
          {CREDIT_PACKS.map(pack => (
            <div key={pack.id} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent-3)' }}>{pack.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0' }}>{pack.credits.toLocaleString()} requests</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{pack.price}</div>
              <button className="btn btn-gold" onClick={onGoogleLogin} style={{ width: '100%' }}>Buy</button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          © 2026 AmineAPI — Built by <a href="https://github.com/AmineCHABANE" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Amine Chabane</a>
          &nbsp;&nbsp;·&nbsp;&nbsp;Payments secured by <span style={{ color: 'var(--accent-2)' }}>Stripe</span>
        </div>
      </footer>
    </div>
  );
}


/* ═══════════════════════════════════════════
   DASHBOARD
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
    setCredits(p?.credits || 0);
    setPlan(p?.plan || 'free');
    const { data: k } = await supabase.from('api_keys').select('key_value').eq('user_id', session.user.id).single();
    if (k) setApiKey(k.key_value);
  }, [session]);

  const fetchLogs = useCallback(async () => {
    const { data } = await supabase
      .from('usage_logs').select('*').eq('user_id', session.user.id)
      .order('created_at', { ascending: false }).limit(20);
    setLogs(data || []);
  }, [session]);

  useEffect(() => {
    fetchData();
    fetchLogs();
    // Check URL for checkout result
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      showToast('Payment successful! Credits added to your account.');
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(fetchData, 2000); // Give webhook time to process
    } else if (params.get('checkout') === 'cancelled') {
      showToast('Checkout cancelled.', 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchData, fetchLogs]);

  const generateKey = async () => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const key = `amineapi_live_${Array.from(array, b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)}`;
    await supabase.from('api_keys').upsert([{ user_id: session.user.id, key_value: key }]);
    setApiKey(key);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testApi = async () => {
    if (!testPrompt || !apiKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt })
      });
      const data = await res.json();
      setTestResult(data);
      fetchData();
      fetchLogs();
    } catch (e) {
      setTestResult({ error: e.message });
    }
    setTesting(false);
  };

  // ─── Stripe Checkout ───
  const handleCheckout = async (planId) => {
    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          user_id: session.user.id,
          user_email: session.user.email,
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Checkout failed', 'error');
      }
    } catch (e) {
      showToast('Checkout error: ' + e.message, 'error');
    }
    setCheckoutLoading(null);
  };

  // ─── Rewarded Ad Modal ───
  const [adModalOpen, setAdModalOpen] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  const [adWatched, setAdWatched] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFailed, setAdFailed] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);

  const handleReward = () => {
    setAdModalOpen(true);
    setAdCountdown(30);
    setAdWatched(false);
    setAdLoaded(false);
    setAdFailed(false);
  };

  // Countdown timer — only ticks when ad is loaded
  useEffect(() => {
    if (!adModalOpen || !adLoaded || adCountdown <= 0) {
      if (adCountdown <= 0 && adLoaded) setAdWatched(true);
      return;
    }
    const timer = setTimeout(() => setAdCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [adModalOpen, adCountdown, adLoaded]);

  // Load ads when modal opens — AdSense primary, Adsterra fallback
  useEffect(() => {
    if (!adModalOpen) return;

    // Try AdSense first
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* AdSense not ready */ }

    // Load Adsterra after 1.5s
    const adsterraTimer = setTimeout(() => {
      const container = document.getElementById('adsterra-reward-container');
      if (!container) return;

      const fallbackMsg = document.getElementById('ad-fallback-msg');
      if (fallbackMsg) fallbackMsg.style.display = 'none';

      window.atOptions = {
        key: '4597b34efe7f59ee1a483dc7cb84fc78',
        format: 'iframe',
        height: 250,
        width: 300,
        params: {}
      };

      const script = document.createElement('script');
      script.src = 'https://www.highperformanceformat.com/4597b34efe7f59ee1a483dc7cb84fc78/invoke.js';
      script.async = true;
      container.appendChild(script);
    }, 1500);

    // Check every second if an ad iframe/element appeared
    const adCheckInterval = setInterval(() => {
      const container = document.getElementById('adsterra-reward-container');
      if (!container) return;

      const hasAdsterraIframe = container.querySelector('iframe');
      const adsenseSlot = document.querySelector('.adsbygoogle[data-ad-status="filled"]');

      if (hasAdsterraIframe || adsenseSlot) {
        setAdLoaded(true);
        setAdFailed(false);
        clearInterval(adCheckInterval);
      }
    }, 1000);

    // If no ad after 10 seconds, mark as failed
    const failTimer = setTimeout(() => {
      setAdLoaded(loaded => {
        if (!loaded) setAdFailed(true);
        return loaded;
      });
    }, 10000);

    return () => {
      clearTimeout(adsterraTimer);
      clearInterval(adCheckInterval);
      clearTimeout(failTimer);
    };
  }, [adModalOpen]);

  const claimReward = async () => {
    if (!adWatched) return;
    setClaimingReward(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const res = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentSession.access_token}`,
        }
      });
      const data = await res.json();

      if (data.success) {
        setCredits(data.credits_balance);
        setRewardInfo({ remaining: data.rewards_remaining_today });
        showToast(`+${data.credits_granted} credits earned! ${data.rewards_remaining_today} rewards left today.`);
        setAdModalOpen(false);
      } else {
        showToast(data.error || data.message || 'Reward failed', 'error');
      }
    } catch (e) {
      showToast('Reward error: ' + e.message, 'error');
    }
    setClaimingReward(false);
  };

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const planColor = plan === 'enterprise' ? 'var(--accent-3)' : plan === 'pro' ? 'var(--accent-2)' : 'var(--accent)';

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ═══ AD MODAL ═══ */}
      {adModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 32, maxWidth: 500, width: '90%',
            textAlign: 'center', position: 'relative',
          }}>
            {/* Close button — always available */}
            <button onClick={() => setAdModalOpen(false)} style={{
              position: 'absolute', top: 12, right: 16,
              background: 'none', border: 'none', color: 'var(--text-dim)',
              cursor: 'pointer', fontSize: 18,
            }}>✕</button>

            <div style={{ fontSize: 28, marginBottom: 8 }}>🎬</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>
              Watch Ad → Earn 3 Credits
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              View the ad below for 30 seconds to claim your free credits.
            </p>

            {/* Ad Container — AdSense primary, Adsterra fallback */}
            <div style={{
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 8, minHeight: 250, marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              {/* AdSense (shows when approved) */}
              <ins className="adsbygoogle"
                style={{ display: 'block', width: '100%', height: 250 }}
                data-ad-client="ca-pub-7526517043500512"
                data-ad-slot="auto"
                data-ad-format="rectangle"
                data-full-width-responsive="true"
              />

              {/* Adsterra fallback container — shows when AdSense not available */}
              <div id="adsterra-reward-container" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Adsterra ad will be injected here by their script */}
                {/* If neither network loads, show sponsored message */}
                <div id="ad-fallback-msg" style={{
                  padding: 20, textAlign: 'center',
                  color: 'var(--text-dim)', fontSize: 12,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12, filter: 'grayscale(1) opacity(0.3)' }}>📢</div>
                  <p>Sponsored content loading...</p>
                  <p style={{ marginTop: 8, fontSize: 11 }}>Ad networks initializing. Please wait.</p>
                </div>
              </div>
            </div>

            {/* Countdown / Claim */}
            {!adWatched ? (
              <div>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  border: `3px solid ${adLoaded ? 'var(--accent-3)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
                  color: adLoaded ? 'var(--accent-3)' : 'var(--text-dim)',
                }}>
                  {adLoaded ? adCountdown : '⏸'}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {adLoaded 
                    ? `Please wait ${adCountdown} seconds...` 
                    : 'Waiting for ad to load...'}
                </p>
                <div style={{
                  width: '100%', height: 4, background: 'var(--border)',
                  borderRadius: 2, marginTop: 12, overflow: 'hidden',
                }}>
                  <div style={{
                    width: adLoaded ? `${((30 - adCountdown) / 30) * 100}%` : '0%',
                    height: '100%', background: 'var(--accent-3)',
                    borderRadius: 2, transition: 'width 1s linear',
                  }} />
                </div>
                {/* If 10s passed and still no ad, show error */}
                {adFailed && (
                  <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>Ad failed to load — no credits available</p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                      Disable your ad blocker and try again, or buy a credit pack instead.
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                      <button className="btn" onClick={() => { setAdModalOpen(false); setTimeout(handleReward, 300); }} style={{ fontSize: 11, padding: '6px 14px' }}>
                        🔄 Retry
                      </button>
                      <button className="btn btn-stripe" onClick={() => { setAdModalOpen(false); setActiveTab('billing'); }} style={{ fontSize: 11, padding: '6px 14px' }}>
                        💳 Buy Credits
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={claimReward}
                disabled={claimingReward}
                style={{
                  width: '100%', fontSize: 15, padding: '14px 28px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                {claimingReward ? '⏳ Claiming...' : '✓ Claim +3 Free Credits!'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 32px', borderBottom: '1px solid var(--border)', background: 'rgba(7,8,10,0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>⚡ AmineAPI</span>
          {['overview', 'playground', 'billing', 'docs'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: 'none', border: 'none', color: activeTab === tab ? 'var(--accent)' : 'var(--text-dim)',
              cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-mono)', textTransform: 'capitalize',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', padding: '8px 0'
            }}>{tab === 'billing' ? '💳 Billing' : tab}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="tag" style={{ background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44` }}>{planLabel}</span>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{session.user.email}</span>
          <button className="btn" onClick={() => supabase.auth.signOut()} style={{ padding: '6px 14px', fontSize: 12 }}>Sign Out</button>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px' }}>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Credits</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: credits > 10 ? 'var(--accent)' : 'var(--danger)' }}>{credits.toLocaleString()}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>API Calls Today</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>
                  {logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length}
                </div>
              </div>
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Plan</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: planColor }}>{planLabel}</div>
              </div>
              <div className="card" style={{ cursor: 'pointer', borderColor: 'var(--accent-3)' }} onClick={() => setActiveTab('billing')}>
                <div style={{ fontSize: 11, color: 'var(--accent-3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Need Credits?</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Buy packs or watch ads →</div>
              </div>
            </div>

            {/* Quick free credits via rewarded ad */}
            <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, var(--surface), rgba(245,158,11,0.05))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>🎬 Watch & Earn</span>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Watch a short video ad → get 3 free credits. 
                    {rewardInfo ? ` ${rewardInfo.remaining} left today.` : ' Up to 5× per day (15 credits free/day).'}
                  </p>
                </div>
                <button className="btn btn-gold" onClick={handleReward} style={{ minWidth: 140 }}>
                  {'▶ Watch Ad (+3)'}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>🔑 API Key</span>
                {apiKey && (
                  <button className="btn" onClick={copyKey} style={{ padding: '4px 12px', fontSize: 11 }}>
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                )}
              </div>
              {apiKey ? (
                <code style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 6, display: 'block', wordBreak: 'break-all' }}>
                  {apiKey}
                </code>
              ) : (
                <button className="btn btn-primary" onClick={generateKey}>Generate API Key</button>
              )}
            </div>

            {/* Quick Start */}
            <div className="card" style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 12 }}>⚡ Quick Start</span>
              <div className="code-block" style={{ fontSize: 12 }}>
                <span className="line-cm"># Test your API key</span><br/>
                <span className="line-fn">curl</span> -X POST https://api-amine.vercel.app/api/chat \<br/>
                &nbsp;&nbsp;-H <span className="line-str">"x-api-key: {apiKey || 'YOUR_KEY'}"</span> \<br/>
                &nbsp;&nbsp;-H <span className="line-str">"Content-Type: application/json"</span> \<br/>
                &nbsp;&nbsp;-d <span className="line-str">'{`{"prompt":"Hello!"}`}'</span>
              </div>
            </div>

            {/* Recent Logs */}
            <div className="card">
              <span style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 16 }}>📊 Recent Activity</span>
              {logs.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>No API calls yet. Try the playground! →</p>
              ) : (
                <div style={{ fontSize: 12 }}>
                  {logs.slice(0, 10).map((l, i) => (
                    <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px', padding: '8px 0', borderBottom: '1px solid var(--border)', animation: `slideIn 0.3s ease-out ${i * 0.05}s both` }}>
                      <span style={{ color: 'var(--text-dim)' }}>{new Date(l.created_at).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                      <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.prompt_summary}</span>
                      <span style={{ color: 'var(--danger)', textAlign: 'right' }}>-1 credit</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ PLAYGROUND TAB ═══ */}
        {activeTab === 'playground' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>🧪 API Playground</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Test the AI Chat API directly from your browser.</p>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span className="tag tag-blue">POST</span>
                <code style={{ fontSize: 13, color: 'var(--text-muted)' }}>/api/chat</code>
              </div>
              <textarea
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder='Enter your prompt... e.g. "Explain REST APIs in 2 sentences"'
                rows={3}
                style={{ marginBottom: 12, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Cost: 1 credit · Balance: {credits.toLocaleString()}</span>
                <button className="btn btn-primary" onClick={testApi} disabled={testing || !testPrompt || credits <= 0} style={{ opacity: testing ? 0.6 : 1 }}>
                  {testing ? '⏳ Running...' : '▶ Send Request'}
                </button>
              </div>
            </div>

            {credits <= 0 && (
              <div className="card" style={{ borderColor: 'var(--danger)', marginBottom: 16, textAlign: 'center', padding: 20 }}>
                <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 12 }}>No credits remaining</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn btn-gold" onClick={handleReward} >🎬 Watch Ad (+3 free)</button>
                  <button className="btn btn-stripe" onClick={() => setActiveTab('billing')}>💳 Buy Credits</button>
                </div>
              </div>
            )}

            {testResult && (
              <div className="card" style={{ borderColor: testResult.error ? 'var(--danger)' : 'var(--accent)' }}>
                <div style={{ fontSize: 11, color: testResult.error ? 'var(--danger)' : 'var(--accent)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                  {testResult.error ? '✗ Error' : '✓ Response'} {testResult.cached && '(cached)'}
                </div>
                <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-muted)' }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ═══ BILLING TAB ═══ */}
        {activeTab === 'billing' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>💳 Billing & Credits</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Upgrade your plan, buy credit packs, or earn free credits.</p>

            {/* Current Status */}
            <div className="card" style={{ marginBottom: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Current Plan</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: planColor }}>{planLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Credits Balance</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: credits > 10 ? 'var(--accent)' : 'var(--danger)' }}>{credits.toLocaleString()}</div>
              </div>
            </div>

            {/* Free: Rewarded Ads */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                🎬 Free Credits — Watch & Earn
              </h3>
              <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, var(--surface), rgba(245,158,11,0.04))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 13, marginBottom: 4 }}>Watch a short video → <strong style={{ color: 'var(--accent-3)' }}>+3 credits</strong></p>
                    <p style={{ fontSize: 11, color: 'var(--text-dim)' }}>Up to 5 times per day (15 free credits/day) · 2 min cooldown</p>
                  </div>
                  <button className="btn btn-gold" onClick={handleReward} style={{ minWidth: 150 }}>
                    {'▶ Watch Ad (+3)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Credit Packs (one-time) */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                ⚡ Credit Packs — Pay as you go
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                {CREDIT_PACKS.map(pack => (
                  <div key={pack.id} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--accent-3)' }}>{pack.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0' }}>{pack.credits.toLocaleString()} requests</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, marginBottom: 12 }}>{pack.price}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginBottom: 12 }}>
                      ${(pack.price_cents / pack.credits * 100).toFixed(2)} per 100 requests
                    </div>
                    <button
                      className="btn btn-gold"
                      onClick={() => handleCheckout(pack.id)}
                      disabled={checkoutLoading === pack.id}
                      style={{ width: '100%' }}
                    >
                      {checkoutLoading === pack.id ? '⏳ Redirecting...' : `Buy ${pack.price}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription Plans */}
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                🚀 Monthly Plans — Best value
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {PRICING_TIERS.map((tier) => {
                  const isCurrent = plan === tier.id;
                  return (
                    <div key={tier.id} className="card" style={{
                      borderColor: isCurrent ? planColor : tier.highlight ? 'var(--accent)' : undefined,
                      position: 'relative', overflow: 'hidden',
                      opacity: isCurrent ? 0.7 : 1,
                    }}>
                      {tier.highlight && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--accent)' }} />}
                      {isCurrent && <span className="tag tag-green" style={{ position: 'absolute', top: 12, right: 12, fontSize: 10 }}>CURRENT</span>}
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{tier.name}</h3>
                      <div style={{ marginBottom: 12 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 }}>${tier.price}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>/mo</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 16, fontWeight: 500 }}>{tier.requests}</div>
                      {tier.features.map((f, fi) => (
                        <div key={fi} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '5px 0', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--accent)' }}>✓</span> {f}
                        </div>
                      ))}
                      <button
                        className={`btn ${tier.highlight && !isCurrent ? 'btn-stripe' : ''}`}
                        onClick={() => tier.id !== 'free' && !isCurrent && handleCheckout(tier.id)}
                        disabled={isCurrent || tier.id === 'free' || checkoutLoading === tier.id}
                        style={{ width: '100%', marginTop: 16 }}
                      >
                        {isCurrent ? '✓ Current Plan' : checkoutLoading === tier.id ? '⏳ Redirecting...' : tier.id === 'free' ? 'Free Forever' : tier.cta}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Security Note */}
            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: 'var(--text-dim)' }}>
              🔒 All payments are processed securely by <span style={{ color: 'var(--accent-2)' }}>Stripe</span>. We never see your card details.
            </div>
          </div>
        )}

        {/* ═══ DOCS TAB ═══ */}
        {activeTab === 'docs' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 600, marginBottom: 8 }}>📚 API Documentation</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Complete reference for all available endpoints.</p>

            {API_CATALOG.map(api => (
              <div key={api.id} className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{api.icon}</span>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{api.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{api.description}</p>
                    </div>
                  </div>
                  <span className={`tag ${api.status === 'live' ? 'tag-green' : 'tag-amber'}`}>
                    {api.status === 'live' ? '● Live' : '◌ Coming Soon'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 6 }}>REQUEST</div>
                    <div className="code-block" style={{ fontSize: 11 }}>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--accent)' }}>{api.example.request}</pre>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1, marginBottom: 6 }}>RESPONSE</div>
                    <div className="code-block" style={{ fontSize: 11 }}>
                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0, color: 'var(--text-muted)' }}>{api.example.response}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Error Codes</h3>
              {[
                { code: 400, msg: 'Bad Request — Missing or invalid parameters' },
                { code: 401, msg: 'Unauthorized — Invalid or missing API key' },
                { code: 402, msg: 'Payment Required — Insufficient credits' },
                { code: 429, msg: 'Rate Limited — Too many requests (wait 2s)' },
                { code: 500, msg: 'Server Error — Something went wrong on our end' },
              ].map(e => (
                <div key={e.code} style={{ display: 'flex', gap: 12, padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                  <code style={{ color: 'var(--danger)', fontWeight: 600, minWidth: 36 }}>{e.code}</code>
                  <span style={{ color: 'var(--text-muted)' }}>{e.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   ROOT APP
   ═══════════════════════════════════════════ */
function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) alert(error.message);
  };

  const handleEmailLogin = async () => {
    const email = prompt('Enter your email to sign in:');
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) alert(error.message);
    else alert('Check your email for the magic link!');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
      <span style={{ animation: 'glow 1.5s ease-in-out infinite' }}>⚡ Loading...</span>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="grain" />
      {session ? <Dashboard session={session} /> : <LandingPage onGoogleLogin={handleGoogleLogin} onEmailLogin={handleEmailLogin} />}
    </>
  );
}

export default App;
