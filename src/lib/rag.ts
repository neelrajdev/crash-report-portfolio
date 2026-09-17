/**
 * Browser-native RAG.
 * - embeds the query with the same model the index was built with
 * - cosine similarity over docs in /rag-index.json
 * - extractive, cited answers by default (no API key needed)
 * - optional generative polish via a user-supplied Gemini key (localStorage)
 */
import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";
import type { RagDoc, RagIndex } from "./rag-types";

let extractor: FeatureExtractionPipeline | null = null;
let indexCache: RagIndex | null = null;

// transformers.js's pipeline overload union is too complex for tsc; pin a simple signature
const getPipeline = pipeline as unknown as (
  task: "feature-extraction",
  model: string,
  options?: { dtype?: "fp32" | "q8" },
) => Promise<FeatureExtractionPipeline>;

const ModelProgress = {
  cb: null as ((status: string) => void) | null,
  emit(status: string) {
    this.cb?.(status);
  },
};

export function onModelProgress(cb: (status: string) => void) {
  ModelProgress.cb = cb;
}

async function getExtractor() {
  if (!extractor) {
    ModelProgress.emit("downloading embedding model (~30MB, first time only)…");
    extractor = await getPipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
      // quantized weights keep the download small; WASM runs everywhere
      { dtype: "q8" },
    );
    ModelProgress.emit("model ready");
  }
  return extractor;
}

async function getIndex(): Promise<RagIndex> {
  if (!indexCache) {
    ModelProgress.emit("loading knowledge index…");
    const res = await fetch(`${import.meta.env.BASE_URL}rag-index.json`);
    if (!res.ok) throw new Error(`index fetch failed: ${res.status}`);
    indexCache = (await res.json()) as RagIndex;
    ModelProgress.emit(`index ready — ${indexCache.docs.length} documents`);
  }
  return indexCache;
}

async function embed(text: string): Promise<number[]> {
  const model = await getExtractor();
  const out = await model(text, { pooling: "mean", normalize: true });
  return Array.from(out.data as Float32Array);
}

function cosine(a: number[], b: number[]) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // normalized vectors → dot product == cosine
}

export interface Answer {
  text: string;
  citations: RagDoc[];
  generative: boolean;
}

export async function ask(question: string, geminiKey?: string): Promise<Answer> {
  const index = await getIndex();
  const qvec = await embed(question);

  const scored = index.docs
    .map((doc) => ({ doc, score: cosine(qvec, doc.vec) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 3).filter((s) => s.score > 0.25);
  if (!top.length) {
    return {
      text: "I couldn't find anything in the indexed corpus about that — try asking about my projects, repos, or career chapters.",
      citations: [],
      generative: false,
    };
  }

  if (geminiKey) {
    try {
      const context = top
        .map((t, i) => `[${i + 1}] (${t.doc.source}) ${t.doc.text}`)
        .join("\n\n");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "You are answering questions about a developer named Neelraj, on his portfolio site. Answer ONLY from the provided context. Cite sources inline like [1] or [2] matching the numbered context blocks. Be concise, friendly, first-person-plural-free, max ~90 words.",
                },
              ],
            },
            contents: [
              { role: "user", parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }] },
            ],
            generationConfig: { temperature: 0.3, maxOutputTokens: 220 },
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text: string | undefined =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return { text: text.trim(), citations: top.map((t) => t.doc), generative: true };
        }
      }
    } catch {
      // fall through to extractive
    }
  }

  // extractive fallback: stitch best sentences from top chunks, with citations
  const parts = top.map((t, i) => {
    const first = t.doc.text.split(/(?<=[.!?])\s/)[0];
    return `[${i + 1}] ${first}`;
  });
  return {
    text: `From what I've shipped and written:\n\n${parts.join("\n")}`,
    citations: top.map((t) => t.doc),
    generative: false,
  };
}
