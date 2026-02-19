import dns from 'dns';
import { promisify } from 'util';
import { setCors, auth, deductAndLog } from './_lib/helpers.js';

const resolveMx = promisify(dns.resolveMx);

// Common disposable email domains
const DISPOSABLE = new Set([
  'mailinator.com','guerrillamail.com','tempmail.com','throwaway.email','yopmail.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','dispostable.com','mailnesia.com',
  'trashmail.com','10minutemail.com','temp-mail.org','fakeinbox.com','maildrop.cc',
  'mohmal.com','getnada.com','emailondeck.com','33mail.com','mailcatch.com',
  'harakirimail.com','jetable.org','mytemp.email','tempail.com','tempr.email',
  'discard.email','discardmail.com','spamgourmet.com','safetymail.info','filzmail.com',
]);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Missing "email" query parameter', example: '/api/email-verify?email=test@gmail.com' });

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    // Syntax check
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    const syntaxValid = emailRegex.test(email) && email.length <= 254;

    const [, domain] = email.split('@');
    let mxFound = false;
    let mxRecords = [];
    let disposable = false;
    let freeProvider = false;

    if (syntaxValid && domain) {
      // MX lookup
      try {
        const records = await resolveMx(domain);
        mxFound = records && records.length > 0;
        mxRecords = (records || []).sort((a, b) => a.priority - b.priority).slice(0, 5).map(r => ({ host: r.exchange, priority: r.priority }));
      } catch { mxFound = false; }

      // Disposable check
      disposable = DISPOSABLE.has(domain.toLowerCase());

      // Free provider check
      const FREE = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com'];
      freeProvider = FREE.includes(domain.toLowerCase());
    }

    // Risk score: 0 (safe) to 100 (risky)
    let risk = 0;
    if (!syntaxValid) risk = 100;
    else if (!mxFound) risk += 50;
    if (disposable) risk += 40;
    if (!freeProvider && !disposable) risk += 5; // unknown domain slightly risky
    risk = Math.min(risk, 100);

    await deductAndLog(user.userId, '/api/email-verify', email.substring(0, 40));

    return res.status(200).json({
      email,
      valid: syntaxValid && mxFound && !disposable,
      syntax_valid: syntaxValid,
      mx_found: mxFound,
      mx_records: mxRecords,
      disposable,
      free_provider: freeProvider,
      domain,
      risk_score: risk,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] email-verify error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
