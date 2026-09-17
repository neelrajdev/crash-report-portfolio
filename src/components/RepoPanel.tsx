import { useEffect, useState } from "react";

interface LiveRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  updatedAt: string;
  homepage: string | null;
  pinned?: boolean;
  ci?: "passing" | "failing" | "running" | null;
  activity?: number[];
}

function CiBadge({ status }: { status: NonNullable<LiveRepo["ci"]> }) {
  const map = {
    passing: { dot: "bg-crash-green", label: "ci: passing" },
    failing: { dot: "bg-crash-red", label: "ci: failing" },
    running: { dot: "bg-crash-amber animate-pulse", label: "ci: running" },
  } as const;
  const { dot, label } = map[status];
  return (
    <span className="flex items-center gap-1.5 text-[11px] text-crash-dim">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Sparkline({ activity }: { activity: number[] }) {
  const max = Math.max(1, ...activity);
  return (
    <span
      className="flex h-4 items-end gap-[2px]"
      title="commits per week, last 10 weeks"
    >
      {activity.map((n, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(12, (n / max) * 100)}%` }}
          className={`w-[3px] ${i === activity.length - 1 && n > 0 ? "bg-crash-amber" : "bg-crash-green/60"}`}
        />
      ))}
    </span>
  );
}

export function RepoPanel() {
  const [repos, setRepos] = useState<LiveRepo[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}repos.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => setRepos(data.repos))
      .catch(() => setFailed(true));
  }, []);

  if (failed || (repos && repos.length === 0)) return null;

  return (
    <section className="mt-10">
      <p className="mb-3 font-mono text-xs uppercase tracking-widest text-crash-dim">
        ~/projects — auto-synced from github{" "}
        <span className="normal-case text-crash-dim/60">
          (pinned first · ci status · commit activity)
        </span>
      </p>
      <div className="overflow-hidden rounded-lg border border-crash-line bg-crash-panel font-mono text-sm">
        {repos === null ? (
          <p className="px-4 py-3 text-crash-dim">loading ~/projects…</p>
        ) : (
          <ul className="divide-y divide-crash-line">
            {repos.map((repo) => (
              <li key={repo.name}>
                <a
                  href={repo.homepage || repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-3 transition-colors hover:bg-black/30"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-crash-green">drwxr-xr-x</span>
                    <span className="font-semibold text-white">{repo.name}/</span>
                    {repo.pinned && (
                      <span
                        title="pinned on GitHub"
                        className="rounded border border-crash-amber/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-crash-amber"
                      >
                        ★ pinned
                      </span>
                    )}
                    {repo.language && (
                      <span className="rounded border border-crash-line bg-crash-bg px-1.5 py-0.5 text-[11px] text-crash-amber">
                        {repo.language}
                      </span>
                    )}
                    {repo.ci && <CiBadge status={repo.ci} />}
                    {repo.activity && <Sparkline activity={repo.activity} />}
                    <span className="ml-auto text-[11px] text-crash-dim">
                      ★ {repo.stars}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="mt-1 pl-[6.2rem] text-xs leading-relaxed text-crash-dim">
                      {repo.description}
                    </p>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
