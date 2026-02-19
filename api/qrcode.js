import QRCode from 'qrcode';
import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const { data, size = '300', format = 'png', dark = '000000', light = 'ffffff' } = req.query;

  if (!data) return res.status(400).json({ error: 'Missing "data" query parameter', example: '/api/qrcode?data=https://example.com' });
  if (data.length > 2000) return res.status(400).json({ error: 'Data must be under 2000 characters' });

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const sizeNum = Math.min(Math.max(parseInt(size) || 300, 50), 1000);

    if (format === 'svg') {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        width: sizeNum,
        color: { dark: `#${dark}`, light: `#${light}` },
        margin: 2,
      });
      await deductAndLog(user.userId, '/api/qrcode', `QR:${data.substring(0, 40)}`);
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(svg);
    }

    // PNG (default)
    const buffer = await QRCode.toBuffer(data, {
      width: sizeNum,
      color: { dark: `#${dark}`, light: `#${light}` },
      margin: 2,
      type: 'png',
    });

    await deductAndLog(user.userId, '/api/qrcode', `QR:${data.substring(0, 40)}`);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);
  } catch (e) {
    console.error('[AmineAPI] qrcode error:', e);
    return res.status(500).json({ error: 'QR generation failed' });
  }
}
