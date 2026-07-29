# visualizing-philosophy

A collection of interactive diagrams of philosophical structure. Each visualization is an independent project in its own directory; the repository root holds only what they share.

## Motivation

Prose and diagrams are both cheap to generate now. What is still scarce is knowing where to point the generator. This repository is a set of experiments in that pointing: which parts of philosophy get clearer when they are given a shape, and which merely get decorated.

The expected payoff is not research. Nothing here is likely to produce a breakthrough in philosophy. The plausible win is teaching — philosophy education is unusually badly served by prose alone, because the structure a student needs to see (which commitments depend on which, where two schools actually diverge, what a given position costs you) is exactly what a linear text hides.

### Does the interaction do any work?

These differ in whether interacting with them *generates* understanding or only *retrieves* it. That is the axis to judge them on:

| | What the interaction does |
| --- | --- |
| `thinking-about-thinking` | **Contextualizes and aggregates.** You can see what happened where and when. The visualization itself probably isn't producing much new understanding. |
| `free-will-map` | **Locates.** Toggling premises shows which position you have committed yourself to — an existing map, read off rather than built. |
| `belief-mart` | **Elicits.** Shopping surfaces commitments you didn't know you had, then names the result. Centered on religion, but the mechanism adapts to any belief system. |
| `arg-mapper` | **Constructs.** The only one whose output is yours, and the only one that doubles as a tool for formalization. |

Roughly: the further down that list, the more the diagram is a working surface rather than a display.

### Where this goes next

**Visualizing philosophical differences.** Not "what does Buddhism hold" but where Buddhism and Christianity actually part company, and on what. Likewise for free will and consciousness, where the disagreements are structural rather than verbal.

**Belief webs.** What are a religion's — or a school's — commitments? How do they connect? Which are at odds? And the part that usually goes missing from summaries: how have people inside the tradition tried to ameliorate the tensions? A tension with a thousand-year repair history is a different object from a flat contradiction.

**Forms worth trying.** Aporetic clusters (`free-will-map` is one). Syllogisms. The classic diagrams themselves — the divided line, rendered so it can be interrogated rather than admired.

The common thread, and what `arg-mapper` was probably reaching for: break a debate down, compress it, then spatially locate and relate the pieces — context and history, the live disagreement, the evidence — so that position in the diagram carries meaning.

## Context

Diagrams in philosophy aren't an outlier; they're an old tradition that got interrupted. Plato's divided line, Aristotle's square of opposition, Zhou Dunyi's Taijitu, Llull's combinatorial wheels, Hobbes' Leviathan frontispiece, Euler's circles, Peirce's existential graphs, Neurath's Isotype. Contemporary philosophy still uses them constantly — Lewis's spheres, Parfit's fission diagrams, Kripke frames, causal DAGs — we just don't think of it as a visual tradition.

It thinned out for two reasons: worries after Hilbert that diagrams smuggle in unstated assumptions, and the plain fact that journals rewarded prose.

There's room for more, because that rigor objection has been answered (Shin, Barwise & Etchemendy), argument mapping demonstrably improves reasoning, and structurally complex debates are where prose strains hardest. The real risk isn't rigor — it's that a diagram's conventions quietly become metaphysical claims.

## The visualizations

| Directory | What it is | Ships to Pages |
| --- | --- | --- |
| [`free-will-map/`](free-will-map/) | An interactive map of the free will debate as an aporetic cluster. | yes |
| [`belief-mart/`](belief-mart/) | A shop where you assemble a religion from its parts, then find out what you built. | yes |
| [`thinking-about-thinking/`](thinking-about-thinking/) | Two views on the early history of reflection about the mind: a comparative timeline and a character cladogram. | yes |
| [`arg-mapper/`](arg-mapper/) | A dialogue-first argument mapper: the graph is the output of reasoning, not the working surface. | no — runs locally |

Each has its own README, dependencies and build.

`arg-mapper` is the odd one out: an Express server with SQLite session storage and an optional LLM-backed Socratic guide, so it can't be a static page. Run it locally (`cd arg-mapper && npm install && npm run dev`). The deploy workflow skips it rather than failing on it.

## Working on one

```sh
cd free-will-map    # or any other visualization
npm install
npm run dev
```

## Layout

Anything shared lives at the root and is not duplicated per project:

- `.github/workflows/deploy.yml` — one workflow builds every visualization and
  publishes them together to GitHub Pages
- `.gitignore`, `LICENSE`
- `index.html` — the landing page that links to each visualization

Each project directory holds its own `package.json`, build config, source and
`README.md`, and nothing global. Secrets stay per-project and uncommitted — see
`arg-mapper/.env.example`.

## Deploying

The workflow runs on every push to `main`. It walks the top-level directories and,
for each one with a `package.json` **and a `build` script**, runs `npm ci`, then
that project's tests if it defines a `test` script, then the build — collecting
the output into `dist/<name>/`. The root `index.html` is copied alongside them.
Directories with no `build` script are server apps Pages cannot host, so they are
skipped with a log line rather than failing the run.

A visualization is therefore served from `https://<user>.github.io/<repo>/<name>/`,
which is why every static project builds with a relative base (`base: "./"` in its
Vite config).

## Adding a visualization

1. Create a directory with its own `package.json`. Give it a `build` script that
   emits to `dist/` if it should ship to Pages; leave that out if it's a local-only
   server app.
2. Set a relative base in the Vite config: `base: "./"`.
3. Link it from `index.html` and add it to the table above.

## License

MIT — see [LICENSE](LICENSE).
