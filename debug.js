// api/debug.js — Vercel Edge Function for diagnostics
export const config = { runtime: "edge" };

export default async function handler(req) {
  const key = process.env.CFBD_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "No CFBD_API_KEY set in Vercel environment variables" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team") || "Alabama";
  const year = searchParams.get("year") || "2025";
  const results = {};

  // Test roster
  try {
    const r = await fetch(
      `https://api.collegefootballdata.com/roster?team=${encodeURIComponent(team)}&year=${year}`,
      { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } }
    );
    const data = await r.json();
    results.roster = {
      status: r.status,
      count: Array.isArray(data) ? data.length : "not an array",
      sample: Array.isArray(data) ? data.slice(0, 2) : data
    };
  } catch(e) { results.roster = { error: e.message }; }

  // Test FBS team names
  try {
    const r = await fetch(
      `https://api.collegefootballdata.com/teams/fbs?year=${year}`,
      { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } }
    );
    const data = await r.json();
    results.fbs_team_names = Array.isArray(data) ? data.map(t => t.school).sort() : data;
  } catch(e) { results.fbs_team_names = { error: e.message }; }

  return new Response(JSON.stringify({ key_prefix: key.slice(0,6)+"...", team, year, results }, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
