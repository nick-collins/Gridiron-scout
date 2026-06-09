// api/cfbd.js — Vercel serverless proxy for CFBD API
export default async function handler(req, res) {
  // Explicit CORS headers Safari requires
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const key = process.env.CFBD_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "CFBD_API_KEY not set in Vercel environment variables" });
  }

  const { path, ...params } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing ?path= parameter" });
  }

  const base = "https://api.collegefootballdata.com";
  let url;
  try {
    url = new URL(base + path);
  } catch(e) {
    return res.status(400).json({ error: "Invalid path: " + path });
  }

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });

    const body = await upstream.json();

    // Always return JSON explicitly — Safari is strict about content-type
    return res.status(upstream.status).json(body);

  } catch (err) {
    return res.status(502).json({ error: "Upstream failed", detail: err.message });
  }
}
