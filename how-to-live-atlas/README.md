# How to live — a premise atlas

Forty-seven answers to how one should live, clustered by **what they assume** and
overlaid with **what they inherited**. Every coding is editable in the page: change
one, or reweight the axes, and the tree, the arcs and every statistic recompute
from your edit.

The point of the two layers is the gap between them. Clustering by premise puts
Advaita Vedanta next to Ibn Arabi's Sufism; the influence graph says nothing
connects them. That is either a real convergence or an artefact of seven coarse
axes, and the page is built to let you argue for the second.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output |
| `npm test` | Tests over the metric, the tree, and the data's integrity |

## The seven axes

| Axis | Question |
| --- | --- |
| `target` | Is the work on the self, the world, or both? |
| `good` | What is the good — pleasure, absence of suffering, virtue, union, something chosen? |
| `scope` | Whose good counts? |
| `authority` | What settles a disputed question — reason, revelation, tradition, practice, construction? |
| `askesis` | How much self-discipline does it demand? |
| `stance` | Does it describe the good life or prescribe a revision of it? |
| `ultimate` | What, if anything, lies beyond a good life? |

Two axes are **ordered** rather than nominal, and that is a substantive claim
each time. `askesis` runs none → light → heavy. `scope` runs role network →
all humans → all sentient → biosphere → cosmos, with `self` deliberately outside
the order: an egoist is not a near neighbour of a role-network view, so any
comparison against `self` is maximal. Change your mind about either and the
clustering changes — `src/lib/metric.js` is where.

## What the numbers mean

**Delta score** — over random quartets, how far the two competing quartet splits
are from being equally good. 0 means the distances fit a tree exactly; 1 means
maximally reticulate. At 0.32 this data is *not* very tree-like, which is the
most important caveat on the page: a tree is a lossy way to draw it.

**Convergence** — premise-close with no path through the influence graph at all.
Robustness is reported two ways. `jk` is axis-jackknife survival out of 7,
recomputed live. `pt` is survival under random perturbation of the soft codings,
computed once offline.

**Schism** — the same premise distance measured *along* an edge that does exist.
Descent preserves most premises even through a break, so the column reads
relatively, not absolutely.

**Support** — bootstrap over the axes. Nothing clears 70%: with seven characters,
no cluster here is strongly supported. This is printed rather than hidden.

## On the data

`positions.csv` and `lineage.csv` are the source of truth: 47 traditions, 49
edges. `src/data.json` is what the page loads, and `npm test` fails if the two
have drifted apart.

**Half the codings are unsourced** — 24 of 47 rows cite a located source; the rest
say `unverified in this build` in the row's own source line, and carry a `°` in
the tree. Three rows are low confidence and carry a `†`. Two codings are flagged
in their notes as forced fits: Kantian deontology is a theory of right rather
than of the good life, and Carvaka's hedonism may be a hostile caricature of a
school whose primary text is lost.

`analysis.txt` is the output of the original offline analysis pass. Three blocks
in `data.json` come from that pass and are **frozen**: `perturb`, `support` and
`gaps`. They were computed over the unedited codings and do not recompute when
you edit a row — the script that produced them is not in this repository. The
delta score, convergences, clades, schisms and jackknife all recompute live.

One figure to be aware of: `analysis.txt` records a delta of 0.312 where the page
computes 0.316. The page samples 16,000 quartets from a fixed seed, so its figure
is stable and reproducible but is a sample, not the exhaustive value.

## Layout

```
index.html            markup only
src/
  main.js             render loop, selection, controls
  style.css
  data.json           what the page loads; generated from the CSVs
  lib/
    model.js          the only module that touches the data
    metric.js         axis distances and the premise matrix
    lineage.js        the influence graph, hops and paths
    tree.js           UPGMA and leaf ordering
    derive.js         convergence, schism, delta score, jackknife
    permalink.js      edits and weights in the URL fragment
    export.js         CSV and SVG
  views/
    chart.js          the SVG
    tables.js
    editor.js
    compare.js
positions.csv         source of truth for the codings
lineage.csv           source of truth for the influence graph
analysis.txt          the original offline analysis pass
test/                 metric, tree and data-integrity tests
```

Everything under `src/lib/` except `model.js` is pure and takes its inputs as
arguments, which is why the tests can run the same code the page runs without a
browser.

## Contributing a correction

The unsourced rows are the ones worth attacking. To fix one:

1. Find a source. Prefer scholarly or the tradition's own institutional texts
   over devotional summaries.
2. Edit the row in `positions.csv` **and** `src/data.json`, setting `sourced` to
   `yes` and replacing the `unverified in this build` line with the citation.
3. `npm test` — it checks the two files still agree, that the flag and the source
   text agree, and that every coding is a declared state.

Corrections that break a convergence are the most valuable kind. Alternatively,
disagree in the page itself and send the share link: the URL carries your edits.
