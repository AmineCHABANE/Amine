import crypto from 'crypto';
import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  setCors(res);

  const { text, algorithm = 'sha256', encoding = 'hex' } = req.body || {};

  if (!text) return res.status(400).json({ error: 'Missing "text" in body' });
  if (typeof text !== 'string' || text.length > 10000) return res.status(400).json({ error: 'Text must be under 10000 characters' });

  const algos = ['md5', 'sha1', 'sha256', 'sha512'];
  const alg = algorithm.toLowerCase();
  if (!algos.includes(alg)) return res.status(400).json({ error: `Algorithm must be one of: ${algos.join(', ')}` });

  const enc = ['hex', 'base64'].includes(encoding) ? encoding : 'hex';
  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const hash = crypto.createHash(alg).update(text).digest(enc);

    await deductAndLog(user.userId, '/api/hash', `${alg}:${text.substring(0, 30)}`);

    return res.status(200).json({
      hash,
      algorithm: alg,
      encoding: enc,
      input_length: text.length,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] hash error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
