import { contact } from "../data/career";
import { CrashHeader } from "./CrashHeader";
import { Debugger } from "./Debugger";
import { RepoPanel } from "./RepoPanel";
import { CrashCounter } from "./CrashCounter";
import { AIPanel } from "./AIPanel";

export function CrashReport() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <CrashHeader />
      <Debugger />
      <RepoPanel />
      <AIPanel />
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-crash-line pt-6 font-mono text-sm">
        <span className="text-crash-dim">
          core dumped → <span className="text-crash-green">/dev/recruiter</span>
          {" · "}
          <CrashCounter />
        </span>
        <div className="flex gap-5">
          <a
            href={contact.github.href}
            target="_blank"
            rel="noreferrer"
            className="text-crash-green hover:text-white"
          >
            {contact.github.label}
          </a>
          <a href={contact.email.href} className="text-crash-amber hover:text-white">
            {contact.email.label}
          </a>
        </div>
      </footer>
    </main>
  );
}
