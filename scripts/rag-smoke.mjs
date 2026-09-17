/** RAG smoke test — run: node scripts/rag-smoke.mjs */
import { pipeline } from "@huggingface/transformers";
import { readFileSync } from "node:fs";

const index = JSON.parse(readFileSync("public/rag-index.json", "utf8"));
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

async function ask(q) {
  const out = await extractor(q, { pooling: "mean", normalize: true });
  const qv = Array.from(out.data);
  const scored = index.docs
    .map((d) => ({
      s: d.source,
      t: d.text.slice(0, 70),
      score: d.vec.reduce((acc, v, i) => acc + v * qv[i], 0),
    }))
    .sort((a, b) => b.score - a.score);
  console.log(`\nQ: ${q}`);
  scored
    .slice(0, 2)
    .forEach((r, i) => console.log(`  [${i + 1}] ${r.score.toFixed(3)} ${r.s} — ${r.t}…`));
}

await ask("what projects have you built?");
await ask("what is he learning right now?");
await ask("tell me about his github activity");
