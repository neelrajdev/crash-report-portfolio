import { useEffect, useRef, useState } from "react";

const BOOT_LINES = [
  "neelraj-os 5.1.0 — initializing career runtime…",
  "loading modules: curiosity, persistence, coffee……… ok",
  "mounting /projects …………………… ok",
  "mounting /skills ……………………… ok",
  "resolving resume.pdf ………………… failed",
  "reason: too static, not enough story",
  "falling back to stack trace renderer…",
];

export type BootState = "booting" | "crashed";

export function useBootSequence(speed = 1): {
  lines: string[];
  state: BootState;
  skip: () => void;
} {
  const [lines, setLines] = useState<string[]>([]);
  const [state, setState] = useState<BootState>("booting");
  const index = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const timer = setInterval(() => {
      if (index.current < BOOT_LINES.length) {
        setLines((prev) => [...prev, BOOT_LINES[index.current]]);
        index.current += 1;
      } else {
        clearInterval(timer);
        setTimeout(() => setState("crashed"), 500 / speed);
      }
    }, 320 / speed);
    return () => clearInterval(timer);
  }, [speed]);

  const skip = () => {
    if (state === "booting") {
      setLines(BOOT_LINES);
      setState("crashed");
    }
  };

  return { lines, state, skip };
}
