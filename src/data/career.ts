import data from "./career.json";

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

export const exception = data.exception;
export const identity = data.identity;
export const frames = data.frames as StackFrame[];
export const contact = data.contact;
