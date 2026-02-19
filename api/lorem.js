import { setCors, auth, deductAndLog } from './_lib/helpers.js';

const WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randWord() { return WORDS[randInt(0, WORDS.length - 1)]; }

function genSentence(minW = 5, maxW = 15) {
  const len = randInt(minW, maxW);
  const words = Array.from({ length: len }, randWord);
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

function genParagraph(minS = 3, maxS = 7) {
  const len = randInt(minS, maxS);
  return Array.from({ length: len }, () => genSentence()).join(' ');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' });
  setCors(res);

  const {
    type = 'paragraphs', // paragraphs, sentences, words
    count = '3',
    format = 'json', // json, text, html
  } = req.query;

  const cnt = Math.min(Math.max(parseInt(count) || 3, 1), 50);
  const start = Date.now();

  try {
    const user = await auth(req, res);
    if (!user) return;

    let items = [];

    if (type === 'words') {
      items = Array.from({ length: cnt }, randWord);
    } else if (type === 'sentences') {
      items = Array.from({ length: cnt }, () => genSentence());
    } else {
      items = Array.from({ length: cnt }, () => genParagraph());
    }

    await deductAndLog(user.userId, '/api/lorem', `${type}:${cnt}`);

    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(items.join(type === 'words' ? ' ' : '\n\n'));
    }

    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      if (type === 'words') return res.status(200).send(`<p>${items.join(' ')}</p>`);
      if (type === 'sentences') return res.status(200).send(items.map(s => `<p>${s}</p>`).join('\n'));
      return res.status(200).send(items.map(p => `<p>${p}</p>`).join('\n'));
    }

    return res.status(200).json({
      type,
      count: cnt,
      text: items.join(type === 'words' ? ' ' : '\n\n'),
      items,
      word_count: items.join(' ').split(' ').length,
      credits_remaining: user.credits - 1,
      latency_ms: Date.now() - start,
    });
  } catch (e) {
    console.error('[AmineAPI] lorem error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
