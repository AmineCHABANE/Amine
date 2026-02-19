import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const {
    w = '400', h = '300',
    bg = '1a1a2e', color = '888888',
    text: customText,
    font = '16',
  } = req.query;

  const width = Math.min(Math.max(parseInt(w) || 400, 10), 4000);
  const height = Math.min(Math.max(parseInt(h) || 300, 10), 4000);
  const fontSize = Math.min(Math.max(parseInt(font) || 16, 8), 120);
  const label = customText || `${width} × ${height}`;

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#${bg.replace('#', '')}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" fill="#${color.replace('#', '')}">
    ${label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
  </text>
</svg>`;

    await deductAndLog(user.userId, '/api/placeholder', `${width}x${height}`);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    return res.status(200).send(svg);
  } catch (e) {
    console.error('[AmineAPI] placeholder error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
