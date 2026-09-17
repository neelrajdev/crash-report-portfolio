import { useState } from "react";
import { frames, type StackFrame } from "../data/career";

function FrameRow({
  frame,
  depth,
  open,
  onToggle,
}: {
  frame: StackFrame;
  depth: number;
  open: boolean;
  onToggle: () => void;
}) {
  const isFatal = frame.kind === "fatal";
  return (
    <li
      style={{ paddingLeft: `${depth * 1.5}rem` }}
      className="animate-rise border-l-2 border-crash-line"
    >
      <button
        onClick={onToggle}
        className="group w-full py-2 text-left font-mono text-sm transition-colors hover:bg-crash-panel/60"
        aria-expanded={open}
      >
        <span className={isFatal ? "text-crash-red" : "text-crash-amber"}>
          at{" "}
        </span>
        <span
          className={
            isFatal
              ? "font-bold text-crash-red group-hover:underline"
              : "text-crash-green group-hover:underline"
          }
        >
          {frame.fn}
        </span>
        <span className="text-crash-dim">
          {" "}
          ({frame.file}:{frame.line})
        </span>
        <span className="ml-2 text-crash-dim opacity-0 transition-opacity group-hover:opacity-100">
          {open ? "[-] collapse" : "[+] expand"}
        </span>
      </button>

      {open && (
        <div className="mb-4 max-w-2xl border border-crash-line bg-crash-panel p-4 sm:p-5">
          <h3 className="text-base font-semibold text-white sm:text-lg">
            {frame.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-crash-dim">
            {frame.body}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {frame.stack.map((tech) => (
              <span
                key={tech}
                className="rounded border border-crash-line bg-crash-bg px-2 py-0.5 font-mono text-xs text-crash-green"
              >
                {tech}
              </span>
            ))}
          </div>
          {frame.links && (
            <div className="mt-3 flex flex-wrap gap-3">
              {frame.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sm text-crash-amber underline decoration-dotted hover:text-white"
                >
                  → {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export function StackTrace() {
  // fatal frame (index 0) starts open so the story begins immediately
  const [openSet, setOpenSet] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <section className="mt-10">
      <p className="mb-4 font-mono text-xs uppercase tracking-widest text-crash-dim">
        stack trace — {frames.length} frames, newest first
      </p>
      <ol className="space-y-1">
        {frames.map((frame, i) => (
          <FrameRow
            key={frame.fn}
            frame={frame}
            depth={i}
            open={openSet.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </ol>
    </section>
  );
}
