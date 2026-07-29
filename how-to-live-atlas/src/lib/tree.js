/* UPGMA: repeatedly join the closest pair, averaging their distances to
   everything else by cluster size. Chosen over neighbour-joining because the
   height of a join is readable as a premise distance, which is the point of
   drawing it. */

export function upgma(m) {
  const n = m.length
  const size = {}
  const nodes = {}
  const Dm = {}
  let act = []
  let next = n

  for (let i = 0; i < n; i++) {
    act.push(i)
    size[i] = 1
    nodes[i] = { leaf: i, h: 0 }
    Dm[i] = {}
    for (let j = 0; j < n; j++) Dm[i][j] = m[i][j]
  }

  while (act.length > 1) {
    let best = Infinity
    let bi = 0
    let bj = 1
    for (let a = 0; a < act.length; a++) {
      for (let b = a + 1; b < act.length; b++) {
        const d = Dm[act[a]][act[b]]
        if (d < best) {
          best = d
          bi = a
          bj = b
        }
      }
    }

    const x = act[bi]
    const y = act[bj]
    const id = next++
    nodes[id] = { l: x, r: y, h: best }
    Dm[id] = {}
    act.forEach((z) => {
      if (z === x || z === y) return
      const v = (Dm[x][z] * size[x] + Dm[y][z] * size[y]) / (size[x] + size[y])
      Dm[id][z] = v
      Dm[z][id] = v
    })
    Dm[id][id] = 0
    size[id] = size[x] + size[y]
    act = act.filter((z) => z !== x && z !== y)
    act.push(id)
  }

  return { nodes, root: act[0] }
}

/* Leaves in drawing order, left to right down the page. */
export function leafOrder(t) {
  const o = []
  const walk = (id) => {
    const d = t.nodes[id]
    if ('leaf' in d) {
      o.push(d.leaf)
      return
    }
    walk(d.l)
    walk(d.r)
  }
  walk(t.root)
  return o
}
