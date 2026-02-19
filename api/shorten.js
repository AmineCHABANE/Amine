import crypto from 'crypto';
import { setCors, auth, deductAndLog, supabase } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  setCors(res);

  // GET = redirect short URL
  if (req.method === 'GET') {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing "code" parameter' });

    const { data } = await supabase
      .from('short_urls').select('original_url, id').eq('code', code).single();
    if (!data) return res.status(404).json({ error: 'Short URL not found' });

    // Increment clicks
    await supabase.rpc('increment_clicks', { url_id_input: data.id });
    return res.redirect(302, data.original_url);
  }

  // POST = create short URL
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST to create, GET to redirect' });

  const { url, custom_code } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing "url" in body' });

  // Validate URL
  try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL format' }); }
  if (url.length > 2000) return res.status(400).json({ error: 'URL must be under 2000 characters' });

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    // Generate or validate custom code
    let code = custom_code;
    if (code) {
      if (!/^[a-zA-Z0-9_-]{3,20}$/.test(code)) return res.status(400).json({ error: 'Custom code: 3-20 alphanumeric chars' });
      const { data: exists } = await supabase.from('short_urls').select('id').eq('code', code).single();
      if (exists) return res.status(409).json({ error: 'Custom code already taken' });
    } else {
      code = crypto.randomBytes(4).toString('base64url').substring(0, 6);
    }

    const { data, error } = await supabase.from('short_urls').insert([{
      user_id: user.userId,
      code,
      original_url: url,
      clicks: 0,
    }]).select().single();

    if (error) throw error;

    await deductAndLog(user.userId, '/api/shorten', `${code}→${url.substring(0, 40)}`);

    return res.status(200).json({
      short_url: `https://api-amine.vercel.app/api/shorten?code=${code}`,
      code,
      original_url: url,
      clicks: 0,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] shorten error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
