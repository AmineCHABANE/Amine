<p align="center">
  <img src="https://img.shields.io/badge/⚡-AmineAPI-10b981?style=for-the-badge&labelColor=0d0f12" alt="AmineAPI" />
</p>

<h1 align="center">AmineAPI</h1>

<p align="center">
  <strong>One API key. 15 tools. Zero hassle.</strong><br/>
  Free multi-purpose REST API for developers — AI, utilities, data & more.
</p>

<p align="center">
  <a href="https://api-amine.vercel.app"><img src="https://img.shields.io/badge/Live-api--amine.vercel.app-22c55e?style=flat-square" alt="Live" /></a>
  <img src="https://img.shields.io/badge/APIs-15%20live-6366f1?style=flat-square" alt="15 APIs" />
  <img src="https://img.shields.io/badge/Free-1000%20req%2Fmo-eab308?style=flat-square" alt="Free" />
  <img src="https://img.shields.io/badge/npm-amineapi-cc3534?style=flat-square" alt="npm" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT" />
</p>

---

## Why AmineAPI?

Stop juggling 10 different API keys. AmineAPI bundles **15 APIs** under one key, one dashboard, one bill.

## Quick Start

```bash
npm install amineapi
```

```javascript
const AmineAPI = require('amineapi');
const client = AmineAPI('amineapi_live_YOUR_KEY');

const answer = await client.chat('Explain quantum computing');
console.log(answer.result);
```

Get your free key → [api-amine.vercel.app](https://api-amine.vercel.app)

---

## All 15 APIs

### 🤖 AI APIs
| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| 🧠 AI Chat | POST | `/api/chat` | GPT-4o-mini text generation with smart caching |
| 📝 AI Summarize | POST | `/api/summarize` | Summarize text or URLs (short/medium/long) |
| 🌐 AI Translate | POST | `/api/translate` | Translate between 30+ languages |
| 😊 Sentiment | POST | `/api/sentiment` | Detect emotions & sentiment, batch support |

### 📊 Data APIs
| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| 📧 Email Verify | GET | `/api/email-verify` | MX check, disposable detection, risk score |
| 💱 Currency | GET | `/api/currency` | 170+ real-time exchange rates |
| 🌤️ Weather | GET | `/api/weather` | Current + 7-day forecast, any city |
| 🌍 IP Geolocation | GET | `/api/ip-geo` | IP → location, VPN/proxy detection |

### 🛠️ Utility APIs
| API | Method | Endpoint | Description |
|-----|--------|----------|-------------|
| 📱 QR Code | GET | `/api/qrcode` | PNG/SVG QR codes, custom colors |
| 🔗 URL Shortener | POST | `/api/shorten` | Short URLs with click tracking |
| 🔐 Password | GET | `/api/password` | Crypto-safe generator + strength analysis |
| #️⃣ Hash | POST | `/api/hash` | MD5, SHA1, SHA256, SHA512 |
| 🆔 UUID | GET | `/api/uuid` | UUID v4 & v7, batch generation |
| 📄 Lorem Ipsum | GET | `/api/lorem` | Placeholder text (paragraphs/sentences/words) |
| 🖼️ Placeholder | GET | `/api/placeholder` | SVG placeholder images, any size |

---

## Code Examples

### JavaScript / Node.js
```javascript
const AmineAPI = require('amineapi');
const client = AmineAPI('amineapi_live_YOUR_KEY');

// AI Chat
const chat = await client.chat('Write a haiku about coding');

// Translate
const fr = await client.translate('Hello world', 'fr');

// Weather
const weather = await client.weather('Paris');

// Email check
const email = await client.emailVerify('user@gmail.com');
```

### Python
```python
import requests

API = 'https://api-amine.vercel.app/api'
KEY = {'x-api-key': 'amineapi_live_YOUR_KEY'}

# AI Chat
r = requests.post(f'{API}/chat', headers=KEY, json={'prompt': 'Hello'})
print(r.json()['result'])

# Weather
r = requests.get(f'{API}/weather?city=Tokyo', headers=KEY)
print(r.json()['current']['temperature'])
```

### cURL
```bash
# AI Chat
curl -X POST https://api-amine.vercel.app/api/chat \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain quantum computing"}'

# QR Code
curl "https://api-amine.vercel.app/api/qrcode?data=https://example.com" \
  -H "x-api-key: YOUR_KEY" -o qr.png

# Weather
curl "https://api-amine.vercel.app/api/weather?city=London" \
  -H "x-api-key: YOUR_KEY"
```

---

## Pricing

| Plan | Price | Requests/mo | Rate Limit |
|------|-------|-------------|------------|
| Free | $0 | 1,000 | 10/min |
| Pro | $19 | 50,000 | 100/min |
| Enterprise | $99 | Unlimited | None |

**Credit packs:** 5K = $5 · 25K = $15

**Free bonus:** Watch a 30s ad → earn 3 credits (up to 15/day)

---

## Authentication

```
x-api-key: amineapi_live_YOUR_KEY
```

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad request |
| 401 | Missing API key |
| 402 | No credits |
| 403 | Invalid API key |
| 429 | Rate limited |
| 502 | Provider error |

---

## Tech Stack

React · Vercel Serverless · Supabase · OpenAI · Stripe

## Links

| | |
|---|---|
| 🌐 Dashboard | [api-amine.vercel.app](https://api-amine.vercel.app) |
| 📦 npm | [npmjs.com/package/amineapi](https://www.npmjs.com/package/amineapi) |
| 📚 Docs | [api-amine.vercel.app/#docs](https://api-amine.vercel.app/#docs) |

## License

MIT

<p align="center">Built with ⚡ by <a href="https://github.com/AmineCHABANE">Amine Chabane</a></p>
