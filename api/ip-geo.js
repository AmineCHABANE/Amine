import { setCors, auth, deductAndLog } from './_lib/helpers.js';

// Free: ip-api.com (45 req/min, no key needed)
const GEO_URL = 'http://ip-api.com/json';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  // IP from query or from request headers
  let ip = req.query.ip;
  if (!ip) {
    ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
  }
  if (!ip || ip === '::1' || ip === '127.0.0.1') {
    return res.status(400).json({ error: 'Missing "ip" parameter or cannot detect IP', example: '/api/ip-geo?ip=8.8.8.8' });
  }

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const r = await fetch(`${GEO_URL}/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`);
    const d = await r.json();

    if (d.status === 'fail') {
      return res.status(400).json({ error: d.message || 'Invalid IP address', ip });
    }

    await deductAndLog(user.userId, '/api/ip-geo', ip);

    return res.status(200).json({
      ip,
      country: d.country,
      country_code: d.countryCode,
      region: d.regionName,
      region_code: d.region,
      city: d.city,
      zip: d.zip,
      latitude: d.lat,
      longitude: d.lon,
      timezone: d.timezone,
      isp: d.isp,
      organization: d.org,
      as_number: d.as,
      is_mobile: d.mobile,
      is_proxy: d.proxy,
      is_hosting: d.hosting,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] ip-geo error:', e);
    return res.status(500).json({ error: 'Geolocation service temporarily unavailable' });
  }
}
