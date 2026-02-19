import crypto from 'crypto';
import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const {
    length = '16',
    count = '1',
    uppercase = 'true',
    lowercase = 'true',
    numbers = 'true',
    symbols = 'false',
    exclude = '',
  } = req.query;

  const len = Math.min(Math.max(parseInt(length) || 16, 4), 128);
  const cnt = Math.min(Math.max(parseInt(count) || 1, 1), 50);

  let chars = '';
  if (uppercase !== 'false') chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase !== 'false') chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers !== 'false') chars += '0123456789';
  if (symbols === 'true') chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (exclude) chars = chars.split('').filter(c => !exclude.includes(c)).join('');
  if (!chars) return res.status(400).json({ error: 'No character set selected' });

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const passwords = [];
    for (let i = 0; i < cnt; i++) {
      const bytes = crypto.randomBytes(len);
      let pw = '';
      for (let j = 0; j < len; j++) pw += chars[bytes[j] % chars.length];
      passwords.push(pw);
    }

    // Strength analysis
    const entropy = Math.floor(len * Math.log2(chars.length));
    let strength = 'weak';
    if (entropy >= 80) strength = 'very_strong';
    else if (entropy >= 60) strength = 'strong';
    else if (entropy >= 40) strength = 'medium';

    await deductAndLog(user.userId, '/api/password', `len:${len} cnt:${cnt}`);

    return res.status(200).json({
      passwords: cnt === 1 ? undefined : passwords,
      password: cnt === 1 ? passwords[0] : undefined,
      length: len,
      count: cnt,
      entropy_bits: entropy,
      strength,
      charset_size: chars.length,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] password error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
