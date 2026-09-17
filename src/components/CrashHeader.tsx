import { exception } from "../data/career";

export function CrashHeader() {
  return (
    <header className="animate-flicker border-b border-crash-line pb-8">
      <p className="font-mono text-xs uppercase tracking-widest text-crash-dim">
        {exception.signal} — unhandled exception
      </p>
      <h1 className="mt-3 animate-glitch font-mono text-4xl font-bold text-crash-red sm:text-6xl">
        FATAL: {exception.code}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-crash-dim">
        {exception.message}
      </p>
      <p className="mt-2 font-mono text-sm text-crash-amber">
        {exception.hint}
      </p>
    </header>
  );
}
