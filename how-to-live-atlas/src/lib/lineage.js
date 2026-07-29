/* Who read, taught or reacted to whom, as an undirected graph: the question the
   page asks is whether a line of transmission exists at all, not which way it
   ran. Pure — takes rows and edges, holds no module state — so the same code
   runs in the page and under the tests. */

/* Hop count for a pair with no path between them. Any value above the longest
   possible path works; every comparison only tests `>= INF`. */
export const INF = 99

export function buildLineage(rows, edges) {
  const idx = {}
  rows.forEach((r, i) => {
    idx[r.id] = i
  })

  const adj = {}
  rows.forEach((r) => {
    adj[r.id] = []
  })
  edges.forEach((e) => {
    if (adj[e.from] && adj[e.to]) {
      adj[e.from].push(e.to)
      adj[e.to].push(e.from)
    }
  })

  const hops = rows.map(() => new Array(rows.length).fill(INF))
  rows.forEach((s, si) => {
    const dist = { [s.id]: 0 }
    const q = [s.id]
    while (q.length) {
      const u = q.shift()
      adj[u].forEach((v) => {
        if (!(v in dist)) {
          dist[v] = dist[u] + 1
          q.push(v)
        }
      })
    }
    Object.keys(dist).forEach((t) => {
      hops[si][idx[t]] = dist[t]
    })
  })

  /* Shortest chain of influence between two traditions, or null if they share
     none. Breadth-first, so what comes back is a shortest path. */
  const path = (a, b) => {
    const par = { [a]: null }
    const q = [a]
    while (q.length) {
      const u = q.shift()
      if (u === b) break
      adj[u].forEach((v) => {
        if (!(v in par)) {
          par[v] = u
          q.push(v)
        }
      })
    }
    if (!(b in par)) return null

    const p = []
    let c = b
    while (c !== null) {
      p.unshift(c)
      c = par[c]
    }
    return p
  }

  return { adj, hops, path }
}
