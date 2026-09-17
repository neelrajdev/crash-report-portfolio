import { useBootSequence } from "../hooks/useBootSequence";

export function BootScreen({ lines, onSkip }: { lines: string[]; onSkip: () => void }) {
  return (
    <div
      onClick={onSkip}
      className="flex min-h-screen cursor-pointer flex-col justify-end bg-crash-bg p-6 font-mono text-sm text-crash-green sm:p-10"
    >
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <p key={i} className="animate-rise opacity-70">
            <span className="text-crash-dim">$</span> {line}
          </p>
        ))}
        <p className="mt-4 animate-pulse text-xs text-crash-dim">
          [ click anywhere to skip the suspense ]
        </p>
      </div>
    </div>
  );
}
