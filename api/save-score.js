import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    let { name, score } = req.body || {};

    name = typeof name === 'string' ? name : '';
    name = name.replace(/[\r\n;]+/g, ' ').trim().slice(0, 16);
    if (!name) name = 'Łowca';

    score = parseInt(score, 10);
    if (!Number.isFinite(score) || score < 0 || score > 1000000) {
      res.status(400).json({ ok: false, error: 'Nieprawidłowy wynik.' });
      return;
    }

    let existingText = '';
    const { blobs } = await list({ prefix: 'wynik.txt' });
    const existing = blobs.find(b => b.pathname === 'wynik.txt');
    if (existing) {
      const r = await fetch(existing.url, { cache: 'no-store' });
      existingText = await r.text();
    }

    const line = `${name};${score};${Date.now()}\n`;
    const newText = existingText + line;

    await put('wynik.txt', newText, {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'text/plain; charset=utf-8',
    });

    res.status(200).json({ ok: true, name, score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Błąd zapisu na serwerze.' });
  }
}
