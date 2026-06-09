// api/cfbd.js — Vercel serverless function
// Proxies all requests to CFBD so the API key never reaches the browser.
// Your key lives only in Vercel environment variables as CFBD_API_KEY.

export default async function handler(req, res) {
  // Allow browser requests from any origin (needed for the frontend fetch)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const key = process.env.CFBD_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "CFBD_API_KEY environment variable not set." });
  }

  // ?path=/roster&team=Alabama&year=2025
  const { path, ...params } = req.query;
  if (!path) {
    return res.status(400).json({ error: "Missing ?path= parameter." });
  }

  const base = "https://api.collegefootballdata.com";
  const url = new URL(base + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  });

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}` },
    });

    const contentType = upstream.headers.get("content-type") || "";
    const body = await upstream.text();

    res.status(upstream.status);
    if (contentType.includes("json")) {
      res.setHeader("Content-Type", "application/json");
    }
    return res.send(body);
  } catch (err) {
    return res.status(502).json({ error: "Upstream fetch failed", detail: err.message });
  }
}
