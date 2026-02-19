import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  setCors(res);

  const { text, texts } = req.body || {};

  // Support single text or batch (up to 10)
  const items = texts ? texts.slice(0, 10) : text ? [text] : [];
  if (items.length === 0) return res.status(400).json({ error: 'Provide "text" (string) or "texts" (array, max 10)' });
  if (items.some(t => typeof t !== 'string' || t.length > 2000)) {
    return res.status(400).json({ error: 'Each text must be under 2000 characters' });
  }

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const prompt = items.length === 1
      ? `Analyze the sentiment of this text. Respond ONLY with a JSON object with these fields:
- "sentiment": one of "positive", "negative", "neutral", "mixed"
- "confidence": number 0-1
- "emotions": array of detected emotions (e.g. ["joy","surprise"])
- "score": number from -1 (very negative) to 1 (very positive)

Text: "${items[0]}"`
      : `Analyze the sentiment of each text below. Respond ONLY with a JSON array. Each element must have:
- "sentiment": one of "positive", "negative", "neutral", "mixed"
- "confidence": number 0-1
- "emotions": array of detected emotions
- "score": number from -1 to 1

Texts:
${items.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis API. Respond ONLY with valid JSON, no markdown, no explanation.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.1,
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'AI provider error', details: err.error?.message });
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim();
    if (!raw) return res.status(502).json({ error: 'Empty response from AI' });

    // Parse JSON response
    let parsed;
    try {
      const clean = raw.replace(/```json\n?|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return res.status(502).json({ error: 'Failed to parse AI response', raw });
    }

    await deductAndLog(user.userId, '/api/sentiment', items[0].substring(0, 40));

    if (items.length === 1) {
      return res.status(200).json({
        ...parsed,
        text: items[0],
        credits_remaining: user.credits - 1,
        latency_ms: Date.now() - start,
      });
    }

    return res.status(200).json({
      results: Array.isArray(parsed) ? parsed.map((r, i) => ({ ...r, text: items[i] })) : parsed,
      count: items.length,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] sentiment error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
