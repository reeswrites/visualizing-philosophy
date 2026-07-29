import DATA from '../data.json'
import { buildLineage } from './lineage.js'
import { derive } from './derive.js'

/* The only module that knows where the data comes from. Everything under
   lib/ below this line is pure and takes its inputs as arguments. */

export const AXES = DATA.axes
export const STATES = DATA.states
export const EDGES = DATA.edges
export const N = DATA.rows.length

/* What shipped, so the UI can mark and revert every edit. */
export const ORIG = DATA.rows.map((r) => ({ ...r }))

export const idx = {}
ORIG.forEach((r, i) => {
  idx[r.id] = i
})

/* Statistics computed once, offline, over the unedited codings: perturbation
   survival, axis bootstrap support, and the coherent-but-empty cells. These do
   not recompute on edit, and the tables that use them say so. */
export const PRECOMPUTED = { perturb: DATA.perturb, support: DATA.support, gaps: DATA.gaps }

/* The influence graph never changes: editing a coding changes what a tradition
   assumes, never who it inherited from. Built once. */
export const lineage = buildLineage(ORIG, EDGES)

/* One mutable object rather than a scatter of module-level bindings, so every
   view reads the same state and reset cannot leave a stale copy behind. */
export const state = {
  rows: DATA.rows.map((r) => ({ ...r })),
  weights: Object.fromEntries(AXES.map((a) => [a, 1])),
  selected: null,
  layerOff: { lin: false, con: false, sch: false },
  filter: '',
}

export function resetState() {
  state.rows = ORIG.map((r) => ({ ...r }))
  AXES.forEach((a) => {
    state.weights[a] = 1
  })
}

export const compute = () =>
  derive({ rows: state.rows, edges: EDGES, axes: AXES, weights: state.weights, lineage })

export const nm = (id) => state.rows[idx[id]].name

export const isEdited = (i) => AXES.some((a) => state.rows[i][a] !== ORIG[i][a])
