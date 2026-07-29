# Belief Mart

A shop where you assemble a religion out of its parts, then find out what you built.

Nine aisles of beliefs — what's in charge, what's wrong with us, what happens after, how you
get right, where truth comes from, what you actually do, how to be good, time and the
universe, who it's for, and everyone who isn't in. Put them in a bag. Check out. You get a
receipt naming your religion, its closest existing match, where you part ways with it, and
what it holds that you left on the shelf.

One of the visualizations in this repository; it deploys to
`https://<user>.github.io/<repo>/belief-mart/`

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 141 tests, no network needed
npm run build    # → dist/
```

## Deploying

Deployment is handled at the repository root — `../.github/workflows/deploy.yml` builds every
visualization on each push to `main` and publishes them together. See the [root
README](../README.md) for the one-time Pages setup.

The build here is gated on `npm test`, so a bad data edit fails CI rather than shipping.
`vite.config.js` uses a relative base, so it works under any repository name and at any
subpath without configuration.

---

## Layout

```
src/
  BeliefMart.jsx      the whole app — data, scoring, UI, in that order
  storage-shim.js     localStorage stand-in for the artifact runtime's window.storage
  main.jsx            entry point
test/
  belief-mart.test.mjs   127 tests over the data and scoring
  storage-shim.test.mjs   14 tests over the shim
HANDOFF.md            brief for continuing the data-verification work
```

`BeliefMart.jsx` is deliberately one file. It was written to run as a Claude artifact and
still does, unmodified — `storage-shim.js` installs an API-identical `window.storage` so the
same source works in both places.

---

## How the scoring works

**Rarity weighting.** Every belief is weighted by how many of the 22 traditions hold it.
"Compassion matters" is held nearly everywhere and tells us almost nothing about you; "harm
nothing that lives, insects included" is held by one. Rare picks count up to 5× more.

**Specificity.** Weighting alone isn't enough — a bag of eight widely-shared beliefs can still
match something at 79%. So the receipt reports how discriminating your bag actually is, and
says outright when a match is "a shrug with a number on it".

**Coverage.** Silence is not penalised, which means a tradition with few recorded positions
can top the chart by never disagreeing with you. Measured: the top match is silent on most of
the bag in **23% of random baskets**. Rather than hide that behind a tuned penalty — the
silence is partly missing data, not genuine reticence — the receipt states how many of your
picks the match actually has a position on.

**Tensions.** Beliefs that pull against each other get flagged rather than blocked. Every
tradition on the receipt carries contradictions it has argued about for centuries.

---

## On the data

The shelves take **912 explicit positions** on who believes what. **164 have been checked
against sources.** The rest is one model's unsourced first pass.

That matters, because of the ones checked so far, **23% needed a tag changed or added**. The
errors were not random:

- Evangelical Protestantism: 10 checks, 0 corrections
- Catholic & Orthodox: 10 checks, 1 correction
- Everything else: ~25%

The error rate tracks how well-documented a tradition is in English. The wrong tags clustered
in Jain liberation, Zoroastrian eschatology, Shinto purity, bhakti metaphysics and Bahá'í
institutions. So the unchecked remainder is probably *worse* than 23% wrong, since the
well-covered traditions are disproportionately done.

Verified claims are recorded in a `CHECKED` registry with a note saying what the source
actually said. Tradition pages show a ✓ on checked positions and a running count. Nine
traditions carry a `caveat` explaining where the entry is structurally compromised — animism
is an outsider's category with a colonial history, Catholic and Orthodox share an entry,
Hinduism is split only two ways.

**If you're continuing this work, read [HANDOFF.md](./HANDOFF.md).** It has the method that
works, the pitfalls that have already cost time, and where the remaining errors most likely
are.

---

## Contributing a correction

1. Find a source. Prefer scholarly, encyclopedic, or the tradition's own institutional texts
   over devotional summaries.
2. Change the tag in `src/BeliefMart.jsx`.
3. Add a `CHECKED` entry keyed `beliefId:traditionId` saying **what the source states** — the
   tests reject notes that only assert that you looked.
4. `npm test`.

Corrections that make the data less flattering to any tradition, including by adding a
position it holds that nobody wants to hear, are the most valuable kind.

---

## Licence

MIT.
