import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

/* ═══════════════════════════════════════════
   CSS — Clean dark, mobile-first
   ═══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}

:root{
  --bg:#09090b;--s1:rgba(255,255,255,.04);--s2:rgba(255,255,255,.07);--s3:rgba(255,255,255,.10);
  --glass:rgba(9,9,11,.92);--brd:rgba(255,255,255,.08);--brd2:rgba(255,255,255,.15);
  --t1:#fafafa;--t2:#a1a1aa;--t3:#52525b;
  --green:#22c55e;--green-d:rgba(34,197,94,.1);
  --blue:#6366f1;--blue-d:rgba(99,102,241,.1);
  --gold:#eab308;--gold-d:rgba(234,179,8,.1);
  --red:#ef4444;--red-d:rgba(239,68,68,.1);
  --font:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',monospace;
}

body{background:var(--bg);color:var(--t1);font-family:var(--font);-webkit-font-smoothing:antialiased;overflow-x:hidden;min-height:100dvh}
::selection{background:var(--green);color:var(--bg)}

@keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fi{animation:in .4s ease both}.d1{animation-delay:.05s}.d2{animation-delay:.1s}.d3{animation-delay:.15s}.d4{animation-delay:.2s}

/* Glow */
.glow{position:fixed;inset:0;pointer-events:none;z-index:0;
  background:radial-gradient(600px circle at 30% 20%,rgba(34,197,94,.04),transparent 60%),
             radial-gradient(500px circle at 70% 60%,rgba(99,102,241,.03),transparent 50%)}

/* Buttons */
.b{font-family:var(--font);font-weight:500;font-size:14px;padding:10px 18px;border-radius:10px;
  border:1px solid var(--brd);background:var(--s2);color:var(--t1);cursor:pointer;
  transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:7px;
  min-height:44px;white-space:nowrap;text-decoration:none}
