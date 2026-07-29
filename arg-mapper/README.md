# Argument Mapper

A sequential, dialogue-first argument mapping tool for learners ages 10–14 (and beyond). Instead of handing you a blank graph to fill in, it builds your argument tree step by step through conversation — then reveals the full map once you've committed to each claim.

## Why

Existing tools (Kialo, Rationale, MindMup) are graph-first: you see the empty canvas before you've reasoned anything out. This causes cognitive overload for novices, invites backward rationalization, and teaches students to decorate a structure rather than think through one.

This tool is different: the graph is the *output* of reasoning, not the working surface. Sequential input forces commitment to each claim before seeing where the argument goes — mirroring how a good philosophy teacher runs a Socratic discussion.

## How it works

1. **State your conclusion.** The tool holds it at the top of the graph.
2. **Give a reason.** It asks whether that reason needs a co-premise to work, or stands alone.
3. **Face an objection.** It prompts you to respond before moving on.
4. **See the map.** The full argument graph reveals itself as you build it.

Clicking any premise in the graph enters **focus mode**, zooming into that branch so you can continue developing it through the dialogue pane.

An **AI Guide** (beta) replaces the scripted prompts with context-aware Socratic questions streamed from an LLM — adapting to your specific argument rather than following a fixed script.

## Key concepts

| Term | Meaning |
|---|---|
| Contention | The main conclusion at the top of the argument |
| Premise | A reason supporting the contention (or another premise) |
| Co-premise | Two claims that only work *together* — every simple argument needs at least two |
| Objection | A claim that attacks a premise or the contention |
| Rebuttal | A response that attacks an objection |

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:3001`.

## Two ways to run it

The same client code runs with or without a backend, and works out which at
startup by probing `/api/health`.

| | Sessions | AI Guide |
| --- | --- | --- |
| `npm run dev` (Express) | SQLite, in `data.db` | Yes, with an API key |
| `npm run build` (static files) | IndexedDB, in the browser | No — scripted prompts |

Nothing about the reasoning flow depends on the network: the dialogue state
machine produces a scripted prompt for every step, and the Guide only ever
rephrases it. Served statically, the Guide toggle is disabled and says why.

The static build is what deploys to GitHub Pages. `npm run build` copies
`client/` to `dist/` — there is no bundler, since the client is plain ES modules
and loads D3 from a CDN through an import map.

Sessions in the browser go to IndexedDB rather than localStorage: an argument
tree is unbounded, and localStorage is a synchronous 5MB cliff. localStorage is
the fallback where IndexedDB is unavailable. Either way the records carry the
same shape and timestamps the SQLite backend returns, so nothing downstream
knows which is in use.

**A browser-stored session is local to that browser.** No sync, and clearing
site data deletes it.

## AI Guide setup

The AI Guide is optional. Without a key the app runs in scripted mode with no degradation.

1. Copy `.env.example` to `.env`
2. Add your API key and (optionally) choose a model
3. Restart the server — the Guide toggle will now stream real responses

The server talks to any OpenAI-compatible endpoint. The default is [OpenRouter](https://openrouter.ai), which gives you access to hundreds of models under one key. To switch models, change `AI_MODEL` in `.env` and restart — no code changes.

```
AI_BASE_URL=https://openrouter.ai/api/v1
AI_API_KEY=sk-or-...
AI_MODEL=anthropic/claude-3.5-haiku
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Express dev server with `--watch` at `http://localhost:3001` |
| `npm run server` | Express (production, no watch) |
| `npm run build` | Static build into `dist/` — browser sessions, no AI Guide |
| `npm run preview` | Build, then serve `dist/` with no backend at all |
| `npm test` | Vitest unit tests (node env, no browser) — what CI runs |
| `npm run test:e2e` | Playwright end-to-end tests (auto-starts dev server) |
| `npm run test:ui` | Playwright with interactive UI |
| `npm run lint` | oxlint |
| `npm run fmt` | oxfmt (auto-fix) |
| `npm run fmt:check` | oxfmt (check only, no writes) |

## Project structure

```
client/
  index.html         — entry point; import map for D3
  js/
    main.js          — wires DOM, graph, session, and dialogue together
    dialogue.js      — state machine: contention → premise → co-premise → objection → rebuttal
    graph.js         — D3 rendering: map mode and focus mode
    tree-utils.js    — layout computation and subtree helpers
    session.js       — picks a backend (server or browser), AI streaming fetch
    store/
      local-store.js — IndexedDB session store, localStorage fallback
  css/               — styles
scripts/
  build-static.mjs   — copies client/ to dist/ for the serverless deployment
server/
  index.js           — Express; static file serving + API routes
  db.js              — SQLite session storage (better-sqlite3)
  ai/
    provider.js      — AI provider seam (swap via env vars, no code changes)
    socratic.js      — prompt building utilities
tests/
  e2e/               — Playwright end-to-end tests
  unit/              — Vitest unit tests (dialogue, tree-utils, socratic, local-store)
```

## Background

Grounded in cognitive load research: successive (sequential) presentation produces better learning outcomes than simultaneous presentation for novice learners. The full argument graph front-loads all complexity, causing a split-attention effect — students process spatial layout and verbal content at the same time, doing neither well.

Key research: Twardy (2004) — argument mapping triples critical thinking gains; Van Gelder (2015) — high-intensity argument mapping improves critical thinking by 0.8 SD; AMQuestioner (ACM 2024) — question-driven interactive argument maps.
