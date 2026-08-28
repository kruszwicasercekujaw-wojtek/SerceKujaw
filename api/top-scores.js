// /api/top-scores.js
// Funkcja serwerowa Vercel — czyta wynik.txt z prywatnego Vercel Blob Storage
// i zwraca 5 najlepszych wyników jako JSON.

import { get } from '@vercel/blob';

export default async function handler(req, res) {
  try {
    let text = '';
    try {
      const result = await get('wynik.txt', { access: 'private', useCache: false });
      if (result && result.stream) {
        text = await new Response(result.stream).text();
      }
    } catch (e) {
      // Plik jeszcze nie istnieje — brak wyników, to nie jest błąd.
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
