import { useEffect, useState } from "react";
import {
  frames,
  exception,
  identity,
  contact,
  type StackFrame,
} from "../data/career";

function IconPause() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
      <rect x="3" y="2" width="4" height="12" rx="1" />
      <rect x="9" y="2" width="4" height="12" rx="1" />
    </svg>
  );
}
function IconStep() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
      <path d="M3 2v9h2V2H3zm5.5 0v9L14 6.5 8.5 0V2z" transform="translate(0 2.5) scale(0.9)" />
      <rect x="3" y="13" width="10" height="2" rx="1" />
    </svg>
  );
}
function IconResume() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-current">
      <path d="M3 2l10 6-10 6V2z" />
    </svg>
  );
}

function FrameDetail({ frame }: { frame: StackFrame }) {
  return (
    <div className="animate-rise mb-4 border border-crash-line bg-crash-bg/70 p-4 sm:p-5">
      <h3 className="text-base font-semibold text-white sm:text-lg">
        {frame.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-crash-dim">{frame.body}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {frame.stack.map((tech) => (
          <span
            key={tech}
            className="rounded border border-crash-line bg-crash-panel px-2 py-0.5 font-mono text-xs text-crash-green"
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
  );
}

export function Debugger() {
  // newest chapter is paused (index 0); user steps backward through time
  const [current, setCurrent] = useState(0);
  const [resumed, setResumed] = useState(false);
  const [flash, setFlash] = useState(0);

  const step = () => {
    if (resumed || current >= frames.length - 1) return;
    setCurrent((c) => c + 1);
    setFlash((f) => f + 1);
  };

  const resume = () => setResumed(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F8") {
        e.preventDefault();
        resume();
      } else if (e.key === "F10") {
        e.preventDefault();
        step();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="mt-6 overflow-hidden rounded-lg border border-crash-line bg-crash-panel font-mono text-sm shadow-2xl">
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-crash-line bg-black/40 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-crash-red/80" />
        <span className="h-3 w-3 rounded-full bg-crash-amber/80" />
        <span className="h-3 w-3 rounded-full bg-crash-green/80" />
        <span className="ml-3 text-xs text-crash-dim">
          DevTools — <span className="text-white/80">neelraj.dev</span>
        </span>
        <span className="ml-auto text-xs text-crash-dim">
          {identity.runtime}
        </span>
      </div>

      {/* paused banner */}
      {!resumed && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-crash-line bg-crash-blue/10 px-4 py-2.5 text-xs">
          <span className="flex items-center gap-2 font-semibold text-crash-blue">
            <IconPause />
            Paused on exception — {exception.code}
          </span>
          <span className="text-crash-dim">
            {exception.message}
          </span>
          <span className="ml-auto flex items-center gap-1">
            <button
              onClick={resume}
              title="Resume (F8)"
              className="flex items-center gap-1.5 rounded px-2 py-1 text-crash-dim transition-colors hover:bg-crash-line hover:text-crash-green"
            >
              <IconResume /> F8
            </button>
            <button
              onClick={step}
              title="Step (F10)"
              className="flex items-center gap-1.5 rounded px-2 py-1 text-crash-dim transition-colors hover:bg-crash-line hover:text-crash-amber"
            >
              <IconStep /> F10
            </button>
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-[1fr_260px]">
        {/* call stack */}
        <div className="min-w-0 border-b border-crash-line md:border-b-0 md:border-r">
          <div className="border-b border-crash-line px-4 py-2 text-[11px] uppercase tracking-widest text-crash-dim">
            Call Stack
          </div>
          <ol>
            {frames.map((frame, i) => {
              const isCurrent = !resumed && i === current;
              const reached = resumed || i <= current;
              return (
                <li key={frame.fn}>
                  <button
                    onClick={() => {
                      if (resumed) {
                        setResumed(false);
                        setCurrent(i);
                      } else if (i !== current) {
                        setCurrent(i);
                        setFlash((f) => f + 1);
                      }
                    }}
                    style={{ paddingLeft: `${i * 1.25 + 1}rem` }}
                    className={`flex w-full items-baseline gap-2 py-2 pr-4 text-left transition-colors hover:bg-black/30 ${
                      isCurrent ? "bg-crash-blue/10" : ""
                    }`}
                  >
                    {/* breakpoint dot */}
                    <span
                      className={`h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${
                        reached ? "bg-crash-red" : "bg-crash-line"
                      }`}
                    />
                    <span
                      className={`truncate ${
                        isCurrent
                          ? "rounded-sm bg-crash-blue px-1 font-semibold text-white"
                          : frame.kind === "fatal"
                            ? "text-crash-red"
                            : reached
                              ? "text-crash-green"
                              : "text-crash-dim/50"
                      }`}
                    >
                      {frame.fn}
                    </span>
                    <span className="hidden truncate text-xs text-crash-dim/70 sm:inline">
                      {frame.file}:{frame.line}
                    </span>
                  </button>
                  {isCurrent && (
                    <div className="px-6 pb-4 sm:px-10">
                      <FrameDetail frame={frame} />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        {/* scope panel */}
        <aside className="bg-black/20 px-4 py-3 text-xs">
          <div className="mb-3 text-[11px] uppercase tracking-widest text-crash-dim">
            Scope — {resumed ? "released" : "local"}
          </div>
          {resumed ? (
            <p className="leading-relaxed text-crash-dim">
              Execution released. The stack is free to grow again —{" "}
              <a
                href={contact.github.href}
                target="_blank"
                rel="noreferrer"
                className="text-crash-green underline decoration-dotted hover:text-white"
              >
                watch it on GitHub
              </a>
              .
            </p>
            ) : (
            <>
              <dl className="space-y-1.5">
                <div>
                  <dt className="inline text-crash-amber">this</dt>
                  <dd className="inline text-white/90">
                    {" "}
                    :{" "}
                    <span className="text-crash-green">
                      {identity.name}
                    </span>{" "}
                    <span className="text-crash-dim">
                      // {identity.role}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="inline text-crash-amber">chapter</dt>
                  <dd className="inline text-white/90">
                    {" "}
                    : {frames[current].title}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-crash-amber">stack</dt>
                  <dd className="inline text-white/90">
                    {" "}
                    : [{frames[current].stack.join(", ")}]
                  </dd>
                </div>
                <div>
                  <dt className="inline text-crash-amber">depth</dt>
                  <dd className="inline text-white/90">
                    {" "}
                    : {frames.length - current} of {frames.length}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 border-t border-crash-line pt-3 text-crash-dim">
                {exception.hint}
              </p>
            </>
          )}
        </aside>
      </div>

      {/* console drawer */}
      <div className="border-t border-crash-line bg-black/30 px-4 py-2.5 text-xs">
        <span className="text-crash-dim">›</span>{" "}
        <span key={flash} className="animate-flash text-crash-green">
          stepped into {frames[current].fn}
          {resumed ? " — execution resumed" : ""}
        </span>
        <span className="ml-2 animate-pulse text-crash-dim">▌</span>
      </div>

      {/* status bar */}
      <div className="flex items-center justify-between border-t border-crash-line bg-black/50 px-4 py-1.5 text-[11px] text-crash-dim">
        <span>
          {resumed ? "running…" : `paused at ${frames[current].file}:${frames[current].line}`}
        </span>
        <span>{frames.length} frames · 1 uncaught exception · 0 regrets</span>
      </div>
    </section>
  );
}
