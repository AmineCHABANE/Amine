import { setCors, auth, deductAndLog } from './_lib/helpers.js';

// Free API: open.er-api.com (no key needed, 1500 req/mo)
const RATE_URL = 'https://open.er-api.com/v6/latest';

// In-memory cache (refreshes every 30min in serverless context)
let rateCache = { data: null, ts: 0 };
const CACHE_TTL = 30 * 60 * 1000; // 30 min

async function getRates(base) {
  const key = base.toUpperCase();
  const now = Date.now();
  if (rateCache.data && rateCache.data.base === key && now - rateCache.ts < CACHE_TTL) {
    return rateCache.data;
  }
  const r = await fetch(`${RATE_URL}/${key}`);
  if (!r.ok) throw new Error('Exchange rate provider error');
  const d = await r.json();
  if (d.result !== 'success') throw new Error('Exchange rate fetch failed');
  rateCache = { data: d, ts: now };
  return d;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const { from = 'USD', to, amount = '1', list } = req.query;

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const rates = await getRates(from);

    // List all currencies
    if (list === 'true' || list === '1') {
      await deductAndLog(user.userId, '/api/currency', `list from:${from}`);
      return res.status(200).json({
        base: from.toUpperCase(),
        rates: rates.rates,
        currencies_count: Object.keys(rates.rates).length,
        last_updated: rates.time_last_update_utc,
        credits_remaining: user.credits - 1,
        latency_ms: Date.now() - start,
      });
    }

    if (!to) return res.status(400).json({ error: 'Missing "to" parameter', example: '/api/currency?from=EUR&to=USD&amount=100' });

    const toKey = to.toUpperCase();
    const rate = rates.rates[toKey];
    if (!rate) return res.status(400).json({ error: `Unknown currency: ${toKey}`, hint: 'Add ?list=true to see all currencies' });

    const amt = parseFloat(amount) || 1;
    const converted = Math.round(amt * rate * 100) / 100;

    await deductAndLog(user.userId, '/api/currency', `${from}→${to} x${amt}`);

    return res.status(200).json({
      from: from.toUpperCase(),
      to: toKey,
      amount: amt,
      rate: Math.round(rate * 1000000) / 1000000,
      result: converted,
      last_updated: rates.time_last_update_utc,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] currency error:', e);
    return res.status(500).json({ error: 'Currency service temporarily unavailable' });
  }
}
