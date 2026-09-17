/**
 * crash-analytics — a tiny, privacy-friendly hit counter.
 * No cookies, no fingerprints, no PII: just an aggregate "crashes" counter
 * per day + total, stored in Cloudflare KV. Public stats at /stats.
 *
 * Endpoints:
 *   GET /hit      → records a visit (returns 1x1 transparent gif)
 *   GET /stats    → aggregate JSON { total, today, days: {YYYY-MM-DD: n} }
 *   GET           → tiny human-readable status page
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/hit") {
      const day = new Date().toISOString().slice(0, 10);
      // single atomic KV counter per day; total kept as its own key
      const [dayCount] = await Promise.all([
        env.CRASHES.get(`day:${day}`, "text"),
      ]);
      const nextDay = (parseInt(dayCount ?? "0", 10) || 0) + 1;
      await env.CRASHES.put(`day:${day}`, String(nextDay), { expirationTtl: 60 * 60 * 24 * 400 });
      // increment total (read-modify-write; fine at portfolio scale)
      const total = parseInt((await env.CRASHES.get("total")) ?? "0", 10) + 1;
      await env.CRASHES.put("total", String(total));

      return new Response(
        // 1x1 transparent GIF
        atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"),
        {
          headers: {
            "Content-Type": "image/gif",
            "Cache-Control": "no-store",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    if (url.pathname === "/stats") {
      const [total, today] = await Promise.all([
        env.CRASHES.get("total"),
        env.CRASHES.get(`day:${new Date().toISOString().slice(0, 10)}`),
      ]);
      return new Response(
        JSON.stringify({ total: +(total ?? 0), today: +(today ?? 0) }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return new Response(
      "💥 crash-analytics — cookieless, aggregate-only. GET /hit (beacon) · GET /stats",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};