.b:active{transform:scale(.97)}.b:disabled{opacity:.3;cursor:not-allowed;transform:none}
.b-g{background:var(--green);color:var(--bg);border-color:var(--green);font-weight:600}
.b-g:hover{box-shadow:0 4px 20px rgba(34,197,94,.25)}
.b-b{background:var(--blue);color:#fff;border-color:var(--blue);font-weight:600}
.b-o{background:linear-gradient(135deg,var(--gold),#f59e0b);color:var(--bg);border-color:var(--gold);font-weight:600}
.b-o:hover{box-shadow:0 4px 20px rgba(234,179,8,.25)}
.b-x{background:0;border-color:transparent;color:var(--t2)}.b-x:hover{color:var(--t1);background:var(--s1)}
.b-f{width:100%}

/* Card */
.c{background:var(--s1);border:1px solid var(--brd);border-radius:14px;padding:18px;transition:border-color .2s}
.c:hover{border-color:var(--brd2)}

/* Tag */
.tg{display:inline-flex;align-items:center;gap:3px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.2px}
.tg-g{background:var(--green-d);color:var(--green)}.tg-b{background:var(--blue-d);color:var(--blue)}
.tg-o{background:var(--gold-d);color:var(--gold)}.tg-r{background:var(--red-d);color:var(--red)}

/* Code */
.cd{background:var(--s1);border:1px solid var(--brd);border-radius:10px;padding:14px;
  font-family:var(--mono);font-size:12px;line-height:1.7;overflow-x:auto;-webkit-overflow-scrolling:touch}
.cd .g{color:var(--green)}.cd .d{color:var(--t3)}.cd .u{color:#60a5fa}

/* Toast */
.ts{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:10010;padding:11px 20px;
  border-radius:12px;font-size:13px;font-weight:500;max-width:calc(100vw - 32px);
  animation:in .3s;backdrop-filter:blur(16px);text-align:center}
.ts-ok{background:rgba(34,197,94,.92);color:var(--bg)}.ts-err{background:rgba(239,68,68,.92);color:#fff}

/* Input */
input,textarea{font-family:var(--mono);font-size:14px;background:var(--s1);border:1px solid var(--brd);
  border-radius:10px;padding:12px 14px;color:var(--t1);width:100%;outline:none;transition:border-color .2s;min-height:44px}
input:focus,textarea:focus{border-color:var(--green)}

/* Scrollbar */
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--brd2);border-radius:3px}

/* Bottom nav */
.bn{position:fixed;bottom:0;left:0;right:0;background:var(--glass);backdrop-filter:blur(20px);
  border-top:1px solid var(--brd);display:flex;justify-content:space-around;align-items:center;
  padding:5px 0 calc(5px + env(safe-area-inset-bottom,0px));z-index:200}
.bn button{background:0;border:0;color:var(--t3);font-size:10px;font-family:var(--font);
  display:flex;flex-direction:column;align-items:center;gap:1px;padding:7px 14px;cursor:pointer;
  transition:color .15s;min-width:52px}
.bn button.a{color:var(--green)}
.bn .ic{font-size:20px;line-height:1}

/* Modal overlay */
.ov{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:10001;display:flex;
  align-items:center;justify-content:center;padding:16px;animation:in .2s}
.ov-box{background:#0e0e12;border:1px solid var(--brd);border-radius:16px;padding:24px;
  max-width:400px;width:100%;text-align:center;position:relative}

/* Responsive */
@media(min-width:768px){.bn{display:none}.mo{display:none!important}}
@media(max-width:767px){.dk{display:none!important}}
`;


/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const APIS = [
  { id:'chat', name:'AI Chat', icon:'🧠', method:'POST', ep:'/api/chat', desc:'GPT-4o-mini text generation with caching', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/chat \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"prompt": "Explain quantum computing"}'`,
    res:`{\n  "result": "Quantum computing uses qubits...",\n  "cached": false,\n  "credits_remaining": 42\n}` },
  { id:'summarize', name:'AI Summarize', icon:'📝', method:'POST', ep:'/api/summarize', desc:'Summarize text or URLs with AI', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/summarize \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "https://example.com/article", "length": "short"}'`,
    res:`{\n  "summary": "The article discusses...",\n  "compression_ratio": "78%",\n  "credits_remaining": 41\n}` },
  { id:'translate', name:'AI Translate', icon:'🌐', method:'POST', ep:'/api/translate', desc:'Translate text between 30+ languages', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/translate \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "Hello world", "to": "fr"}'`,
    res:`{\n  "translated_text": "Bonjour le monde",\n  "source_language": "en",\n  "credits_remaining": 40\n}` },
  { id:'sentiment', name:'Sentiment', icon:'😊', method:'POST', ep:'/api/sentiment', desc:'Detect emotions & sentiment in text', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/sentiment \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "I love this product!"}'`,
    res:`{\n  "sentiment": "positive",\n  "score": 0.92,\n  "emotions": ["joy"]\n}` },
  { id:'email', name:'Email Verify', icon:'📧', method:'GET', ep:'/api/email-verify', desc:'MX records, disposable & risk detection', live:true,
    req:`curl "https://api-amine.vercel.app/api/email-verify?email=test@gmail.com" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "valid": true,\n  "mx_found": true,\n  "disposable": false,\n  "risk_score": 5\n}` },
  { id:'currency', name:'Currency', icon:'💱', method:'GET', ep:'/api/currency', desc:'170+ real-time exchange rates', live:true,
    req:`curl "https://api-amine.vercel.app/api/currency?from=EUR&to=USD&amount=100" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "from": "EUR", "to": "USD",\n  "rate": 1.0847, "result": 108.47\n}` },
  { id:'weather', name:'Weather', icon:'🌤️', method:'GET', ep:'/api/weather', desc:'Current + 7-day forecast, any city', live:true,
    req:`curl "https://api-amine.vercel.app/api/weather?city=Paris" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "current": {"temperature": 18.5, "condition": "Partly cloudy"},\n  "forecast": [...7 days]\n}` },
  { id:'ip', name:'IP Geo', icon:'🌍', method:'GET', ep:'/api/ip-geo', desc:'IP → location, VPN & proxy detection', live:true,
    req:`curl "https://api-amine.vercel.app/api/ip-geo?ip=8.8.8.8" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "ip": "8.8.8.8",\n  "country": "US",\n  "city": "Mountain View",\n  "is_proxy": false\n}` },
  { id:'qr', name:'QR Code', icon:'📱', method:'GET', ep:'/api/qrcode', desc:'Generate PNG/SVG QR codes', live:true,
    req:`curl "https://api-amine.vercel.app/api/qrcode?data=https://example.com&size=300" \\\n  -H "x-api-key: YOUR_KEY" -o qr.png`,
    res:`// Returns PNG image\n// Content-Type: image/png\n// Add &format=svg for SVG` },
  { id:'url', name:'URL Short', icon:'🔗', method:'POST', ep:'/api/shorten', desc:'Shorten URLs + click tracking', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/shorten \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "https://very-long-url.com/page"}'`,
    res:`{\n  "short_url": "https://api-amine.vercel.app/api/shorten?code=x7kQ2",\n  "code": "x7kQ2",\n  "clicks": 0\n}` },
  { id:'password', name:'Password', icon:'🔐', method:'GET', ep:'/api/password', desc:'Crypto-safe passwords + strength analysis', live:true,
    req:`curl "https://api-amine.vercel.app/api/password?length=24&symbols=true" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "password": "kX#9mP$vQ2...",\n  "strength": "very_strong",\n  "entropy_bits": 143\n}` },
  { id:'hash', name:'Hash', icon:'#️⃣', method:'POST', ep:'/api/hash', desc:'MD5, SHA1, SHA256, SHA512 hashing', live:true,
    req:`curl -X POST https://api-amine.vercel.app/api/hash \\\n  -H "x-api-key: YOUR_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"text": "hello", "algorithm": "sha256"}'`,
    res:`{\n  "hash": "2cf24dba5fb0a30e...",\n  "algorithm": "sha256"\n}` },
  { id:'uuid', name:'UUID', icon:'🆔', method:'GET', ep:'/api/uuid', desc:'UUID v4 & v7 generator, batch support', live:true,
    req:`curl "https://api-amine.vercel.app/api/uuid?version=4&count=5" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "uuids": ["550e8400-e29b-41d4-...", ...],\n  "version": 4,\n  "count": 5\n}` },
  { id:'lorem', name:'Lorem Ipsum', icon:'📄', method:'GET', ep:'/api/lorem', desc:'Placeholder text generator', live:true,
    req:`curl "https://api-amine.vercel.app/api/lorem?type=paragraphs&count=3" \\\n  -H "x-api-key: YOUR_KEY"`,
    res:`{\n  "text": "Lorem ipsum dolor...",\n  "type": "paragraphs",\n  "word_count": 142\n}` },
  { id:'placeholder', name:'Placeholder', icon:'🖼️', method:'GET', ep:'/api/placeholder', desc:'SVG placeholder images any size', live:true,
    req:`curl "https://api-amine.vercel.app/api/placeholder?w=800&h=400&bg=1a1a2e" \\\n  -H "x-api-key: YOUR_KEY" -o img.svg`,
    res:`// Returns SVG image\n// Content-Type: image/svg+xml\n// Params: w, h, bg, color, text` },
];

