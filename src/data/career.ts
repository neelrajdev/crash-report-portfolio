export interface StackFrame {
  /** e.g. "Chapter1.gotCurious" — reads like code */
  fn: string;
  /** file path that reads like a real stack frame */
  file: string;
  line: number;
  /** the story of this chapter */
  title: string;
  body: string;
  /** tech/tools that defined the chapter */
  stack: string[];
  /** optional links (projects, repos) */
  links?: { label: string; href: string }[];
  /** visual weight: latest chapter = fatal */
  kind: "chapter" | "fatal";
}

export const exception = {
  signal: "SIGPORTFOLIO",
  code: "CAREER_OVERFLOW",
  message:
    "The story you are about to read could not be contained in a resume.",
  hint: "Paused on exception — F8 to resume, F10 to step through the frames.",
};

export const identity = {
  name: "neelrajdev",
  role: "developer-in-training",
  runtime: "neelraj-os 5.1.0",
};

export const frames: StackFrame[] = [
  {
    fn: "Chapter4.enteringTheArena",
    file: "src/career/present.tsx",
    line: 404,
    title: "Right now — learning in public",
    body: "Building AI-flavored tools, breaking things on purpose, and writing down what happened. This portfolio is the log file.",
    stack: ["TypeScript", "React", "LLM APIs"],
    kind: "fatal",
  },
  {
    fn: "Chapter3.firstRealProjects",
    file: "src/career/projects.ts",
    line: 301,
    title: "First real projects — the phase where tutorials end",
    body: "Moved from following tutorials to shipping things nobody asked for but I needed. Learned that deployment is a feature, not an afterthought.",
    stack: ["Node.js", "Git", "APIs"],
    kind: "chapter",
  },
  {
    fn: "Chapter2.deepDive",
    file: "src/career/learning.ts",
    line: 202,
    title: "Going deeper — data structures, systems, debugging",
    body: "Stopped copying code and started reading it. Learned to love the debugger and the error message that finally makes sense at 2am.",
    stack: ["JavaScript", "Python", "DSA"],
    kind: "chapter",
  },
  {
    fn: "Chapter1.helloWorld",
    file: "src/career/origin.ts",
    line: 101,
    title: "The first line of code",
    body: "Where it started: curiosity, a blank file, and a program that printed my own name. Nothing has been the same since.",
    stack: ["Curiosity", "HTML", "print()"],
    kind: "chapter",
  },
];

export const contact = {
  github: { label: "github.com/neelrajdev", href: "https://github.com/neelrajdev" },
  email: { label: "say hello", href: "mailto:hello@neelraj.dev" },
};
