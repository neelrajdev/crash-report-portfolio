import { useEffect, useState } from "react";

const ANALYTICS = "https://crash-analytics.neelrajdev.workers.dev";

export function CrashCounter() {
  const [stats, setStats] = useState<{ total: number; today: number } | null>(
    null,
  );

  useEffect(() => {
    // fire-and-forget beacon (classic image ping, no cookies)
    const img = new Image();
    img.src = `${ANALYTICS}/hit?ref=${encodeURIComponent(location.pathname)}`;
    // then read aggregate stats (slight delay so our own hit registers)
    const t = setTimeout(() => {
      fetch(`${ANALYTICS}/stats`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setStats)
        .catch(() => setStats(null));
    }, 800);
    return () => clearTimeout(t);
  }, []);

  if (!stats) return null;
  return (
    <span
      className="text-crash-dim"
      title="aggregate, cookieless visits — counted by my own Cloudflare Worker"
    >
      💥 {stats.total} crashes recorded
      {stats.today > 0 && (
        <span className="text-crash-dim/70"> ({stats.today} today)</span>
      )}
    </span>
  );
}
