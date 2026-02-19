import { setCors, auth, deductAndLog } from './_lib/helpers.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  setCors(res);

  const { text, url, length = 'medium', language = 'en', format = 'paragraph' } = req.body || {};

  if (!text && !url) return res.status(400).json({ error: 'Provide "text" or "url" to summarize' });

  let content = text;

  // Fetch URL content if provided
  if (url && !text) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'AmineAPI/1.0' } });
      if (!r.ok) return res.status(400).json({ error: `Could not fetch URL: ${r.status}` });
      const html = await r.text();
      // Basic HTML to text
      content = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to fetch URL content' });
    }
  }

  if (!content || content.length < 50) return res.status(400).json({ error: 'Text too short to summarize (min 50 chars)' });
  if (content.length > 10000) content = content.substring(0, 10000);

  const lenMap = { short: '2-3 sentences', medium: '1 paragraph (4-6 sentences)', long: '2-3 paragraphs' };
  const lenInstr = lenMap[length] || lenMap.medium;
  const fmtInstr = format === 'bullets' ? 'Use bullet points.' : 'Write as flowing prose.';
  const langInstr = language !== 'en' ? `Write the summary in ${language}.` : '';

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
          { role: 'system', content: `You are a summarization expert. Summarize the following text in ${lenInstr}. ${fmtInstr} ${langInstr} Be concise and capture the key points.` },
          { role: 'user', content: content }
        ],
        max_tokens: 500,
        temperature: 0.3,
      })
    });

    if (!aiRes.ok) {
      const err = await aiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'AI provider error', details: err.error?.message });
    }

    const aiData = await aiRes.json();
    const summary = aiData.choices?.[0]?.message?.content;
    if (!summary) return res.status(502).json({ error: 'Empty response from AI' });

    await deductAndLog(user.userId, '/api/summarize', (url || text).substring(0, 60));

    return res.status(200).json({
      summary,
      source: url || 'text_input',
      original_length: content.length,
      summary_length: summary.length,
      compression_ratio: Math.round((1 - summary.length / content.length) * 100) + '%',
      length_setting: length,
      language,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] summarize error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
