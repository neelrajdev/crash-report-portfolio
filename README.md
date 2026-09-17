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

Live on **Cloudflare Pages**: https://neelrajdev.pages.dev

**Deploys are fully automated:**

- **Push to `main`** → pipeline runs (rebuild AI index from live GitHub data →
  typecheck + build → deploy to Pages)
- **One-click manual deploy** → repo *Actions* tab → *Deploy to Cloudflare
  Pages* → **Run workflow** — ships whatever is on `main`
- **Nightly** → the AI index refreshes from GitHub even without pushes

> The URL is portfolio-agnostic: it's tied to the account, not this project.
> To swap in a completely different site, replace `src/` and deploy — the
> URL, pipeline, and AI plumbing stay identical.

## License

MIT — crash responsibly.
