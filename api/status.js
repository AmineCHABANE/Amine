export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  return res.status(200).json({
    status: 'operational',
    name: 'AmineAPI',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: { method: 'POST', path: '/api/chat', status: 'live', cost: '1 credit' },
      generate: { method: 'POST', path: '/api/generate', status: 'live', cost: '1 credit' },
      email_verify: { method: 'GET', path: '/api/email-verify', status: 'coming_soon' },
      currency: { method: 'GET', path: '/api/currency', status: 'coming_soon' },
      qrcode: { method: 'GET', path: '/api/qrcode', status: 'coming_soon' },
      ip_geo: { method: 'GET', path: '/api/ip-geo', status: 'coming_soon' },
      shorten: { method: 'POST', path: '/api/shorten', status: 'coming_soon' },
    },
    docs: 'https://amineapi.dev/docs',
    auth: 'API key via x-api-key header',
    free_tier: '1000 requests/month',
    rate_limit: '1 request per 2 seconds'
  });
}
