# 💥 Crash Report — a portfolio that crashes on purpose

> `SIGPORTFOLIO` — unhandled exception: *the story could not be contained in a resume.*

This portfolio "boots", fails, and renders the failure as an **interactive stack
trace of my career**. Every frame is a chapter — expand it to read the story,
the tech, and the receipts. Attached to the crash report is an **ask-my-ai**
panel: eventually a real AI that answers questions about me, citing my actual
repositories.

## Why a crash?

A resume is a static file. A crash report has structure: severity, frames,
depth, a story you step *into*. Recruiters remember the site that crashed —
and then made them read every frame.

## Roadmap

- [x] **Phase 1 — The Crash** *(this repo)*
  - Boot sequence → fatal exception → interactive stack trace
  - Data-driven frames (`src/data/career.ts`) — edit that one file to update the story
  - Canned-response AI panel stub
- [ ] **Phase 2 — The Brain**
  - RAG over my repos, READMEs and commit history (embeddings + vector store)
  - Serverless API endpoint, answers with citations to real commits
  - Streaming responses typed out terminal-style
- [ ] **Phase 3 — The Evidence**
  - Live GitHub stats embedded in frames (stars, commits, CI badges)
  - Frame-specific repos pinned and auto-synced

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS

## Run it

```bash
npm install
npm run dev      # local dev
npm run build    # typecheck + production build
npm run deploy   # rebuild AI index + build + deploy to Cloudflare Pages
```

## Hosting

Live on **Cloudflare Pages**: https://crash-report-portfolio.pages.dev

Deploys are done from the local workspace with Wrangler (`npm run deploy`) —
the RAG index is rebuilt from live GitHub data on every deploy, so the AI's
knowledge stays current. The GitHub repo remains the source of truth for code.

## License

MIT — crash responsibly.
