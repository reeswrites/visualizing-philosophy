import { premise } from './metric.js'
import { INF } from './lineage.js'
import { leafOrder, upgma } from './tree.js'

/* Everything the page reads off the codings. Pure: give it rows, edges, axes,
   weights and a lineage graph, get back the tree and every statistic. */

/* Two traditions count as premise-close below this weighted distance. At 0.20
   over seven equally weighted axes, that is one full axis of disagreement. */
export const PREM_CLOSE = 0.2

/* Delta score: over random quartets, how far the two competing quartet splits
   are from being equally good. 0 means the distances fit a tree exactly, 1
   means maximally reticulate — the number that says whether drawing this as a
   tree is honest at all.

   Seeded deliberately: the figure is printed in the page, and a statistic that
   drifts on every reload cannot be quoted or argued with. */
export function deltaScore(m, samples) {
  const n = m.length
  let tot = 0
  let cnt = 0
  let seed = 11
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  for (let s = 0; s < samples; s++) {
    const p = []
    while (p.length < 4) {
      const v = Math.floor(rnd() * n)
      if (p.indexOf(v) < 0) p.push(v)
    }
    const q = [
      m[p[0]][p[1]] + m[p[2]][p[3]],
      m[p[0]][p[2]] + m[p[1]][p[3]],
      m[p[0]][p[3]] + m[p[1]][p[2]],
    ].sort((a, b) => b - a)
    if (q[0] - q[2] > 1e-12) {
      tot += (q[0] - q[1]) / (q[0] - q[2])
      cnt++
    }
  }
  return cnt ? tot / cnt : 0
}

/* Drop each axis in turn and record which convergences survive. A pair that
   only converges on all seven axes is an artefact of one coding decision. */
export function jackknife(rows, axes, weights, hops) {
  const res = {}
  axes.forEach((drop) => {
    const sub = axes.filter((a) => a !== drop)
    const m = premise(rows, sub, weights)
    const set = {}
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        if (m[i][j] <= PREM_CLOSE && hops[i][j] >= INF) set[`${rows[i].id}|${rows[j].id}`] = 1
      }
    }
    res[drop] = set
  })
  return res
}

/* Convergence is premise-close with no lineage path at all; a clade is
   premise-close within two hops, which is inheritance rather than agreement.
   Schisms are the same distance measured along an edge that does exist. */
export function derive({ rows, edges, axes, weights, lineage }) {
  const hops = lineage.hops
  const idx = indexOf(rows)
  const n = rows.length
  const m = premise(rows, axes, weights)
  const tree = upgma(m)
  const conv = []
  const clade = []

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (m[i][j] > PREM_CLOSE) continue
      if (hops[i][j] >= INF) conv.push([rows[i].id, rows[j].id, m[i][j]])
      else if (hops[i][j] <= 2) clade.push([rows[i].id, rows[j].id, m[i][j]])
    }
  }
  conv.sort((a, b) => a[2] - b[2])

  const sch = edges
    .map((e) => [e.from, e.to, m[idx[e.from]][idx[e.to]], e.type])
    .sort((a, b) => b[2] - a[2])

  let connected = 0
  let pairs = 0
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      pairs++
      if (hops[i][j] < INF) connected++
    }
  }

  return {
    m,
    tree,
    order: leafOrder(tree),
    conv,
    clade,
    sch,
    delta: deltaScore(m, 16000),
    conn: connected / pairs,
    jk: jackknife(rows, axes, weights, hops),
  }
}

function indexOf(rows) {
  const idx = {}
  rows.forEach((r, i) => {
    idx[r.id] = i
  })
  return idx
}
