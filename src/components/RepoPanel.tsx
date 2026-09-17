import { useEffect, useState } from "react";

interface LiveRepo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
  updatedAt: string;
  homepage: string | null;
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
          (new repos appear here on their own)
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
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-crash-green">drwxr-xr-x</span>
                    <span className="font-semibold text-white">{repo.name}/</span>
                    {repo.language && (
                      <span className="rounded border border-crash-line bg-crash-bg px-1.5 py-0.5 text-[11px] text-crash-amber">
                        {repo.language}
                      </span>
                    )}
                    <span className="text-[11px] text-crash-dim">
                      ★ {repo.stars}
                    </span>
                    <span className="ml-auto text-[11px] text-crash-dim/70">
                      {new Date(repo.updatedAt).toLocaleDateString()}
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
