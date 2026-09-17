// /api/online.js
// Funkcja serwerowa Vercel — liczy graczy aktualnie online.
// Każdy klient wysyła regularnie "heartbeat" ze swoim sessionId (co ~12s).
// Serwer trzyma listę sesji z czasem ostatniego sygnału w pliku
// online.txt w prywatnym Vercel Blob Storage (ten sam mechanizm co
// wynik.txt w save-score.js) i zwraca liczbę sesji aktywnych w ciągu
// ostatnich HEARTBEAT_WINDOW_MS milisekund.

import { put, get } from '@vercel/blob';

const HEARTBEAT_WINDOW_MS = 30000; // sesja liczy się jako "online" 30s od ostatniego sygnału

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    let sessionId = '';
    if (req.method === 'POST') {
      sessionId = typeof (req.body || {}).sessionId === 'string' ? req.body.sessionId : '';
      sessionId = sessionId.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64);
    }

    // --- wczytanie obecnej listy sesji ---
    let existingText = '';
    try {
      const result = await get('online.txt', { access: 'private', useCache: false });
      if (result && result.stream) {
        existingText = await new Response(result.stream).text();
      }
    } catch (e) {
      // Plik jeszcze nie istnieje przy pierwszym zapisie — to nie jest błąd.
    }

    // --- odfiltrowanie sesji, które wygasły (brak heartbeatu w oknie czasowym) ---
    const now = Date.now();
    const sessions = new Map();
    existingText.split('\n').forEach(line => {
      const [id, ts] = line.split(';');
      if (!id || !ts) return;
      const t = parseInt(ts, 10);
      if (Number.isFinite(t) && now - t < HEARTBEAT_WINDOW_MS) {
        sessions.set(id, t);
      }
    });

    // --- doliczenie/odświeżenie bieżącej sesji przy heartbeacie ---
    if (sessionId) {
      sessions.set(sessionId, now);
    }

    const count = sessions.size;

    // --- zapis nowej listy tylko przy heartbeacie (POST) ---
    if (req.method === 'POST') {
      const newText = Array.from(sessions.entries())
        .map(([id, t]) => `${id};${t}`)
        .join('\n') + '\n';
      await put('online.txt', newText, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'text/plain; charset=utf-8',
      });
    }

    res.status(200).json({ ok: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Błąd licznika online.' });
  }
}
