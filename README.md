<p align="center">
  <img src="https://img.shields.io/badge/⚡-AmineAPI-10b981?style=for-the-badge&labelColor=0d0f12" alt="AmineAPI" />
</p>

<h1 align="center">AmineAPI</h1>

<p align="center">
  <strong>One API key. Every tool you need.</strong><br/>
  Free multi-purpose REST API — AI Chat, Email Verification, Currency Exchange, QR Codes, IP Geolocation & URL Shortener.
</p>

<p align="center">
  <a href="https://api-amine.vercel.app"><img src="https://img.shields.io/badge/Live-api--amine.vercel.app-34d399?style=flat-square" alt="Live" /></a>
  <img src="https://img.shields.io/badge/Free-1000%20req%2Fmo-818cf8?style=flat-square" alt="Free tier" />
  <img src="https://img.shields.io/badge/Latency-<120ms-fbbf24?style=flat-square" alt="Latency" />
  <img src="https://img.shields.io/badge/Uptime-99.9%25-34d399?style=flat-square" alt="Uptime" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT" />
</p>

---

## Why AmineAPI?

Most API services make you sign up for 6 different providers. AmineAPI gives you everything under **one key, one dashboard, one bill**.

| Feature | AmineAPI | Others |
|---------|----------|--------|
| AI Chat (GPT-4o-mini) | ✅ Included | $20/mo separate |
| Email Verification | ✅ Included | $10/mo separate |
| Currency Exchange | ✅ Included | $5/mo separate |
| QR Code Generation | ✅ Included | $5/mo separate |
| IP Geolocation | ✅ Included | $10/mo separate |
| URL Shortener | ✅ Included | $5/mo separate |
| **Total** | **Free (1K/mo)** | **$55+/mo** |

---

## Quick Start

**1. Get a free key** at [api-amine.vercel.app](https://api-amine.vercel.app) — takes 10 seconds with Google.

**2. Call the API:**

```bash
curl -X POST https://api-amine.vercel.app/api/chat \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing in one sentence"}'
```

**3. Get your response:**

```json
{
  "result": "Quantum computing uses qubits that exist in multiple states simultaneously, enabling exponentially faster parallel processing.",
  "cached": false,
  "credits_remaining": 999
}
```

---

## Code Examples

### JavaScript / Node.js

```javascript
const response = await fetch('https://api-amine.vercel.app/api/chat', {
  method: 'POST',
  headers: {
    'x-api-key': 'amineapi_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ prompt: 'Write a haiku about coding' })
});

const data = await response.json();
console.log(data.result);
// "Fingers on the keys / Logic flows like morning rain / Bugs become features"
```

### Python

```python
import requests

response = requests.post(
    'https://api-amine.vercel.app/api/chat',
    headers={'x-api-key': 'amineapi_live_YOUR_KEY'},
    json={'prompt': 'Write a haiku about coding'}
)

print(response.json()['result'])
```

### PHP

```php
$ch = curl_init('https://api-amine.vercel.app/api/chat');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'x-api-key: amineapi_live_YOUR_KEY',
        'Content-Type: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode(['prompt' => 'Hello world']),
    CURLOPT_RETURNTRANSFER => true
]);
$result = json_decode(curl_exec($ch), true);
echo $result['result'];
```

---

## Available APIs

| API | Method | Endpoint | Status | Cost |
|-----|--------|----------|--------|------|
| 🧠 AI Chat | POST | `/api/chat` | ✅ Live | 1 credit |
| 📧 Email Verify | GET | `/api/email-verify` | 🔜 Soon | 1 credit |
| 💱 Currency | GET | `/api/currency` | 🔜 Soon | 1 credit |
| 📱 QR Code | GET | `/api/qrcode` | 🔜 Soon | 1 credit |
| 🌍 IP Geolocation | GET | `/api/ip-geo` | 🔜 Soon | 1 credit |
| 🔗 URL Shortener | POST | `/api/shorten` | 🔜 Soon | 1 credit |

---

## Pricing

| Plan | Price | Requests/mo | Rate Limit | Support |
|------|-------|-------------|------------|---------|
| Free | $0 | 1,000 | 10/min | Community |
| Pro | $19 | 50,000 | 100/min | Email |
| Enterprise | $99 | Unlimited | None | Slack + SLA |

**Credit packs:** 5K credits = $5 · 25K credits = $15

---

## Authentication

Pass your API key in the `x-api-key` header:

```
x-api-key: amineapi_live_abc123def456...
```

Get your free key → [api-amine.vercel.app](https://api-amine.vercel.app)

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request — Missing parameters |
| 401 | Unauthorized — Bad API key |
| 402 | Payment Required — No credits |
| 429 | Rate Limited — Slow down |
| 500 | Server Error |

---

## Use Cases

- **Chatbots & AI apps** — Add GPT-powered chat to any project
- **SaaS platforms** — Validate emails on signup
- **E-commerce** — Real-time currency conversion at checkout
- **Marketing** — Generate QR codes for campaigns
- **Security tools** — Geolocate IPs, detect VPNs
- **Link management** — Shorten and track URLs

---

## Tech Stack

Built with modern, reliable infrastructure:

- **Frontend:** React + Vercel
- **Backend:** Vercel Serverless Functions (Node.js)
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **AI Model:** OpenAI GPT-4o-mini
- **Payments:** Stripe (subscriptions + one-time)
- **Auth:** Google OAuth + Magic Links

---

## Self-Hosting

Want to run your own instance? Fork this repo and:

1. Create a [Supabase](https://supabase.com) project
2. Create a [Vercel](https://vercel.com) project
3. Add environment variables (see `.env.example`)
4. Deploy!

---

## Contributing

Issues and PRs welcome! If you want a new API endpoint, open a feature request.

---

## Links

| | |
|---|---|
| 🌐 Dashboard | [api-amine.vercel.app](https://api-amine.vercel.app) |
| 📚 API Docs | [api-amine.vercel.app/#docs](https://api-amine.vercel.app/#docs) |
| 🐛 Issues | [GitHub Issues](https://github.com/AmineCHABANE/Amine/issues) |
| 💬 Contact | [GitHub](https://github.com/AmineCHABANE) |

---

## License

MIT — use freely in personal and commercial projects.

<p align="center">Built with ⚡ by <a href="https://github.com/AmineCHABANE">Amine Chabane</a></p>
