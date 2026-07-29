# Free will — an aporetic cluster

An interactive map of the free will debate. Five propositions, each plausible on
its own, which cannot all be held at once. Every named position in the debate is
a decision about which one to give up. Toggle the premises and read off where you
land.

Sixteen reachable cells: nine occupied by named positions, four consistent but
empty, three flat contradictions.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints. `npm run build` produces a static site in `dist/`,
and `npm run preview` serves that build.

## Deploy it

Deployment is handled at the repository root — `../.github/workflows/deploy.yml`
builds every visualization on each push to `main` and publishes them together, so
this one lands at `https://<user>.github.io/<repo>/free-will-map/`. See the [root
README](../README.md) for the one-time Pages setup.

The one thing that usually breaks a Vite site on Pages is the base path — a site
served from a subdirectory 404s on absolute asset URLs. `vite.config.js` sets
`base: "./"`, so the build works at whatever path it ends up on. Nothing to edit
by hand.

## Editing the argument

Everything substantive lives in two structures at the top of
`src/FreeWillMap.jsx`.

**`PROPS`** — the five propositions. Each has a symbol, the proposition itself,
and a `knob`: the note explaining what turning it off commits you to, and which
classic case does the turning. Two of them carry an `idleWhen` predicate, because
the Consequence Argument has nothing to bite on when determinism is false, and
the luck objection has nothing to bite on when it's true. That's why the space is
16 cells rather than 32.

**`CELLS`** — the map itself, keyed by coordinate. `D1P1C0F1` means determinism
true, alternatives required, Consequence Argument denied, freedom affirmed. Each
cell is `named`, `empty`, or `contra`, and carries proponents and a gloss.

To extend it, add a proposition to `PROPS`, extend `keyOf` and the `BLOCKS` key
lists, and fill in the new cells. The consistency rules are enforced by the table,
not derived — if you add a premise, you decide by hand which combinations become
contradictions.

## A note on what it drops

The bottom of the page lists the compressions this map makes: freedom and moral
responsibility collapsed into one proposition, sourcehood given no proposition at
all, meta-level positions like revisionism and illusionism with no coordinate
anywhere, and a single unargued reading of "can" doing quiet work throughout.

That section is not an apology. A compression that doesn't declare its residue is
passing off a parse as a transcription. If you fork this for another debate, keep
the equivalent section — it is the part that makes the map arguable rather than
authoritative.

## Stack

Vite, React 18, no CSS framework. Styles live in a `<style>` tag inside the
component so it can be lifted into another project as a single file. Type is
Spectral for propositions and IBM Plex Mono for positions, loaded from Google
Fonts.
