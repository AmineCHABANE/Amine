import crypto from 'crypto';
import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const {
    version = '4',
    count = '1',
    format = 'standard', // standard, compact (no dashes), uppercase
  } = req.query;

  const cnt = Math.min(Math.max(parseInt(count) || 1, 1), 100);
  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const uuids = [];
    for (let i = 0; i < cnt; i++) {
      let uuid;

      if (version === '7') {
        // UUID v7 (timestamp-based, sortable)
        const now = Date.now();
        const bytes = crypto.randomBytes(16);
        // Encode timestamp in first 48 bits
        bytes[0] = (now >>> 40) & 0xff;
        bytes[1] = (now >>> 32) & 0xff;
        bytes[2] = (now >>> 24) & 0xff;
        bytes[3] = (now >>> 16) & 0xff;
        bytes[4] = (now >>> 8) & 0xff;
        bytes[5] = now & 0xff;
        // Set version 7
        bytes[6] = (bytes[6] & 0x0f) | 0x70;
        // Set variant
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        uuid = [
          bytes.subarray(0, 4).toString('hex'),
          bytes.subarray(4, 6).toString('hex'),
          bytes.subarray(6, 8).toString('hex'),
          bytes.subarray(8, 10).toString('hex'),
          bytes.subarray(10, 16).toString('hex'),
        ].join('-');
      } else {
        // UUID v4 (random)
        uuid = crypto.randomUUID();
      }

      if (format === 'compact') uuid = uuid.replace(/-/g, '');
      if (format === 'uppercase') uuid = uuid.toUpperCase();

      uuids.push(uuid);
    }

    await deductAndLog(user.userId, '/api/uuid', `v${version} x${cnt}`);

    return res.status(200).json({
      uuid: cnt === 1 ? uuids[0] : undefined,
      uuids: cnt > 1 ? uuids : undefined,
      version: parseInt(version),
      count: cnt,
      format,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] uuid error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
