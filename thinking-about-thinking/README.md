# Thinking about thought

Two views on early reflection about the mind, built with Vite and deployed to GitHub Pages.

- **Timeline** (`/`) — a comparative chronology from 1900 BCE to 400 CE across Egypt, Mesopotamia, India, Greece, China and the Latin west. Every entry carries citations.
- **Cladogram** (`/cladogram.html`) — fifteen positions on the self, truth and consciousness, grouped by character state rather than historical descent, plus the character matrix the tree was built from.

Both views render an interactive SVG with hover and keyboard tooltips, and both keep a readable list of the same content below the diagram so nothing depends on hovering.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

| Script | Does |
| --- | --- |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run typecheck` | `tsc --noEmit`, not required for the build |

## Deploying

Deployment is handled at the repository root — `../.github/workflows/deploy.yml` builds every visualization on each push to `main` and publishes them together, so this one lands at `https://<user>.github.io/<repo>/thinking-about-thinking/`. See the [root README](../README.md) for the one-time Pages setup.

### The base path

The built site is served from a subdirectory, so absolute asset URLs would 404. `vite.config.ts` sets `base: './'`, which works at whatever path the site ends up on — locally, and under the repository and directory name on Pages. Set `VITE_BASE` to override, for example `VITE_BASE=/` with a custom domain plus a `CNAME` file in `public/`.

Links between the two pages are relative (`./` and `./cladogram.html`), so they work under any base.

## Editing the content

All content lives in `src/data/`. Nothing in `src/views/` needs touching to add material.

```
src/
├── data/
│   ├── events.ts     timeline lanes and events
│   ├── tree.ts       cladogram clades, character marks and tips
│   └── matrix.ts     character matrix rows, columns and symbols
├── lib/
│   ├── types.ts      shared types — read this first
│   └── ui.ts         SVG helpers, tooltip, citation rendering
├── styles/site.css   design tokens and layout
└── views/
    ├── timeline.ts   time scale, plot, entry cards
    └── cladogram.ts  tree layout, character legend, matrix
```

**Adding a timeline event.** Append to `events` in `src/data/events.ts`. `year` is negative for BCE and drives placement; `date` is the string readers see. Keep `label` under about 32 characters — it is drawn beside the point, and labels are packed into two rows per lane with a collision check, so a long one will push its neighbours around.

**Adding a cladogram tip.** Add a `tip(...)` call to the relevant `children` array in `src/data/tree.ts`. Layout is computed, so the tree re-spaces itself and the SVG grows. If you add a clade, give it the next `mark` number and add the matching line to the `characters` array.

**Adding a matrix column.** Add to `columns` in `src/data/matrix.ts` and add one cell to every row. Cells are `'yes' | 'no' | 'mixed'`.

**Colours** are per-lineage CSS custom properties in `src/styles/site.css`, defined for light and dark mode. Adding a lineage means adding the token, the `Lineage` union member in `src/lib/types.ts`, and a lane if it should appear on the timeline.

## A note on the sources

Links marked `primary` go to a translation or edition of the text; `background` links go to scholarly overviews, mostly the Stanford Encyclopedia of Philosophy. Three point at archive.org searches rather than a fixed edition, because no single stable open copy exists that is worth staking a citation on.

The URLs were checked when this was written. The scholarly consensus behind the dates was not — the Indian dates in particular are ranges disguised as points, and if you are using this for anything real they want checking against a specialist source. The caveats sections on both pages say more.

## Licence

Code is MIT. The prose is yours to do as you like with — but the arguments summarised in it belong to the scholars cited, so keep the citations attached.
