/**
 * RAG index + live repo list builder.
 *
 * Outputs:
 *  - public/rag-index.json : corpus (career story + repos) with embeddings
 *  - public/repos.json     : repo metadata for the projects panel
 *                            (pinned-first, CI status, 10-week commit activity)
 *
 * Run: node scripts/build-index.mjs [github_user]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { pipeline } from "@huggingface/transformers";

const USER = process.argv[2] ?? "neelrajdev";
const API = "https://api.github.com";

const headers = {
  "User-Agent": "crash-report-portfolio-indexer",
  Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(path) {
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} on ${path}`);
  return res.json();
}

// ---------- repo data ----------
async function fetchRepos() {
  const repos = await gh(`/users/${USER}/repos?per_page=100&sort=updated`);
  return repos.filter((r) => !r.fork && !r.archived);
}

/** pinned repo names, in the order the user pinned them (GraphQL; [] if no token) */
async function fetchPinned() {
  if (!process.env.GITHUB_TOKEN) return [];
  try {
    const res = await fetch(`${API}/graphql`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        query: `{ user(login: "${USER}") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name } } } } }`,
      }),
    });
    const json = await res.json();
    return json?.data?.user?.pinnedItems?.nodes?.map((n) => n.name) ?? [];
  } catch {
    return [];
  }
}

async function fetchReadme(repo) {
  try {
    const r = await gh(`/repos/${USER}/${repo.name}/readme`);
    return Buffer.from(r.content, "base64").toString("utf8");
  } catch {
    return "";
  }
}

/** last ~100 default-branch commits → { subjects, activity: 10 weekly buckets } */
async function fetchCommitData(repo) {
  try {
    const commits = await gh(
      `/repos/${USER}/${repo.name}/commits?per_page=100&sha=${repo.default_branch}`,
    );
    const now = Date.now();
    const WEEK = 7 * 24 * 3600 * 1000;
    const activity = new Array(10).fill(0);
    const subjects = [];
    for (const c of commits) {
      const date = Date.parse(c.commit?.author?.date ?? "");
      if (Number.isFinite(date)) {
        const age = Math.floor((now - date) / WEEK);
        if (age >= 0 && age < 10) activity[9 - age] += 1;
      }
      if (subjects.length < 15) {
        const subject = c.commit?.message?.split("\n")[0];
        if (subject) subjects.push(subject);
      }
    }
    return { subjects, activity };
  } catch {
    return { subjects: [], activity: new Array(10).fill(0) };
  }
}

/** latest workflow run on the default branch → passing | failing | running | null */
async function fetchCi(repo) {
  try {
    const data = await gh(
      `/repos/${USER}/${repo.name}/actions/runs?per_page=6`,
    );
    const run = (data.workflow_runs ?? []).find(
      (r) => r.head_branch === repo.default_branch,
    );
    if (!run) return null;
    if (run.status && run.status !== "completed") return "running";
    if (run.conclusion === "success") return "passing";
    if (run.conclusion === null) return null;
    return "failing";
  } catch {
    return null;
  }
}

function chunkText(text, max = 900) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let cur = "";
  for (const p of paras) {
    if ((cur + "\n\n" + p).length > max && cur) {
      chunks.push(cur);
      cur = p;
    } else {
      cur = cur ? `${cur}\n\n${p}` : p;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// ---------- build corpus + repo list ----------
async function buildAll() {
  const [repos, pinned] = await Promise.all([fetchRepos(), fetchPinned()]);
  console.log(`found ${repos.length} repos for ${USER} (${pinned.length} pinned)`);

  const corpus = [];
  const repoList = [];

  // career story frames — highest-quality chunks, always cited
  const story = await import("../src/data/career.json", {
    with: { type: "json" },
  });
  const { frames, identity } = story.default;
  for (const f of frames) {
    corpus.push({
      source: "career-story",
      title: f.title,
      url: "https://github.com/neelrajdev",
      text: `${f.title}. ${f.body} Stack: ${f.stack.join(", ")}. (${identity.name} — ${identity.role})`,
    });
  }

  for (const repo of repos) {
    const [readme, commitData, ci] = await Promise.all([
      fetchReadme(repo),
      fetchCommitData(repo),
      fetchCi(repo),
    ]);

    const about = `${repo.name}: ${repo.description ?? "no description"}. Language: ${repo.language ?? "unknown"}.`;
    corpus.push({
      source: `repo:${repo.name}`,
      title: repo.name,
      url: repo.html_url,
      text: chunkText(`${about}\n\n${readme}`)[0] || about,
    });
    if (commitData.subjects.length) {
      corpus.push({
        source: `commits:${repo.name}`,
        title: `recent work on ${repo.name}`,
        url: `${repo.html_url}/commits`,
        text: `Recent commit history of ${repo.name}: ${commitData.subjects.join("; ")}`,
      });
    }

    repoList.push({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      url: repo.html_url,
      updatedAt: repo.updated_at,
      homepage: repo.homepage || null,
      pinned: pinned.includes(repo.name),
      ci,
      activity: commitData.activity,
    });
    console.log(
      `  + ${repo.name} (readme ${readme.length}b, ${commitData.subjects.length} commits, ci: ${ci ?? "n/a"})`,
    );
  }

  // pinned first (in pin order), then the rest by last update
  const rank = (r) => (r.pinned ? pinned.indexOf(r.name) : Number.MAX_SAFE_INTEGER);
  repoList.sort((a, b) => rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt));

  return { corpus, repoList };
}

// ---------- embeddings ----------
async function embedAll(corpus) {
  mkdirSync("public", { recursive: true });
  console.log("loading embedding model (downloads ~30MB on first run)…");
  const extractor = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );
  const vectors = [];
  for (const [i, doc] of corpus.entries()) {
    const out = await extractor(doc.text, { pooling: "mean", normalize: true });
    vectors.push(Array.from(out.data));
    process.stdout.write(`\rembedded ${i + 1}/${corpus.length}   `);
  }
  console.log();
  return vectors;
}

// ---------- main ----------
const { corpus, repoList } = await buildAll();
if (!corpus.length) {
  console.error("no corpus gathered — check username/network");
  process.exit(1);
}

writeFileSync(
  "public/repos.json",
  JSON.stringify({ updated: new Date().toISOString(), repos: repoList }),
);
console.log(`wrote public/repos.json with ${repoList.length} repos`);

const vectors = await embedAll(corpus);
writeFileSync(
  "public/rag-index.json",
  JSON.stringify({
    model: "Xenova/all-MiniLM-L6-v2",
    builtAt: new Date().toISOString(),
    docs: corpus.map((d, i) => ({ ...d, vec: vectors[i] })),
  }),
);
console.log(`wrote public/rag-index.json with ${corpus.length} docs`);
