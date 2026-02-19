import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CORS_H = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

function cors(res) { Object.entries(CORS_H).forEach(([k, v]) => res.setHeader(k, v)); }

/* ═══ AUTH + CREDITS ═══ */
async function auth(req, res) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) { res.status(401).json({ error: 'Missing x-api-key header' }); return null; }
  const { data: kd } = await supabase.from('api_keys').select('user_id').eq('key_value', apiKey).single();
  if (!kd) { res.status(403).json({ error: 'Invalid API key' }); return null; }
  const uid = kd.user_id;
  const { data: ll } = await supabase.from('usage_logs').select('created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(1).single();
  if (ll && Date.now() - new Date(ll.created_at).getTime() < 2000) { res.status(429).json({ error: 'Rate limited', retry_after_ms: 2000 }); return null; }
  const { data: p } = await supabase.from('profiles').select('credits').eq('id', uid).single();
  if (!p || p.credits <= 0) { res.status(402).json({ error: 'Insufficient credits', message: 'Top up at https://api-amine.vercel.app' }); return null; }
  return { uid, credits: p.credits };
}

async function log(uid, ep, summary = '') {
  await Promise.all([
    supabase.rpc('decrement_credits', { user_id_input: uid }),
    supabase.from('usage_logs').insert([{ user_id: uid, endpoint: ep, prompt_summary: summary.substring(0, 80), status_code: 200 }]),
  ]);
}

/* ═══════════════════════════════════════════
   TOOL HANDLERS
   ═══════════════════════════════════════════ */

/* ─── QR CODE ─── */
async function handleQrcode(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { data, size = '300', format = 'png', dark = '000000', light = 'ffffff' } = req.query;
  if (!data) return res.status(400).json({ error: 'Missing "data" param', example: '/api/qrcode?data=https://example.com' });
  if (data.length > 2000) return res.status(400).json({ error: 'Data must be under 2000 chars' });
  const u = await auth(req, res); if (!u) return;
  const QRCode = (await import('qrcode')).default;
  const sz = Math.min(Math.max(parseInt(size) || 300, 50), 1000);
  const opts = { width: sz, color: { dark: `#${dark}`, light: `#${light}` }, margin: 2 };
  if (format === 'svg') {
    const svg = await QRCode.toString(data, { ...opts, type: 'svg' });
    await log(u.uid, '/api/qrcode', data.substring(0, 40));
    res.setHeader('Content-Type', 'image/svg+xml'); return res.send(svg);
  }
  const buf = await QRCode.toBuffer(data, { ...opts, type: 'png' });
  await log(u.uid, '/api/qrcode', data.substring(0, 40));
  res.setHeader('Content-Type', 'image/png'); res.setHeader('Cache-Control', 'public, max-age=86400');
  return res.send(buf);
}

