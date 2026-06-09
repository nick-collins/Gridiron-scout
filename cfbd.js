export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = process.env.CFBD_API_KEY;
  if (!key) return res.status(500).json({ error: "CFBD_API_KEY not set" });

  const { path, ...params } = req.query;
  if (!path) return res.status(400).json({ error: "Missing path" });

  const url = new URL("https://api.collegefootballdata.com" + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const r = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
