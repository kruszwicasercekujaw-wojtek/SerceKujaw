// /api/light.js
// Funkcja serwerowa Vercel — przechowuje stan światła (0/1) w pliku light.txt
// w prywatnym Vercel Blob Storage (tak samo jak wynik.txt w grze).
//
// GET  -> zwraca "1" lub "0" (zwykły tekst) — to będzie czytać ESP32
// POST -> ustawia stan, body: {"state":1}

import { put, get } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      let state = '0';
      try {
        const result = await get('light.txt', { access: 'private', useCache: false });
        if (result && result.stream) {
          const text = (await new Response(result.stream).text()).trim();
          state = text === '1' ? '1' : '0';
        }
      } catch (e) {
        // Plik jeszcze nie istnieje — domyślnie światło wyłączone.
      }
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.status(200).send(state);
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const state = Number(body.state) === 1 ? 1 : 0;

      await put('light.txt', String(state), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'text/plain; charset=utf-8',
      });

      res.status(200).json({ ok: true, state });
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Błąd serwera.' });
  }
}
