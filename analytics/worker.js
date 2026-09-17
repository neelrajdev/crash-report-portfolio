/**
 * crash-analytics — tiny, privacy-friendly hit counter.
 * No cookies, no fingerprints, no PII: an aggregate "crashes" counter kept
 * in a Durable Object (atomic increments — no lost updates under bursts).
 *
 * Endpoints:
 *   GET /hit      → records a visit (returns 1x1 transparent gif)
 *   GET /stats    → aggregate JSON { total, today }
 *   GET           → tiny human-readable status page
 */

/** Single global counter instance; SQLite-backed storage. */
export class Counter {
  constructor(state) {
    this.state = state;
  }

  async increment() {
    const day = new Date().toISOString().slice(0, 10);
    const total = ((await this.state.storage.get("total")) ?? 0) + 1;
    const today = ((await this.state.storage.get(`day:${day}`)) ?? 0) + 1;
    await this.state.storage.put({ total, [`day:${day}`]: today });
    return { total, today };
  }

  async read() {
    const day = new Date().toISOString().slice(0, 10);
    return {
      total: (await this.state.storage.get("total")) ?? 0,
      today: (await this.state.storage.get(`day:${day}`)) ?? 0,
    };
  }

  async fetch(request) {
    const url = new URL(request.url);
    const body =
      url.pathname === "/increment"
        ? await this.increment()
        : await this.read();
    return new Response(JSON.stringify(body), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

const GIF = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const id = env.COUNTER.idFromName("global");
    const counter = env.COUNTER.get(id);

    if (url.pathname === "/hit") {
      // record the visit (await ensures the count lands before we respond)
      await counter.fetch("https://counter/increment");
      return new Response(atob(GIF), {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/stats") {
      const res = await counter.fetch("https://counter/read");
      return new Response(await res.text(), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(
      "💥 crash-analytics — cookieless, aggregate-only. GET /hit (beacon) · GET /stats",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};
