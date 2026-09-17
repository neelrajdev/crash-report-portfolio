import { useEffect, useState } from "react";

const ANALYTICS = "https://crash-analytics.neelrajdev.workers.dev";

interface Stats {
  total: number;
  today: number;
  countries: Record<string, number>;
}

/** "IN" → 🇮🇳 */
function flagOf(cc: string): string {
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export function CrashCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    // fire-and-forget beacon (classic image ping, no cookies)
    const img = new Image();
    img.src = `${ANALYTICS}/hit?ref=${encodeURIComponent(location.pathname)}`;
    const t = setTimeout(() => {
      fetch(`${ANALYTICS}/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setStats)
        .catch(() => setStats(null));
    }, 800);
    return () => clearTimeout(t);
  }, []);

  if (!stats) return null;
  const top = Object.entries(stats.countries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <a
      href="https://crash-analytics.neelrajdev.workers.dev/"
      target="_blank"
      rel="noreferrer"
      title="aggregate, cookieless visits — counted by my own Cloudflare Worker · click for the live dashboard"
      className="text-crash-dim transition-colors hover:text-crash-green"
    >
      💥 {stats.total} crashes recorded
      {stats.today > 0 && (
        <span className="text-crash-dim/70"> ({stats.today} today)</span>
      )}
      {top.length > 0 && (
        <span className="ml-2 tracking-wide">
          {top.map(([cc, n]) => (
            <span key={cc} className="mr-1" title={`${cc}: ${n} crashes`}>
              {flagOf(cc)}
              <span className="ml-0.5 text-[11px] text-crash-dim/70">{n}</span>
            </span>
          ))}
        </span>
      )}
    </a>
  );
}