const PLANS = [
  { id:'free', name:'Free', price:'0', reqs:'1,000/mo', feats:['All APIs','10 req/min','Dashboard','Community'], cta:'Start Free', pop:false },
  { id:'pro', name:'Pro', price:'19', reqs:'50,000/mo', feats:['Priority endpoints','100 req/min','Email support','Webhooks'], cta:'Upgrade', pop:true },
  { id:'enterprise', name:'Enterprise', price:'99', reqs:'Unlimited', feats:['Dedicated','No rate limit','Slack + SLA','Custom integrations'], cta:'Enterprise', pop:false },
];

const PACKS = [
  { id:'credits_5k', name:'5K', credits:5000, price:'$5', cents:500 },
  { id:'credits_25k', name:'25K', credits:25000, price:'$15', cents:1500 },
];


/* ═══ TOAST ═══ */
function Toast({ msg, ok, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return <div className={`ts ${ok ? 'ts-ok' : 'ts-err'}`}>{msg}</div>;
}

/* ═══ Google icon ═══ */
const G = () => <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;


/* ═══════════════════════════════════════════
   LANDING
   ═══════════════════════════════════════════ */
function Landing({ gLogin, eLogin }) {
  const [sel, setSel] = useState('chat');
  const api = APIS.find(a => a.id === sel);

  return (
    <div style={{ position:'relative', zIndex:1 }}>
      {/* Nav */}
      <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid var(--brd)', position:'sticky', top:0, background:'var(--glass)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <span style={{ fontWeight:700, fontSize:17, color:'var(--green)', letterSpacing:-.3 }}>⚡ AmineAPI</span>
        <div style={{ display:'flex', gap:8 }}>
          <button className="b b-x dk" onClick={eLogin} style={{ fontSize:13, minHeight:36, padding:'7px 12px' }}>Email</button>
          <button className="b b-g" onClick={gLogin} style={{ fontSize:13, minHeight:38, padding:'8px 16px' }}><G /> Sign In</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding:'52px 20px 44px', maxWidth:600, margin:'0 auto', textAlign:'center' }}>
        <div className="fi"><span className="tg tg-g">✦ 1,000 free requests / month</span></div>
        <h1 className="fi d1" style={{ fontSize:'clamp(26px,7vw,46px)', fontWeight:700, lineHeight:1.08, margin:'18px 0 14px', letterSpacing:-1.2, background:'linear-gradient(135deg,var(--t1) 30%,var(--green))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          One API key.<br/>Every tool you need.
        </h1>
        <p className="fi d2" style={{ color:'var(--t2)', fontSize:'clamp(14px,3.5vw,15px)', maxWidth:420, margin:'0 auto 28px', lineHeight:1.65 }}>
          AI Chat, Translate, Summarize, Weather, Email Verify, Currency, QR Codes & more — one fast REST API with a generous free tier.
        </p>
        <div className="fi d3" style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="b b-g" onClick={gLogin} style={{ fontSize:15, padding:'13px 28px' }}>Get Free API Key →</button>
          <button className="b" onClick={eLogin} style={{ padding:'13px 18px' }}>✉ Email Sign In</button>
        </div>

        <div className="fi d4" style={{ marginTop:36, textAlign:'left' }}>
          <div className="cd">
            <span className="d"># One line. That's it.</span><br/>
            <span className="u">curl</span> <span className="g">-X POST</span> https://api-amine.vercel.app/api/chat \<br/>
            &nbsp;&nbsp;<span className="g">-H</span> <span className="g">"x-api-key: YOUR_KEY"</span> \<br/>
            &nbsp;&nbsp;<span className="g">-d</span> <span className="g">'{`{"prompt":"Hello"}`}'</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ borderTop:'1px solid var(--brd)', borderBottom:'1px solid var(--brd)', padding:'16px' }}>
        <div style={{ maxWidth:600, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, textAlign:'center' }}>
          {[{l:'APIs',v:'15'},{l:'Latency',v:'<120ms'},{l:'Uptime',v:'99.9%'},{l:'Free',v:'1K/mo'}].map((s,i) =>
            <div key={i}><div style={{ fontSize:'clamp(16px,4vw,22px)', fontWeight:700, color:'var(--green)' }}>{s.v}</div><div style={{ fontSize:9, color:'var(--t3)', marginTop:2, letterSpacing:.8, textTransform:'uppercase' }}>{s.l}</div></div>
          )}
        </div>
      </div>

      {/* API catalog */}
      <section style={{ padding:'40px 16px', maxWidth:600, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(20px,5vw,26px)', fontWeight:700, textAlign:'center', letterSpacing:-.5 }}>Available APIs</h2>
        <p style={{ color:'var(--t2)', textAlign:'center', margin:'6px 0 24px', fontSize:13 }}>One key. All included.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(90px,1fr))', gap:6 }}>
          {APIS.map(a =>
            <div key={a.id} onClick={() => setSel(a.id)} className="c" style={{ cursor:'pointer', padding:12, textAlign:'center', borderColor:sel===a.id?'var(--green)':undefined, background:sel===a.id?'var(--green-d)':undefined }}>
              <div style={{ fontSize:22, marginBottom:3 }}>{a.icon}</div>
              <div style={{ fontSize:11, fontWeight:600, marginBottom:3 }}>{a.name}</div>
              <span className={`tg ${a.live?'tg-g':'tg-o'}`} style={{ fontSize:8 }}>{a.live?'LIVE':'SOON'}</span>
            </div>
          )}
        </div>
        {api && <div style={{ marginTop:16 }}>
          <div style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, marginBottom:4 }}>REQUEST</div>
          <div className="cd" style={{ fontSize:11, marginBottom:10 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--green)' }}>{api.req}</pre></div>
          <div style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, marginBottom:4 }}>RESPONSE</div>
          <div className="cd" style={{ fontSize:11 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--t2)' }}>{api.res}</pre></div>
        </div>}
      </section>

      {/* Pricing */}
      <section style={{ padding:'40px 16px', maxWidth:600, margin:'0 auto' }}>
        <h2 style={{ fontSize:'clamp(20px,5vw,26px)', fontWeight:700, textAlign:'center', letterSpacing:-.5 }}>Simple Pricing</h2>
        <p style={{ color:'var(--t2)', textAlign:'center', margin:'6px 0 24px', fontSize:13 }}>Start free. Scale when ready.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {PLANS.map(t =>
            <div key={t.id} className="c" style={{ borderColor:t.pop?'var(--green)':undefined, position:'relative', overflow:'hidden' }}>
              {t.pop && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--green)', borderRadius:'2px 2px 0 0' }} />}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <span style={{ fontSize:15, fontWeight:700 }}>{t.name}</span>
                    {t.pop && <span className="tg tg-g" style={{ fontSize:9 }}>POPULAR</span>}
                  </div>
                  <span style={{ fontSize:24, fontWeight:700 }}>${t.price}</span>
                  <span style={{ color:'var(--t3)', fontSize:12 }}>/mo · </span>
                  <span style={{ color:'var(--green)', fontSize:12, fontWeight:500 }}>{t.reqs}</span>
                </div>
                <button className={`b ${t.pop?'b-g':''}`} onClick={gLogin} style={{ minWidth:90 }}>{t.cta}</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:10 }}>
                {t.feats.map((f,i) => <span key={i} style={{ fontSize:11, color:'var(--t2)', background:'var(--s1)', padding:'2px 8px', borderRadius:16 }}>✓ {f}</span>)}
                {t.id==='free' && <span style={{ fontSize:11, color:'var(--gold)', background:'var(--gold-d)', padding:'2px 8px', borderRadius:16 }}>🎬 +ads bonus</span>}
              </div>
            </div>
          )}
        </div>
        <p style={{ color:'var(--t3)', textAlign:'center', margin:'24px 0 12px', fontSize:12 }}>Or buy credit packs — no subscription</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, maxWidth:320, margin:'0 auto' }}>
          {PACKS.map(p =>
            <div key={p.id} className="c" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--gold)' }}>{p.name}</div>
              <div style={{ fontSize:11, color:'var(--t2)', margin:'3px 0' }}>{p.credits.toLocaleString()} req</div>
              <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{p.price}</div>
              <button className="b b-o b-f" onClick={gLogin} style={{ fontSize:12, minHeight:38 }}>Buy</button>
            </div>
          )}
        </div>
      </section>

      <footer style={{ borderTop:'1px solid var(--brd)', padding:'20px 16px', textAlign:'center' }}>
        <div style={{ fontSize:11, color:'var(--t3)' }}>
          © 2026 AmineAPI — <a href="https://github.com/AmineCHABANE" style={{ color:'var(--t2)', textDecoration:'none' }}>Amine Chabane</a> · Secured by <span style={{ color:'var(--blue)' }}>Stripe</span>
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
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState('overview');
  const [ckLoading, setCkLoading] = useState(null);
  const [rewInfo, setRewInfo] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg, ok = true) => setToast({ msg, ok });

  /* Fetch data */
  const fetchData = useCallback(async () => {
    const { data: p } = await supabase.from('profiles').select('credits,plan').eq('id', session.user.id).single();
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
    const p = new URLSearchParams(window.location.search);
    if (p.get('checkout') === 'success') { notify('Payment successful! Credits added.'); window.history.replaceState({}, '', window.location.pathname); setTimeout(fetchData, 2000); }
    else if (p.get('checkout') === 'cancelled') { notify('Checkout cancelled.', false); window.history.replaceState({}, '', window.location.pathname); }
  }, [fetchData, fetchLogs]);

  /* Key */
  const genKey = async () => {
    const a = new Uint8Array(24); crypto.getRandomValues(a);
    const k = `amineapi_live_${Array.from(a, b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)}`;
    await supabase.from('api_keys').upsert([{ user_id: session.user.id, key_value: k }]); setApiKey(k);
  };
  const cpKey = () => { navigator.clipboard.writeText(apiKey); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  /* Test */
  const testApi = async () => {
    if (!prompt || !apiKey) return; setTesting(true); setResult(null);
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      setResult(await r.json()); fetchData(); fetchLogs();
    } catch (e) { setResult({ error: e.message }); }
    setTesting(false);
  };

  /* Checkout */
  const checkout = async (id) => {
    setCkLoading(id);
    try {
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan_id: id, user_id: session.user.id, user_email: session.user.email }) });
      const d = await r.json(); if (d.url) window.location.href = d.url; else notify(d.error || 'Failed', false);
    } catch (e) { notify('Error: ' + e.message, false); }
    setCkLoading(null);
  };

  /* ─── Ad Reward System ─── */
  const [adOpen, setAdOpen] = useState(false);
  const [adSec, setAdSec] = useState(30);
  const [adDone, setAdDone] = useState(false);
  const [adOk, setAdOk] = useState(false);
  const [adErr, setAdErr] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const openAd = () => { setAdOpen(true); setAdSec(30); setAdDone(false); setAdOk(false); setAdErr(false); };

  /* Countdown — only ticks when ad loaded */
  useEffect(() => {
    if (!adOpen || !adOk || adSec <= 0) { if (adSec <= 0 && adOk) setAdDone(true); return; }
    const t = setTimeout(() => setAdSec(s => s - 1), 1000); return () => clearTimeout(t);
  }, [adOpen, adSec, adOk]);

  /* Load ads: AdSense primary → Adsterra fallback */
  useEffect(() => {
    if (!adOpen) return;

    // AdSense
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}

    // Adsterra after 1.5s
    const at = setTimeout(() => {
      const box = document.getElementById('ad-zone');
      if (!box) return;
      const msg = document.getElementById('ad-wait'); if (msg) msg.style.display = 'none';
      window.atOptions = { key: '4597b34efe7f59ee1a483dc7cb84fc78', format: 'iframe', height: 250, width: 300, params: {} };
      const s = document.createElement('script');
      s.src = 'https://www.highperformanceformat.com/4597b34efe7f59ee1a483dc7cb84fc78/invoke.js';
      s.async = true; box.appendChild(s);
    }, 1500);

    // Detection: check every 1s for ad iframe or AdSense fill
    const chk = setInterval(() => {
      const box = document.getElementById('ad-zone'); if (!box) return;
      const hasIframe = box.querySelector('iframe');
      const adsenseFill = document.querySelector('.adsbygoogle[data-ad-status="filled"]');
      if (hasIframe || adsenseFill) {
        setAdOk(true); setAdErr(false); clearInterval(chk);
        // Make ads clickable
        if (hasIframe) { box.style.pointerEvents = 'auto'; }
        if (adsenseFill) { box.style.display = 'none'; } // reveal AdSense behind
      }
    }, 1000);

    // Fail after 10s
    const fl = setTimeout(() => { setAdOk(ok => { if (!ok) setAdErr(true); return ok; }); }, 10000);
    return () => { clearTimeout(at); clearInterval(chk); clearTimeout(fl); };
  }, [adOpen]);

  /* Claim reward */
  const claimAd = async () => {
    if (!adDone) return; setClaiming(true);
    try {
      const { data: { session: s } } = await supabase.auth.getSession();
      const r = await fetch('/api/reward', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.access_token}` } });
      const d = await r.json();
      if (d.success) { setCredits(d.credits_balance); setRewInfo({ left: d.rewards_remaining_today }); notify(`+${d.credits_granted} credits! ${d.rewards_remaining_today} left today.`); setAdOpen(false); }
      else notify(d.error || 'Failed', false);
    } catch (e) { notify('Error: ' + e.message, false); }
    setClaiming(false);
  };

  const pLbl = plan.charAt(0).toUpperCase() + plan.slice(1);
  const pClr = plan === 'enterprise' ? 'var(--gold)' : plan === 'pro' ? 'var(--blue)' : 'var(--green)';
  const todayN = logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const TB = [{ id:'overview', ic:'⚡', lb:'Home' },{ id:'playground', ic:'🧪', lb:'Test' },{ id:'billing', ic:'💳', lb:'Billing' },{ id:'docs', ic:'📚', lb:'Docs' }];

  return (
    <div style={{ position:'relative', zIndex:1, paddingBottom:72 }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}

      {/* ═══ AD MODAL ═══ */}
      {adOpen && <div className="ov">
        <div className="ov-box">
          <button onClick={() => setAdOpen(false)} style={{ position:'absolute', top:10, right:14, background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:20, padding:4 }}>✕</button>
          <div style={{ fontSize:22, marginBottom:4 }}>🎬</div>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Watch Ad → 3 Credits</h3>
          <p style={{ fontSize:11, color:'var(--t3)', marginBottom:14 }}>View 30 seconds to claim.</p>

          {/* Ad zone — ads are clickable, overlay is not */}
          <div style={{ background:'var(--s1)', border:'1px solid var(--brd)', borderRadius:10, minHeight:250, marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
            <ins className="adsbygoogle" style={{ display:'block', width:'100%', height:250 }} data-ad-client="ca-pub-7526517043500512" data-ad-slot="auto" data-ad-format="rectangle" data-full-width-responsive="true" />
            <div id="ad-zone" style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div id="ad-wait" style={{ textAlign:'center', color:'var(--t3)', fontSize:11, pointerEvents:'none' }}>
                <div style={{ fontSize:28, marginBottom:4, opacity:.3 }}>📢</div>Loading ad...
              </div>
            </div>
          </div>

          {/* Countdown or Claim */}
          {!adDone ? <div>
            <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${adOk?'var(--gold)':'var(--brd)'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 6px', fontSize:18, fontWeight:700, color:adOk?'var(--gold)':'var(--t3)', transition:'border-color .3s, color .3s' }}>
              {adOk ? adSec : '⏸'}
            </div>
            <p style={{ fontSize:11, color:'var(--t3)', marginBottom:6 }}>{adOk ? `${adSec}s remaining` : 'Waiting for ad...'}</p>
            <div style={{ width:'100%', height:3, background:'var(--brd)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:adOk?`${((30-adSec)/30)*100}%`:'0%', height:'100%', background:'var(--gold)', borderRadius:2, transition:'width 1s linear' }} />
            </div>
            {adErr && <div style={{ marginTop:12, padding:10, background:'var(--red-d)', borderRadius:10 }}>
              <p style={{ fontSize:11, color:'var(--red)', fontWeight:600 }}>Ad failed — no credits</p>
              <p style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>Disable ad blocker or buy credits.</p>
              <div style={{ display:'flex', gap:6, marginTop:8, justifyContent:'center' }}>
                <button className="b" onClick={() => { setAdOpen(false); setTimeout(openAd, 300); }} style={{ fontSize:11, padding:'6px 14px', minHeight:34 }}>🔄 Retry</button>
                <button className="b b-b" onClick={() => { setAdOpen(false); setTab('billing'); }} style={{ fontSize:11, padding:'6px 14px', minHeight:34 }}>💳 Buy</button>
              </div>
            </div>}
          </div> : <button className="b b-g b-f" onClick={claimAd} disabled={claiming} style={{ fontSize:15, padding:14, animation:'pulse 1.5s infinite' }}>
            {claiming ? '⏳ Claiming...' : '✓ Claim +3 Credits!'}
          </button>}
        </div>
      </div>}

      {/* ═══ TOP BAR ═══ */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid var(--brd)', position:'sticky', top:0, background:'var(--glass)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontWeight:700, fontSize:16, color:'var(--green)' }}>⚡</span>
          <div className="dk" style={{ display:'flex', gap:2 }}>
            {TB.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background:tab===t.id?'var(--s2)':'transparent', border:'none', color:tab===t.id?'var(--t1)':'var(--t3)', cursor:'pointer', fontSize:13, fontFamily:'var(--font)', fontWeight:500, padding:'7px 14px', borderRadius:8, transition:'all .15s' }}>{t.lb}</button>)}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className="tg" style={{ background:`${pClr}15`, color:pClr, fontSize:10 }}>{pLbl}</span>
          <button className="b b-x" onClick={() => supabase.auth.signOut()} style={{ fontSize:11, padding:'5px 10px', minHeight:32 }}>Sign Out</button>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth:600, margin:'0 auto', padding:16 }}>

        {/* OVERVIEW */}
        {tab === 'overview' && <div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div className="c"><div style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, textTransform:'uppercase', marginBottom:4 }}>Credits</div><div style={{ fontSize:26, fontWeight:700, color:credits>10?'var(--green)':'var(--red)' }}>{credits.toLocaleString()}</div></div>
            <div className="c"><div style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, textTransform:'uppercase', marginBottom:4 }}>Today</div><div style={{ fontSize:26, fontWeight:700 }}>{todayN}</div></div>
          </div>

          {/* Watch & Earn */}
          <div className="c" style={{ marginBottom:14, borderColor:'rgba(234,179,8,.15)', background:'linear-gradient(135deg,var(--s1),rgba(234,179,8,.03))' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:140 }}>
                <div style={{ fontSize:14, fontWeight:700, marginBottom:2 }}>🎬 Watch & Earn</div>
                <p style={{ fontSize:12, color:'var(--t2)', lineHeight:1.4 }}>{rewInfo ? `${rewInfo.left} left today` : '5×/day = 15 free credits'}</p>
              </div>
              <button className="b b-o" onClick={openAd}>▶ Watch (+3)</button>
            </div>
          </div>

          {/* API Key */}
          <div className="c" style={{ marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600 }}>🔑 API Key</span>
              {apiKey && <button className="b b-x" onClick={cpKey} style={{ fontSize:11, padding:'3px 10px', minHeight:28 }}>{copied ? '✓ Copied' : 'Copy'}</button>}
            </div>
            {apiKey
              ? <code style={{ fontSize:11, color:'var(--green)', background:'var(--s1)', padding:'10px 12px', borderRadius:8, display:'block', wordBreak:'break-all', fontFamily:'var(--mono)' }}>{apiKey}</code>
              : <button className="b b-g b-f" onClick={genKey}>Generate API Key</button>}
          </div>

          {credits <= 0 && <div className="c" style={{ borderColor:'rgba(239,68,68,.15)', textAlign:'center', padding:18 }}>
            <p style={{ color:'var(--red)', fontWeight:600, marginBottom:10, fontSize:13 }}>No credits remaining</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
              <button className="b b-o" onClick={openAd}>🎬 Watch (+3)</button>
              <button className="b b-b" onClick={() => setTab('billing')}>💳 Buy</button>
            </div>
          </div>}

          {logs.length > 0 && <div style={{ marginTop:14 }}>
            <h3 style={{ fontSize:13, fontWeight:600, marginBottom:8 }}>Recent Activity</h3>
            <div className="c" style={{ padding:0, overflow:'hidden' }}>
              {logs.slice(0, 6).map((l, i) =>
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px', borderTop:i?'1px solid var(--brd)':'none', fontSize:11 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ color:l.status_code===200?'var(--green)':'var(--red)', fontSize:8 }}>●</span>
                    <code style={{ fontFamily:'var(--mono)', color:'var(--t2)', fontSize:10 }}>{l.endpoint}</code>
                  </div>
                  <span style={{ color:'var(--t3)', fontSize:9 }}>{new Date(l.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                </div>
              )}
            </div>
          </div>}
        </div>}

        {/* PLAYGROUND */}
        {tab === 'playground' && <div>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>🧪 Playground</h2>
          <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16 }}>Test the AI Chat API live.</p>
          <div className="c">
            <label style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, textTransform:'uppercase', display:'block', marginBottom:4 }}>Prompt</label>
            <textarea rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ask anything..." style={{ resize:'vertical', marginBottom:10 }} />
            <button className="b b-g b-f" onClick={testApi} disabled={testing || !prompt || !apiKey}>
              {testing ? '⏳ Running...' : '▶ Send Request'}
            </button>
            {!apiKey && <p style={{ textAlign:'center', color:'var(--gold)', fontSize:12, marginTop:10 }}>Generate an API key first</p>}
            {result && <div style={{ marginTop:14 }}>
              <div style={{ fontSize:10, color:'var(--t3)', letterSpacing:.8, marginBottom:4 }}>RESPONSE</div>
              <div className="cd" style={{ fontSize:11 }}>
                <pre style={{ whiteSpace:'pre-wrap', margin:0, color:result.error?'var(--red)':'var(--t2)' }}>{JSON.stringify(result, null, 2)}</pre>
              </div>
            </div>}
          </div>
        </div>}

        {/* BILLING */}
        {tab === 'billing' && <div>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>💳 Billing</h2>
          <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16 }}>{credits.toLocaleString()} credits · {pLbl} plan</p>

          <div className="c" style={{ marginBottom:16, borderColor:'rgba(234,179,8,.12)', background:'linear-gradient(135deg,var(--s1),rgba(234,179,8,.03))', textAlign:'center' }}>
            <div style={{ fontSize:28, marginBottom:4 }}>🎬</div>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Free Credits</h3>
            <p style={{ fontSize:12, color:'var(--t2)', marginBottom:12 }}>{rewInfo ? `${rewInfo.left} left today` : '5× per day = 15 free'}</p>
            <button className="b b-o" onClick={openAd} style={{ padding:'12px 28px' }}>▶ Watch Ad (+3)</button>
          </div>

          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>⚡ Credit Packs</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {PACKS.map(p =>
              <div key={p.id} className="c" style={{ textAlign:'center', padding:14 }}>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--gold)' }}>{p.name}</div>
                <div style={{ fontSize:11, color:'var(--t2)', margin:'3px 0' }}>{p.credits.toLocaleString()} req</div>
                <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>{p.price}</div>
                <button className="b b-o b-f" onClick={() => checkout(p.id)} disabled={ckLoading===p.id} style={{ fontSize:12, minHeight:38 }}>
                  {ckLoading===p.id ? '⏳...' : `Buy ${p.price}`}
                </button>
              </div>
            )}
          </div>

          <h3 style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>🚀 Plans</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {PLANS.map(t => {
              const cur = plan === t.id;
              return <div key={t.id} className="c" style={{ borderColor:cur?pClr:t.pop?'var(--green)':undefined, opacity:cur?.6:1, position:'relative', overflow:'hidden' }}>
                {t.pop && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'var(--green)' }} />}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                      <span style={{ fontSize:15, fontWeight:700 }}>{t.name}</span>
                      {cur && <span className="tg tg-g" style={{ fontSize:9 }}>CURRENT</span>}
                    </div>
                    <span style={{ fontSize:22, fontWeight:700 }}>${t.price}</span>
                    <span style={{ color:'var(--t3)', fontSize:11 }}>/mo · </span>
                    <span style={{ color:'var(--green)', fontSize:11 }}>{t.reqs}</span>
                  </div>
                  <button className={`b ${t.pop&&!cur?'b-b':''}`} onClick={() => t.id!=='free'&&!cur&&checkout(t.id)} disabled={cur||t.id==='free'||ckLoading===t.id} style={{ minWidth:90 }}>
                    {cur ? '✓ Current' : ckLoading===t.id ? '⏳...' : t.id==='free' ? 'Free' : t.cta}
                  </button>
                </div>
              </div>;
            })}
          </div>
          <p style={{ textAlign:'center', marginTop:16, fontSize:11, color:'var(--t3)' }}>🔒 Payments by <span style={{ color:'var(--blue)' }}>Stripe</span></p>
        </div>}

        {/* DOCS */}
        {tab === 'docs' && <div>
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>📚 API Docs</h2>
          <p style={{ color:'var(--t2)', fontSize:13, marginBottom:16 }}>Complete reference.</p>
          {APIS.map(a =>
            <div key={a.id} className="c" style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:18 }}>{a.icon}</span>
                  <div><div style={{ fontSize:13, fontWeight:700 }}>{a.name}</div><div style={{ fontSize:10, color:'var(--t3)' }}>{a.desc}</div></div>
                </div>
                <div style={{ display:'flex', gap:4 }}>
                  <span className="tg tg-b" style={{ fontSize:9 }}>{a.method}</span>
                  <span className={`tg ${a.live?'tg-g':'tg-o'}`} style={{ fontSize:9 }}>{a.live?'LIVE':'SOON'}</span>
                </div>
              </div>
              <div style={{ fontSize:9, color:'var(--t3)', letterSpacing:.8, marginBottom:3 }}>REQUEST</div>
              <div className="cd" style={{ fontSize:10, marginBottom:8 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--green)' }}>{a.req}</pre></div>
              <div style={{ fontSize:9, color:'var(--t3)', letterSpacing:.8, marginBottom:3 }}>RESPONSE</div>
              <div className="cd" style={{ fontSize:10 }}><pre style={{ whiteSpace:'pre-wrap', margin:0, color:'var(--t2)' }}>{a.res}</pre></div>
            </div>
          )}
          <div className="c">
            <h3 style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>Error Codes</h3>
            {[{c:400,m:'Bad Request'},{c:401,m:'Unauthorized — bad API key'},{c:402,m:'Payment Required — no credits'},{c:429,m:'Rate Limited — wait 2s'},{c:500,m:'Server Error'}].map(e =>
              <div key={e.c} style={{ display:'flex', gap:8, padding:'5px 0', borderTop:'1px solid var(--brd)', fontSize:11 }}>
                <code style={{ color:'var(--red)', fontWeight:600, minWidth:28, fontFamily:'var(--mono)' }}>{e.c}</code>
                <span style={{ color:'var(--t2)' }}>{e.m}</span>
              </div>
            )}
          </div>
        </div>}
      </div>

      {/* Mobile bottom nav */}
      <div className="bn">
        {TB.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={tab===t.id?'a':''}><span className="ic">{t.ic}</span>{t.lb}</button>)}
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
  const el = async () => { const e = window.prompt('Enter your email:'); if (!e) return; const { error } = await supabase.auth.signInWithOtp({ email: e }); if (error) alert(error.message); else alert('Check your email for the magic link!'); };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#09090b' }}>
    <div style={{ animation:'spin 1s linear infinite', width:22, height:22, border:'2px solid rgba(255,255,255,.08)', borderTopColor:'var(--green)', borderRadius:'50%' }} />
  </div>;

  return (<><style>{CSS}</style><div className="glow" />{session ? <Dashboard session={session} /> : <Landing gLogin={gl} eLogin={el} />}</>);
}

export default App;
