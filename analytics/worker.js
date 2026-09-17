/**
 * crash-analytics — tiny, privacy-friendly hit counter.
 * No cookies, no fingerprints, no PII: aggregate counters kept in a
 * Durable Object (atomic increments). Country = 2-letter code from
 * Cloudflare's edge (request.cf.country) — derived server-side, never an IP.
 *
 * Endpoints:
 *   GET /hit          → records a visit (returns 1x1 transparent gif)
 *   GET /stats        → JSON { total, today, countries }
 *   GET /stats/daily  → JSON { days: { "YYYY-MM-DD": n } } (last 30 days)
 *   GET /             → public dashboard page (30-day chart + country flags)
 */

const DAYS = 30;

/** "IN" → 🇮🇳 ; non-country codes (T1 = Tor, undefined) → null */
export function flagOf(cc) {
  if (!cc || !/^[A-Z]{2}$/.test(cc)) return null;
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export class Counter {
  constructor(state) {
    this.state = state;
  }

  async increment(country) {
    const day = new Date().toISOString().slice(0, 10);
    const total = ((await this.state.storage.get("total")) ?? 0) + 1;
    const today = ((await this.state.storage.get(`day:${day}`)) ?? 0) + 1;
    const updates = { total, [`day:${day}`]: today };
    if (country && /^[A-Z]{2}$/.test(country)) {
      const key = `country:${country}`;
      updates[key] = ((await this.state.storage.get(key)) ?? 0) + 1;
    }
    await this.state.storage.put(updates);
    return { total, today };
  }

  /** { total, today, days: [{date, count}], countries: [{cc, count}] desc } */
  async read() {
    const day = new Date().toISOString().slice(0, 10);
    const days = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ date, count: (await this.state.storage.get(`day:${date}`)) ?? 0 });
    }
    const entries = await this.state.storage.list({ prefix: "country:" });
    const countries = [...entries]
      .map(([k, count]) => ({ cc: k.slice(8), count }))
      .sort((a, b) => b.count - a.count);
    return {
      total: (await this.state.storage.get("total")) ?? 0,
      today: (await this.state.storage.get(`day:${day}`)) ?? 0,
      days,
      countries,
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/increment") {
      const country = url.searchParams.get("country") ?? "";
      return Response.json(await this.increment(country));
    }
    return Response.json(await this.read());
  }
}

const GIF = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

function dashboard(data) {
  const max = Math.max(1, ...data.days.map((d) => d.count));
  const bars = data.days
    .map((d) => {
      const h = Math.max(2, Math.round((d.count / max) * 150));
      return `<div class="col"><div class="num">${d.count || ""}</div><div class="bar" style="height:${h}px"></div><div class="lbl">${d.date.slice(5)}</div></div>`;
    })
    .join("\n");
  const maxC = Math.max(1, ...data.countries.map((c) => c.count));
  const flags = data.countries
    .slice(0, 12)
    .map((c) => {
      const w = Math.max(8, Math.round((c.count / maxC) * 100));
      return `<span class="cf" title="${c.cc}: ${c.count}">${flagOf(c.cc) ?? "🌐"} <i style="width:${w}px"></i>${c.count}</span>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>crash-analytics — neelrajdev</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#0a0a0c;color:#8b8b93;font:14px/1.5 Consolas,'Courier New',monospace}
  .wrap{width:min(92vw,980px);padding:32px 0}
  h1{font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#8b8b93;margin:0 0 4px}
  .big{font-size:44px;font-weight:bold;color:#ff3b47;margin:8px 0 2px}
  .sub{color:#3ddc84;margin-bottom:28px}
  .chart{display:flex;align-items:flex-end;gap:6px;height:210px;border-bottom:1px solid #1d1d22;padding-bottom:4px}
  .col{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}
  .num{font-size:10px;color:#ffb454;margin-bottom:2px}
  .bar{width:100%;max-width:26px;background:linear-gradient(180deg,#3ddc84,#1d5c3a);border-radius:2px 2px 0 0}
  .lbl{font-size:9px;color:#5a5a62;margin-top:4px}
  h2{font-size:12px;letter-spacing:.2em;text-transform:uppercase;margin:34px 0 12px;color:#8b8b93}
  .countries{display:flex;flex-wrap:wrap;gap:10px 18px}
  .cf{display:inline-flex;align-items:center;gap:6px;font-size:16px;color:#fff}
  .cf i{display:inline-block;height:6px;background:linear-gradient(90deg,#3ddc84,#4d9fff);border-radius:3px}
  footer{margin-top:30px;display:flex;justify-content:space-between;font-size:12px}
  a{color:#3ddc84;text-decoration:none}
</style></head><body>
<div class="wrap">
  <h1>💥 crash-analytics</h1>
  <div class="big">${data.total} crashes</div>
  <div class="sub">${data.today} today · cookieless · aggregate-only · zero tracking</div>
  <div class="chart">${bars}</div>
  <h2>where visitors crash from</h2>
  <div class="countries">${flags || '<span class="cf">🌐 no data yet</span>'}</div>
  <footer>
    <span>visits to <a href="https://neelrajdev.pages.dev">neelrajdev.pages.dev</a>, last 30 days</span>
    <a href="/stats">json api</a>
  </footer>
</div>
</body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.COUNTER.idFromName("global");
    const counter = env.COUNTER.get(id);

    if (url.pathname === "/hit") {
      // edge-derived country code; never an IP, never stored raw
      const country = request.cf?.country ?? "";
      await counter.fetch(
        `https://counter/increment?country=${encodeURIComponent(country)}`,
      );
      return new Response(atob(GIF), {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/stats" || url.pathname === "/stats/daily") {
      const data = await (await counter.fetch("https://counter/read")).json();
      const body =
        url.pathname === "/stats/daily"
          ? { days: Object.fromEntries(data.days.map((d) => [d.date, d.count])) }
          : {
              total: data.total,
              today: data.today,
              countries: Object.fromEntries(
                data.countries.map((c) => [c.cc, c.count]),
              ),
            };
      return new Response(JSON.stringify(body, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }

    if (url.pathname === "/") {
      const data = await (await counter.fetch("https://counter/read")).json();
      return new Response(dashboard(data), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(
      "💥 crash-analytics — GET / (dashboard) · /stats · /stats/daily · /hit",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};
