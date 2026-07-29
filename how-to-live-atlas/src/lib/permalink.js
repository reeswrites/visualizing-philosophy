import { AXES, ORIG, STATES, idx, state } from './model.js'

/* Edits and weights live in the fragment, so a disagreement with the codings
   is a link you can send rather than a screenshot. Only the diff is stored. */

export function writeHash() {
  const edits = {}
  state.rows.forEach((r, i) => {
    AXES.forEach((a) => {
      if (r[a] !== ORIG[i][a]) {
        edits[r.id] = edits[r.id] || {}
        edits[r.id][a] = r[a]
      }
    })
  })

  const weights = {}
  AXES.forEach((a) => {
    if (state.weights[a] !== 1) weights[a] = state.weights[a]
  })

  const payload = {}
  if (Object.keys(edits).length) payload.e = edits
  if (Object.keys(weights).length) payload.w = weights

  history.replaceState(
    null,
    '',
    Object.keys(payload).length
      ? `#${encodeURIComponent(JSON.stringify(payload))}`
      : location.pathname,
  )
}

/* Every value is checked against the known axes and states: a hand-edited link
   should fall back to the shipped codings, not render a broken tree. */
export function readHash() {
  if (!location.hash) return
  try {
    const p = JSON.parse(decodeURIComponent(location.hash.slice(1)))
    if (p.e) {
      Object.keys(p.e).forEach((id) => {
        if (idx[id] == null) return
        Object.keys(p.e[id]).forEach((a) => {
          if (AXES.indexOf(a) >= 0 && STATES[a].indexOf(p.e[id][a]) >= 0) {
            state.rows[idx[id]][a] = p.e[id][a]
          }
        })
      })
    }
    if (p.w) {
      Object.keys(p.w).forEach((a) => {
        if (AXES.indexOf(a) < 0) return
        const v = +p.w[a]
        if (v >= 0 && v <= 3) state.weights[a] = v
      })
    }
  } catch {
    /* malformed link: fall back to defaults */
  }
}
