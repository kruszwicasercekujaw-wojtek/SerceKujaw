// /api/save-score.js
// Funkcja serwerowa Vercel — dopisuje wynik gracza do pliku wynik.txt
// przechowywanego w prywatnym Vercel Blob Storage.

import { put, get } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    let { name, score } = req.body || {};

    // --- walidacja ---
    name = typeof name === 'string' ? name : '';
    name = name.replace(/[\r\n;]+/g, ' ').trim().slice(0, 16);
    if (!name) name = 'Łowca';

    score = parseInt(score, 10);
    if (!Number.isFinite(score) || score < 0 || score > 1000000) {
      res.status(400).json({ ok: false, error: 'Nieprawidłowy wynik.' });
      return;
    }

    // --- wczytanie obecnej zawartości wynik.txt (jeśli istnieje) ---
    let existingText = '';
    try {
      const result = await get('wynik.txt', { access: 'private', useCache: false });
      if (result && result.stream) {
        existingText = await new Response(result.stream).text();
      }
    } catch (e) {
      // Plik jeszcze nie istnieje przy pierwszym zapisie — to nie jest błąd.
    }

    const line = `${name};${score};${Date.now()}\n`;
    const newText = existingText + line;

    // --- nadpisanie tego samego pliku (bez losowego sufiksu w nazwie) ---
    await put('wynik.txt', newText, {
      access: 'private',
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
