import { list } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    const { blobs } = await list({ prefix: 'wynik.txt' });
    const existing = blobs.find(b => b.pathname === 'wynik.txt');

    let text = '';
    if (existing) {
      const r = await fetch(existing.url, { cache: 'no-store' });
      text = await r.text();
    }

    const scores = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split(';');
        return { name: parts[0] || 'Łowca', score: parseInt(parts[1], 10) || 0 };
      });

    scores.sort((a, b) => b.score - a.score);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, top: scores.slice(0, 5) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Błąd odczytu z serwera.' });
  }
}
