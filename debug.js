export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const key = process.env.CFBD_API_KEY;
  if (!key) return res.status(500).json({ error: "No CFBD_API_KEY set" });

  const team = req.query.team || "Alabama";
  const year = req.query.year || "2025";

  const get = async (path) => {
    try {
      const r = await fetch(`https://api.collegefootballdata.com${path}`, {
        headers: { Authorization: `Bearer ${key}`, Accept: "application/json" }
      });
      const data = await r.json();
      return { status: r.status, count: Array.isArray(data) ? data.length : "not array", sample: Array.isArray(data) ? data.slice(0,2) : data };
    } catch(e) { return { error: e.message }; }
  };

  const roster  = await get(`/roster?team=${encodeURIComponent(team)}&year=${year}`);
  const teams   = await get(`/teams/fbs?year=${year}`);

  return res.status(200).json({
    key_prefix: key.slice(0,6) + "...",
    team, year, roster,
    fbs_team_names: teams.sample ? "see sample" : teams,
    teams_count: teams.count
  });
}
