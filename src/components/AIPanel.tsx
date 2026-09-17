import { useState } from "react";

interface CannedQA {
  q: string;
  a: string;
}

const CANNED: CannedQA[] = [
  {
    q: "who is this?",
    a: "Neelraj — a developer-in-training who ships, breaks, and documents. The stack trace above is the short version.",
  },
  {
    q: "what are you building?",
    a: "Currently: AI-flavored tools and this very portfolio. The ask-me-anything brain is Phase 2 — it will answer from my real repos, not vibes.",
  },
  {
    q: "what can you do?",
    a: "TypeScript, React, Python, and a healthy respect for error messages. Full evidence trail coming in Phase 2, with citations to real commits.",
  },
  {
    q: "why did the site crash?",
    a: "Intentionally. A resume is a static file; a crash report has chapters. You're reading the design decision.",
  },
];

const SUGGESTIONS = CANNED.map((c) => c.q);

export function AIPanel() {
  const [input, setInput] = useState("");
  const [thread, setThread] = useState<{ role: "you" | "ai"; text: string }[]>(
    [],
  );

  const ask = (question: string) => {
    const q = question.trim().toLowerCase();
    if (!q) return;
    const match = CANNED.find(
      (c) => c.q === q || q.includes(c.q.slice(0, 12)),
    );
    const answer =
      match?.a ??
      "Phase 2 will wire me to real repo data so I can answer that properly. For now, try one of the suggested questions — or read the stack trace, it's all in there.";
    setThread((prev) => [...prev, { role: "you", text: question }, { role: "ai", text: answer }]);
    setInput("");
  };

  return (
    <section className="mt-12 border border-crash-line bg-crash-panel">
      <header className="flex items-center justify-between border-b border-crash-line px-4 py-3">
        <h2 className="font-mono text-sm font-bold text-white">
          ask-my-ai <span className="text-crash-dim">— stdin attached</span>
        </h2>
        <span className="rounded border border-crash-amber/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-crash-amber">
          phase 2 · stub
        </span>
      </header>

      <div className="min-h-[120px] space-y-3 px-4 py-4">
        {thread.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded border border-crash-line bg-crash-bg px-3 py-1.5 font-mono text-xs text-crash-green transition-colors hover:border-crash-green"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {thread.map((msg, i) => (
          <div key={i} className="font-mono text-sm">
            <span className={msg.role === "you" ? "text-crash-amber" : "text-crash-green"}>
              {msg.role === "you" ? "you >" : "ai >"}
            </span>{" "}
            <span className="text-white/90">{msg.text}</span>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex border-t border-crash-line"
      >
        <span className="px-4 py-3 font-mono text-sm text-crash-amber">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ask the AI anything about me…"
          className="w-full bg-transparent py-3 pr-4 font-mono text-sm text-white placeholder:text-crash-dim/60 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 font-mono text-sm text-crash-green hover:text-white"
        >
          send ⏎
        </button>
      </form>
    </section>
  );
}
