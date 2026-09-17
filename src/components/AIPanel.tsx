import { useState } from "react";
import { ask, onModelProgress, type Answer } from "../lib/rag";
import type { RagDoc } from "../lib/rag-types";

interface Msg {
  role: "you" | "ai";
  text: string;
  answer?: Answer;
}

const SUGGESTIONS = [
  "what projects have you built?",
  "what are you learning right now?",
  "which repo shows your best work?",
  "why did the site crash?",
];

function Citations({ docs }: { docs: RagDoc[] }) {
  if (!docs.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {docs.map((doc, i) => (
        <a
          key={`${doc.source}-${i}`}
          href={doc.url}
          target="_blank"
          rel="noreferrer"
          title={doc.text.slice(0, 120)}
          className="rounded border border-crash-line bg-crash-bg px-2 py-0.5 font-mono text-[11px] text-crash-amber transition-colors hover:border-crash-amber"
        >
          [{i + 1}] {doc.source}
        </a>
      ))}
    </div>
  );
}

export function AIPanel() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [thread, setThread] = useState<Msg[]>([]);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [geminiKey, setGeminiKey] = useState(
    () => localStorage.getItem("gemini-key") ?? "",
  );

  onModelProgress(setStatus);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setThread((t) => [...t, { role: "you", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const answer = await ask(q, geminiKey || undefined);
      setThread((t) => [...t, { role: "ai", text: answer.text, answer }]);
    } catch {
      setThread((t) => [
        ...t,
        {
          role: "ai",
          text: "My retrieval cortex failed to load (offline or blocked). The stack trace above still works — it's all in there.",
        },
      ]);
    } finally {
      setBusy(false);
      setStatus(null);
    }
  };

  const saveKey = (key: string) => {
    setGeminiKey(key);
    if (key) localStorage.setItem("gemini-key", key);
    else localStorage.removeItem("gemini-key");
  };

  return (
    <section className="mt-12 border border-crash-line bg-crash-panel">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-crash-line px-4 py-3">
        <h2 className="font-mono text-sm font-bold text-white">
          ask-my-ai <span className="text-crash-dim">— stdin attached</span>
        </h2>
        <div className="flex items-center gap-2">
          <span className="rounded border border-crash-green/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-crash-green">
            phase 2 · live rag
          </span>
          <button
            onClick={() => setShowKeyInput((s) => !s)}
            title="Optional: bring your own Gemini key for generative answers"
            className="rounded border border-crash-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-crash-dim hover:text-white"
          >
            {geminiKey ? "gemini ✓" : "gemini?"}
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div className="flex items-center gap-2 border-b border-crash-line bg-black/20 px-4 py-2">
          <span className="font-mono text-xs text-crash-dim">
            Gemini API key (stored locally, never sent anywhere but Google):
          </span>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="AIza…"
            className="w-48 rounded border border-crash-line bg-crash-bg px-2 py-1 font-mono text-xs text-white focus:border-crash-green focus:outline-none"
          />
        </div>
      )}

      <div className="min-h-[140px] space-y-3 px-4 py-4">
        {thread.length === 0 && (
          <div className="space-y-3">
            <p className="font-mono text-xs text-crash-dim">
              I answer from {`{`}my repos, READMEs, commit history, career story{`}`}
              — with citations to the real sources. Pick a question or type your own:
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded border border-crash-line bg-crash-bg px-3 py-1.5 font-mono text-xs text-crash-green transition-colors hover:border-crash-green"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {thread.map((msg, i) => (
          <div key={i} className="font-mono text-sm">
            <span className={msg.role === "you" ? "text-crash-amber" : "text-crash-green"}>
              {msg.role === "you" ? "you >" : "ai >"}
            </span>{" "}
            <span className="whitespace-pre-wrap text-white/90">{msg.text}</span>
            {msg.answer && <Citations docs={msg.answer.citations} />}
            {msg.answer && (
              <span className="ml-2 text-[10px] uppercase tracking-wider text-crash-dim/70">
                {msg.answer.generative ? "gemini + retrieval" : "extractive"}
              </span>
            )}
          </div>
        ))}

        {busy && (
          <div className="font-mono text-sm">
            <span className="text-crash-green">ai {">"}</span>{" "}
            <span className="text-crash-dim">
              {status ?? "retrieving from my corpus…"}
            </span>{" "}
            <span className="animate-pulse text-crash-green">▌</span>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex border-t border-crash-line"
      >
        <span className="px-4 py-3 font-mono text-sm text-crash-amber">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask my corpus anything…"
          className="w-full bg-transparent py-3 pr-4 font-mono text-sm text-white placeholder:text-crash-dim/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 font-mono text-sm text-crash-green hover:text-white disabled:opacity-40"
        >
          send ⏎
        </button>
      </form>
    </section>
  );
}
