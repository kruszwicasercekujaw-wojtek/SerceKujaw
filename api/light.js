// Vercel Serverless Function: /api/light
// GET  -> zwraca "1" lub "0" (tekst) - to będzie czytać ESP32
// POST -> ustawia stan (wymaga hasła), body: {"state":1,"password":"..."}
//
// Wymagane zmienne środowiskowe (Vercel -> Settings -> Environment Variables):
//   KV_REST_API_URL, KV_REST_API_TOKEN  (dodaje je integracja Upstash Redis)
//   LIGHT_PASSWORD                       (Twoje hasło do włączania światła)

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "merrychristmas_light";

async function redis(path) {
  const r = await fetch(`${URL_}/${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  return r.json();
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  try {
    if (req.method === "GET") {
      const data = await redis(`get/${KEY}`);
      const state = data.result === "1" ? "1" : "0";
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(state);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      if (!process.env.LIGHT_PASSWORD || body.password !== process.env.LIGHT_PASSWORD) {
        return res.status(401).json({ error: "Nieprawidłowe hasło" });
      }
      const state = Number(body.state) === 1 ? 1 : 0;
      await redis(`set/${KEY}/${state}`);
      return res.status(200).json({ state });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: "Błąd serwera" });
  }
};
