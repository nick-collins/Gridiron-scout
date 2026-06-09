// api/debug.js — visit /api/debug?team=Alabama to see raw CFBD response
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const key = process.env.CFBD_API_KEY;
  if (!key) return res.status(500).json({ error: "No CFBD_API_KEY set in environment variables" });

  const team = req.query.team || "Alabama";
  const year = req.query.year || 2025;

  const results = {};

  // Test roster
  try {
    const r = await fetch(`https://api.collegefootballdata.com/roster?team=${encodeURIComponent(team)}&year=${year}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await r.json();
    results.roster = {
      status: r.status,
      count: Array.isArray(data) ? data.length : "not an array",
      sample: Array.isArray(data) ? data.slice(0, 2) : data
    };
  } catch(e) { results.roster = { error: e.message }; }

  // Test team names — pull official FBS list so we can compare
  try {
    const r = await fetch(`https://api.collegefootballdata.com/teams/fbs?year=${year}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await r.json();
    results.fbs_teams = {
      status: r.status,
      count: Array.isArray(data) ? data.length : "not an array",
      names: Array.isArray(data) ? data.map(t => t.school).sort() : data
    };
  } catch(e) { results.fbs_teams = { error: e.message }; }

  // Test SP+ ratings
  try {
    const r = await fetch(`https://api.collegefootballdata.com/ratings/sp?year=${year}`, {
      headers: { Authorization: `Bearer ${key}` }
    });
    const data = await r.json();
    results.sp_ratings = {
      status: r.status,
      count: Array.isArray(data) ? data.length : "not an array",
      sample: Array.isArray(data) ? data.slice(0, 2) : data
    };
  } catch(e) { results.sp_ratings = { error: e.message }; }

  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    tested_team: team,
    year,
    key_set: true,
    key_prefix: key.slice(0, 8) + "...",
    results
  });
}
