import { setCors, auth, deductAndLog } from './_lib/helpers.js';

const LANGUAGES = {
  en:'English',fr:'French',es:'Spanish',de:'German',it:'Italian',pt:'Portuguese',
  nl:'Dutch',ru:'Russian',zh:'Chinese',ja:'Japanese',ko:'Korean',ar:'Arabic',
  hi:'Hindi',tr:'Turkish',pl:'Polish',sv:'Swedish',da:'Danish',no:'Norwegian',
  fi:'Finnish',el:'Greek',cs:'Czech',ro:'Romanian',hu:'Hungarian',th:'Thai',
  vi:'Vietnamese',id:'Indonesian',ms:'Malay',uk:'Ukrainian',he:'Hebrew',
  bn:'Bengali',ta:'Tamil',sw:'Swahili',tl:'Filipino',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  setCors(res);

  const { text, from = 'auto', to = 'en' } = req.body || {};

  if (!text) return res.status(400).json({ error: 'Missing "text" in body' });
  if (typeof text !== 'string' || text.length > 5000) return res.status(400).json({ error: 'Text must be under 5000 characters' });
  if (to !== 'auto' && !LANGUAGES[to]) return res.status(400).json({ error: `Unknown language: ${to}`, supported: Object.keys(LANGUAGES) });

  const targetLang = LANGUAGES[to] || 'English';
  const fromInstr = from === 'auto' ? 'Auto-detect the source language.' : `Source language is ${LANGUAGES[from] || from}.`;

  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are a professional translator. Translate the following text to ${targetLang}. ${fromInstr} Output ONLY the translated text, nothing else. Preserve formatting, tone, and meaning.` },
          { role: 'user', content: text }
        ],
        max_tokens: Math.min(text.length * 3, 2000),
        temperature: 0.2,
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'AI provider error', details: err.error?.message });
    }

    const aiData = await aiRes.json();
    const translated = aiData.choices?.[0]?.message?.content?.trim();
    if (!translated) return res.status(502).json({ error: 'Empty response from AI' });

    // Detect source language
    let detectedFrom = from;
    if (from === 'auto') {
      const detectRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `What language is this text? Reply with ONLY the ISO 639-1 code (e.g. "en", "fr", "es"): "${text.substring(0, 200)}"` }],
          max_tokens: 5, temperature: 0,
        })
      });
      const detectData = await detectRes.json();
      detectedFrom = detectData.choices?.[0]?.message?.content?.trim().toLowerCase().substring(0, 2) || 'unknown';
    }

    await deductAndLog(user.userId, '/api/translate', `${detectedFrom}→${to}: ${text.substring(0, 30)}`);

    return res.status(200).json({
      translated_text: translated,
      source_language: detectedFrom,
      target_language: to,
      source_text: text,
      characters: text.length,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] translate error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
