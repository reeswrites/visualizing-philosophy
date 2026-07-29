/* The premise metric. Most axes are nominal — you either hold the same thing
   or you don't — but two are ordered, and treating them as nominal would throw
   away real structure. */

/* Ordered by how far concern reaches. `self` sits outside the order: an egoist
   is not a near neighbour of a role-network view, so any comparison against
   `self` is maximal rather than one step. */
const SCOPE = { role_network: 0, all_humans: 1, all_sentient: 2, biosphere: 3, cosmos: 4 }

const ASK = { none: 0, light: 1, heavy: 2 }

export function axisDist(ax, a, b) {
  if (ax === 'scope') {
    if (a === b) return 0
    if (a === 'self' || b === 'self') return 1
    return Math.abs(SCOPE[a] - SCOPE[b]) / 4
  }
  if (ax === 'askesis') return Math.abs(ASK[a] - ASK[b]) / 2
  return a === b ? 0 : 1
}

/* Pairwise weighted distance matrix, normalised by total weight so the
   threshold means the same thing however the axes are reweighted. */
export function premise(rows, axes, weights) {
  let tw = 0
  axes.forEach((a) => {
    tw += weights[a]
  })
  if (tw <= 0) tw = 1

  const m = rows.map(() => new Array(rows.length).fill(0))
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      let d = 0
      for (let k = 0; k < axes.length; k++) {
        d += weights[axes[k]] * axisDist(axes[k], rows[i][axes[k]], rows[j][axes[k]])
      }
      m[i][j] = m[j][i] = d / tw
    }
  }
  return m
}