/* ─── PASSWORD ─── */
async function handlePassword(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { length = '16', count = '1', uppercase = 'true', lowercase = 'true', numbers = 'true', symbols = 'false', exclude = '' } = req.query;
  const len = Math.min(Math.max(parseInt(length) || 16, 4), 128);
  const cnt = Math.min(Math.max(parseInt(count) || 1, 1), 50);
  let chars = '';
  if (uppercase !== 'false') chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase !== 'false') chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers !== 'false') chars += '0123456789';
  if (symbols === 'true') chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  if (exclude) chars = chars.split('').filter(c => !exclude.includes(c)).join('');
  if (!chars) return res.status(400).json({ error: 'No character set' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const pws = []; for (let i = 0; i < cnt; i++) { const b = crypto.randomBytes(len); let pw = ''; for (let j = 0; j < len; j++) pw += chars[b[j] % chars.length]; pws.push(pw); }
  const entropy = Math.floor(len * Math.log2(chars.length));
  const strength = entropy >= 80 ? 'very_strong' : entropy >= 60 ? 'strong' : entropy >= 40 ? 'medium' : 'weak';
  await log(u.uid, '/api/password', `len:${len}`);
  return res.json({ password: cnt === 1 ? pws[0] : undefined, passwords: cnt > 1 ? pws : undefined, length: len, count: cnt, entropy_bits: entropy, strength, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── HASH ─── */
async function handleHash(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { text, algorithm = 'sha256', encoding = 'hex' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing "text"' });
  if (typeof text !== 'string' || text.length > 10000) return res.status(400).json({ error: 'Text must be under 10000 chars' });
  const algos = ['md5', 'sha1', 'sha256', 'sha512'];
  const alg = algorithm.toLowerCase();
  if (!algos.includes(alg)) return res.status(400).json({ error: `Algorithm: ${algos.join(', ')}` });
  const enc = ['hex', 'base64'].includes(encoding) ? encoding : 'hex';
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const hash = crypto.createHash(alg).update(text).digest(enc);
  await log(u.uid, '/api/hash', `${alg}:${text.substring(0, 30)}`);
  return res.json({ hash, algorithm: alg, encoding: enc, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── URL SHORTENER ─── */
async function handleShorten(req, res) {
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing "code"' });
    const { data } = await supabase.from('short_urls').select('original_url, id').eq('code', code).single();
    if (!data) return res.status(404).json({ error: 'Not found' });
    await supabase.rpc('increment_clicks', { url_id_input: data.id });
    return res.redirect(302, data.original_url);
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { url, custom_code } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing "url"' });
  try { const parsed = new URL(url); if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(); } catch { return res.status(400).json({ error: 'Invalid URL (must be http/https)' }); }
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  let code = custom_code;
  if (code) { if (!/^[a-zA-Z0-9_-]{3,20}$/.test(code)) return res.status(400).json({ error: 'Code: 3-20 alphanumeric' }); const { data: ex } = await supabase.from('short_urls').select('id').eq('code', code).single(); if (ex) return res.status(409).json({ error: 'Code taken' }); }
  else code = crypto.randomBytes(4).toString('base64url').substring(0, 6);
  await supabase.from('short_urls').insert([{ user_id: u.uid, code, original_url: url, clicks: 0 }]);
  await log(u.uid, '/api/shorten', `${code}→${url.substring(0, 40)}`);
  return res.json({ short_url: `https://api-amine.vercel.app/api/shorten?code=${code}`, code, original_url: url, clicks: 0, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── EMAIL VERIFY ─── */
const DISPOSABLE = new Set(['mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','yopmail.com','sharklasers.com','grr.la','dispostable.com','mailnesia.com','trashmail.com','10minutemail.com','temp-mail.org','fakeinbox.com','maildrop.cc','mohmal.com','getnada.com','emailondeck.com','33mail.com','mailcatch.com','discard.email','discardmail.com','spamgourmet.com']);
const FREE_PROV = new Set(['gmail.com','yahoo.com','hotmail.com','outlook.com','live.com','aol.com','icloud.com','protonmail.com','zoho.com']);

async function handleEmailVerify(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing "email" param' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const rx = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const syn = rx.test(email) && email.length <= 254;
  const [, dom] = email.split('@');
  let mx = false, mxr = [], disp = false, free = false;
  if (syn && dom) {
    try { const r = await resolveMx(dom); mx = r?.length > 0; mxr = (r || []).sort((a, b) => a.priority - b.priority).slice(0, 5).map(r => ({ host: r.exchange, priority: r.priority })); } catch {}
    disp = DISPOSABLE.has(dom.toLowerCase());
    free = FREE_PROV.has(dom.toLowerCase());
  }
  let risk = 0; if (!syn) risk = 100; else if (!mx) risk += 50; if (disp) risk += 40;
  await log(u.uid, '/api/email-verify', email.substring(0, 40));
  return res.json({ email, valid: syn && mx && !disp, syntax_valid: syn, mx_found: mx, mx_records: mxr, disposable: disp, free_provider: free, domain: dom, risk_score: Math.min(risk, 100), credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── CURRENCY ─── */
let rateCache = { data: null, ts: 0 };
async function getRates(base) {
  const k = base.toUpperCase(); const now = Date.now();
  if (rateCache.data?.base === k && now - rateCache.ts < 1800000) return rateCache.data;
  const r = await fetch(`https://open.er-api.com/v6/latest/${k}`); const d = await r.json();
  if (d.result !== 'success') throw new Error('Rate fetch failed');
  rateCache = { data: d, ts: now }; return d;
}

async function handleCurrency(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { from = 'USD', to, amount = '1', list } = req.query;
  const u = await auth(req, res); if (!u) return;
  const t = Date.now(); const rates = await getRates(from);
  if (list === 'true') { await log(u.uid, '/api/currency', `list`); return res.json({ base: from.toUpperCase(), rates: rates.rates, count: Object.keys(rates.rates).length, credits_remaining: u.credits - 1, latency_ms: Date.now() - t }); }
  if (!to) return res.status(400).json({ error: 'Missing "to" param', example: '/api/currency?from=EUR&to=USD&amount=100' });
  const tk = to.toUpperCase(); const rate = rates.rates[tk];
  if (!rate) return res.status(400).json({ error: `Unknown currency: ${tk}` });
  const amt = parseFloat(amount) || 1;
  await log(u.uid, '/api/currency', `${from}→${to}`);
  return res.json({ from: from.toUpperCase(), to: tk, amount: amt, rate: Math.round(rate * 1e6) / 1e6, result: Math.round(amt * rate * 100) / 100, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── IP GEO ─── */
async function handleIpGeo(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  let ip = req.query.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
  if (!ip || ip === '::1') return res.status(400).json({ error: 'Missing "ip" param' });
  // Validate IP format
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) && !/^[a-fA-F0-9:]+$/.test(ip)) return res.status(400).json({ error: 'Invalid IP format' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const r = await fetch(`https://ipwho.is/${ip}`);
  const d = await r.json();
  if (!d.success) return res.status(400).json({ error: d.message || 'IP lookup failed', ip });
  await log(u.uid, '/api/ip-geo', ip);
  return res.json({ ip, country: d.country, country_code: d.country_code, region: d.region, city: d.city, zip: d.postal, latitude: d.latitude, longitude: d.longitude, timezone: d.timezone?.id, isp: d.connection?.isp, is_proxy: d.security?.proxy || false, is_vpn: d.security?.vpn || false, is_tor: d.security?.tor || false, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── WEATHER ─── */
const WMO = { 0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',51:'Light drizzle',53:'Moderate drizzle',61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',75:'Heavy snow',80:'Slight showers',81:'Moderate showers',95:'Thunderstorm' };

async function handleWeather(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { city, lat, lon, units = 'celsius' } = req.query;
  if (!city && (!lat || !lon)) return res.status(400).json({ error: 'Provide "city" or "lat"+"lon"' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  let la = parseFloat(lat), lo = parseFloat(lon), cn = city;
  if (city && (!lat || !lon)) {
    const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
    const gd = await g.json();
    if (!gd.results?.length) return res.status(404).json({ error: `City not found: ${city}` });
    la = gd.results[0].latitude; lo = gd.results[0].longitude; cn = gd.results[0].name;
  }
  const tu = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  const m = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${la}&longitude=${lo}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset&temperature_unit=${tu}&timezone=auto&forecast_days=7`);
  const md = await m.json();
  if (!md.current) throw new Error('No weather data');
  const c = md.current, dy = md.daily;
  const forecast = dy.time.map((d, i) => ({ date: d, temp_max: dy.temperature_2m_max[i], temp_min: dy.temperature_2m_min[i], precipitation_mm: dy.precipitation_sum[i], condition: WMO[dy.weather_code[i]] || 'Unknown' }));
  await log(u.uid, '/api/weather', cn || `${la},${lo}`);
  return res.json({ location: { city: cn, latitude: la, longitude: lo, timezone: md.timezone }, current: { temperature: c.temperature_2m, feels_like: c.apparent_temperature, humidity: c.relative_humidity_2m, precipitation_mm: c.precipitation, wind_speed: c.wind_speed_10m, condition: WMO[c.weather_code] || 'Unknown', unit: tu }, forecast, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── LOREM IPSUM ─── */
const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function rw() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }
function rs(min = 5, max = 15) { const n = min + Math.floor(Math.random() * (max - min + 1)); const w = Array.from({ length: n }, rw); w[0] = w[0][0].toUpperCase() + w[0].slice(1); return w.join(' ') + '.'; }
function rp() { return Array.from({ length: 3 + Math.floor(Math.random() * 5) }, rs).join(' '); }

async function handleLorem(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { type = 'paragraphs', count = '3', format = 'json' } = req.query;
  const cnt = Math.min(Math.max(parseInt(count) || 3, 1), 50);
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const items = type === 'words' ? Array.from({ length: cnt }, rw) : type === 'sentences' ? Array.from({ length: cnt }, rs) : Array.from({ length: cnt }, rp);
  await log(u.uid, '/api/lorem', `${type}:${cnt}`);
  if (format === 'text') { res.setHeader('Content-Type', 'text/plain'); return res.send(items.join(type === 'words' ? ' ' : '\n\n')); }
  return res.json({ type, count: cnt, text: items.join(type === 'words' ? ' ' : '\n\n'), items, word_count: items.join(' ').split(' ').length, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── AI: SUMMARIZE ─── */
async function aiCall(system, content, maxT = 500, temp = 0.3) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: system }, { role: 'user', content }], max_tokens: maxT, temperature: temp }) });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || 'AI error'); }
  const d = await r.json(); return d.choices?.[0]?.message?.content?.trim();
}

async function handleSummarize(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { text, url, length = 'medium', language = 'en' } = req.body || {};
  if (!text && !url) return res.status(400).json({ error: 'Provide "text" or "url"' });
  let content = text;
  if (url && !text) {
    try { const r = await fetch(url, { headers: { 'User-Agent': 'AmineAPI/1.0' } }); const h = await r.text(); content = h.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 8000); }
    catch { return res.status(400).json({ error: 'Failed to fetch URL' }); }
  }
  if (!content || content.length < 50) return res.status(400).json({ error: 'Text too short (min 50 chars)' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const lenMap = { short: '2-3 sentences', medium: '4-6 sentences', long: '2-3 paragraphs' };
  const summary = await aiCall(`Summarize in ${lenMap[length] || lenMap.medium}. ${language !== 'en' ? `Write in ${language}.` : ''} Be concise.`, content.substring(0, 10000));
  await log(u.uid, '/api/summarize', (url || text).substring(0, 60));
  return res.json({ summary, source: url || 'text_input', original_length: content.length, summary_length: summary.length, compression_ratio: Math.round((1 - summary.length / content.length) * 100) + '%', credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── AI: TRANSLATE ─── */
const LANGS = { en:'English',fr:'French',es:'Spanish',de:'German',it:'Italian',pt:'Portuguese',nl:'Dutch',ru:'Russian',zh:'Chinese',ja:'Japanese',ko:'Korean',ar:'Arabic',hi:'Hindi',tr:'Turkish',pl:'Polish',sv:'Swedish',uk:'Ukrainian' };

async function handleTranslate(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { text, from = 'auto', to = 'en' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing "text"' });
  if (typeof text !== 'string' || text.length > 5000) return res.status(400).json({ error: 'Text must be under 5000 chars' });
  const tgt = LANGS[to] || 'English';
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const translated = await aiCall(`Translate to ${tgt}. ${from === 'auto' ? 'Auto-detect source.' : ''} Output ONLY translated text.`, text, Math.min(text.length * 3, 2000), 0.2);
  await log(u.uid, '/api/translate', `→${to}: ${text.substring(0, 30)}`);
  return res.json({ translated_text: translated, source_language: from, target_language: to, source_text: text, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── AI: SENTIMENT ─── */
async function handleSentiment(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const { text, texts } = req.body || {};
  const items = texts ? texts.slice(0, 10) : text ? [text] : [];
  if (!items.length) return res.status(400).json({ error: 'Provide "text" or "texts" (max 10)' });
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const prompt = items.length === 1
    ? `Analyze sentiment. Reply ONLY JSON: {"sentiment":"positive|negative|neutral|mixed","confidence":0-1,"emotions":[],"score":-1 to 1}\n\nText: "${items[0]}"`
    : `Analyze each text. Reply ONLY JSON array, each: {"sentiment","confidence","emotions","score"}\n\n${items.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`;
  const raw = await aiCall('Sentiment analysis API. Respond ONLY valid JSON.', prompt, 500, 0.1);
  let parsed; try { parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim()); } catch { return res.status(502).json({ error: 'Parse error' }); }
  await log(u.uid, '/api/sentiment', items[0].substring(0, 40));
  if (items.length === 1) return res.json({ ...parsed, text: items[0], credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
  return res.json({ results: Array.isArray(parsed) ? parsed.map((r, i) => ({ ...r, text: items[i] })) : parsed, count: items.length, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── UUID ─── */
async function handleUuid(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { version = '4', count = '1', format = 'standard' } = req.query;
  const cnt = Math.min(Math.max(parseInt(count) || 1, 1), 100);
  const u = await auth(req, res); if (!u) return;
  const t = Date.now();
  const uuids = [];
  for (let i = 0; i < cnt; i++) {
    let uuid = crypto.randomUUID();
    if (format === 'compact') uuid = uuid.replace(/-/g, '');
    if (format === 'uppercase') uuid = uuid.toUpperCase();
    uuids.push(uuid);
  }
  await log(u.uid, '/api/uuid', `v${version} x${cnt}`);
  return res.json({ uuid: cnt === 1 ? uuids[0] : undefined, uuids: cnt > 1 ? uuids : undefined, version: parseInt(version), count: cnt, credits_remaining: u.credits - 1, latency_ms: Date.now() - t });
}

/* ─── PLACEHOLDER IMAGE ─── */
async function handlePlaceholder(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  const { w = '400', h = '300', bg = '1a1a2e', color = '888888', text: ct, font = '16' } = req.query;
  const W = Math.min(Math.max(parseInt(w) || 400, 10), 4000);
  const H = Math.min(Math.max(parseInt(h) || 300, 10), 4000);
  const fs = Math.min(Math.max(parseInt(font) || 16, 8), 120);
  const safeBg = /^[a-fA-F0-9]{3,8}$/.test(bg) ? bg : '1a1a2e';
  const safeColor = /^[a-fA-F0-9]{3,8}$/.test(color) ? color : '888888';
  const lb = (ct || `${W} × ${H}`).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').substring(0, 100);
  const u = await auth(req, res); if (!u) return;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#${safeBg}"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${fs}" fill="#${safeColor}">${lb}</text></svg>`;
  await log(u.uid, '/api/placeholder', `${W}x${H}`);
  res.setHeader('Content-Type', 'image/svg+xml'); res.setHeader('Cache-Control', 'public, max-age=604800');
  return res.send(svg);
}


/* ═══════════════════════════════════════════
   ROUTER
   ═══════════════════════════════════════════ */
const ROUTES = {
  qrcode: handleQrcode,
  password: handlePassword,
  hash: handleHash,
  shorten: handleShorten,
  'email-verify': handleEmailVerify,
  currency: handleCurrency,
  'ip-geo': handleIpGeo,
  weather: handleWeather,
  lorem: handleLorem,
  summarize: handleSummarize,
  translate: handleTranslate,
  sentiment: handleSentiment,
  uuid: handleUuid,
  placeholder: handlePlaceholder,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS').setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key').end();
  cors(res);

  const tool = req.query.t;
  if (!tool || !ROUTES[tool]) {
    return res.status(400).json({ error: 'Unknown tool', available: Object.keys(ROUTES), usage: '/api/tools?t=qrcode&data=hello' });
  }

  try {
    return await ROUTES[tool](req, res);
  } catch (e) {
    console.error(`[AmineAPI] ${tool} error:`, e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
