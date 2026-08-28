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

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wynik.txt"');
    res.status(200).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send('Błąd pobierania pliku wynik.txt.');
  }
}
