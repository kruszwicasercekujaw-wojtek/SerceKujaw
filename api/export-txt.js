// /api/export-txt.js
// Zwraca surową zawartość wynik.txt jako plik do pobrania (store prywatny).

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
      // Plik jeszcze nie istnieje — zwrócimy pusty plik.
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="wynik.txt"');
    res.status(200).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).send('Błąd pobierania pliku wynik.txt.');
  }
}
