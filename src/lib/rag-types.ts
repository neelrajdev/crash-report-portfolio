export interface RagDoc {
  source: string;
  title: string;
  url: string;
  text: string;
  vec: number[];
}

export interface RagIndex {
  model: string;
  builtAt: string;
  docs: RagDoc[];
}
