/**
 * RAG index builder — corpus: public GitHub repos (readme + recent commit
 * subjects) + the career story from src/data/career.json.
 *
 * Embeddings: Xenova/all-MiniLM-L6-v2 via @huggingface/transformers (local,
 * free, no API keys). Output: public/rag-index.json — a static file the
 * browser RAG retrieves from.
 *
 * Run: node scripts/build-index.mjs [github_user]
 */
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { pipeline } from "@huggingface/transformers";

const USER = process.argv[2] ?? "neelrajdev";
const OUT = "public/rag-index.json";
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

// ---------- corpus ----------
async function fetchRepos() {
  const repos = await gh(`/users/${USER}/repos?per_page=100&sort=updated`);
  return repos.filter((r) => !r.fork && !r.archived);
}

async function fetchReadme(repo) {
  try {
    const r = await gh(`/repos/${USER}/${repo.name}/readme`);
    return Buffer.from(r.content, "base64").toString("utf8");
  } catch {
    return "";
  }
}

async function fetchCommits(repo) {
  try {
    const commits = await gh(`/repos/${USER}/${repo.name}/commits?per_page=20`);
    return commits
      .map((c) => c.commit?.message?.split("\n")[0])
      .filter(Boolean)
      .slice(0, 15);
  } catch {
    return [];
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

async function writeRepoList() {
  const repos = await fetchRepos();
  const list = repos.map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    url: r.html_url,
    updatedAt: r.updated_at,
    homepage: r.homepage || null,
  }));
  writeFileSync("public/repos.json", JSON.stringify({ updated: new Date().toISOString(), repos: list }));
  console.log(`wrote public/repos.json with ${list.length} repos`);
  return repos;
}

async function buildCorpus() {
  const corpus = [];

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

  // repos
  const repos = await writeRepoList();
  console.log(`found ${repos.length} repos for ${USER}`);
  for (const repo of repos) {
    const [readme, commits] = await Promise.all([
      fetchReadme(repo),
      fetchCommits(repo),
    ]);
    const about = `${repo.name}: ${repo.description ?? "no description"}. Language: ${repo.language ?? "unknown"}.`;
    corpus.push({
      source: `repo:${repo.name}`,
      title: repo.name,
      url: repo.html_url,
      text: chunkText(`${about}\n\n${readme}`)[0] || about,
    });
    if (commits.length) {
      corpus.push({
        source: `commits:${repo.name}`,
        title: `recent work on ${repo.name}`,
        url: `${repo.html_url}/commits`,
        text: `Recent commit history of ${repo.name}: ${commits.join("; ")}`,
      });
    }
    console.log(`  + ${repo.name} (readme ${readme.length}b, ${commits.length} commits)`);
  }

  return corpus;
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
const corpus = await buildCorpus();
if (!corpus.length) {
  console.error("no corpus gathered — check username/network");
  process.exit(1);
}
const vectors = await embedAll(corpus);
writeFileSync(
  OUT,
  JSON.stringify(
    {
      model: "Xenova/all-MiniLM-L6-v2",
      builtAt: new Date().toISOString(),
      docs: corpus.map((d, i) => ({ ...d, vec: vectors[i] })),
    },
    null, // no pretty print — vectors are bulky
  ),
);
console.log(`wrote ${OUT} with ${corpus.length} docs`);
