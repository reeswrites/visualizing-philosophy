import { AXES, EDGES, N, isEdited, state } from '../lib/model.js'

const MARK = {
  greek: '▲',
  chinese: '■',
  indian: '◆',
  abrahamic: '✦',
  academic: '●',
  secular: '○',
  african: '◼',
}

const DASH = { lin: '', linc: '3 2', con: '1.5 2.5', sch: '7 3' }

/* Layout. The tree occupies the left, labels the middle, and the arcs live in
   a gutter on the right so that inheritance never overdraws the clustering. */
const ROW = 21
const TOP = 34
const TREE_W = 104
const LABEL_X = 118
const LABEL_W = 204
const GUT_X = LABEL_X + LABEL_W
const GUT_W = 104
const WIDTH = GUT_X + GUT_W + 10

/* Returns the SVG as a string. Rendering stays free of event wiring so the
   caller can re-render on every edit and rebind once, in one place. */
export function chartSVG(S) {
  const H = TOP + N * ROW + 16
  const ypos = {}
  const parts = []

  S.order.forEach((leaf, i) => {
    ypos[state.rows[leaf].id] = TOP + i * ROW
  })

  let hmax = 0
  Object.keys(S.tree.nodes).forEach((k) => {
    const d = S.tree.nodes[k]
    if (!('leaf' in d)) hmax = Math.max(hmax, d.h)
  })
  if (hmax <= 0) hmax = 1

  /* Root at x=0, leaves at the right edge of the tree column: join height
     reads as premise distance. */
  const tx = (h) => TREE_W * (1 - h / hmax)

  const memo = {}
  const ycen = (id) => {
    if (id in memo) return memo[id]
    const d = S.tree.nodes[id]
    const v = 'leaf' in d ? ypos[state.rows[d.leaf].id] : (ycen(d.l) + ycen(d.r)) / 2
    memo[id] = v
    return v
  }

  parts.push(
    `<rect x="${GUT_X}" y="0" width="${GUT_W + 10}" height="${H}" fill="#CCD5DA"/>` +
      `<line x1="${GUT_X}" y1="0" x2="${GUT_X}" y2="${H}" stroke="#16232B" stroke-width=".6" opacity=".35"/>` +
      '<text x="0" y="16" class="eyebrow">premise tree</text>' +
      `<text x="${GUT_X + 6}" y="16" class="eyebrow">disagreement</text>`,
  )

  Object.keys(S.tree.nodes).forEach((k) => {
    const d = S.tree.nodes[k]
    if ('leaf' in d) return
    const xp = tx(d.h)
    const yl = ycen(d.l)
    const yr = ycen(d.r)
    const xl = 'leaf' in S.tree.nodes[d.l] ? TREE_W : tx(S.tree.nodes[d.l].h)
    const xr = 'leaf' in S.tree.nodes[d.r] ? TREE_W : tx(S.tree.nodes[d.r].h)
    parts.push(
      `<path d="M${xl.toFixed(1)},${yl.toFixed(1)} L${xp.toFixed(1)},${yl.toFixed(1)}` +
        ` L${xp.toFixed(1)},${yr.toFixed(1)} L${xr.toFixed(1)},${yr.toFixed(1)}"` +
        ' fill="none" stroke="#16232B" stroke-width="1" opacity=".72"/>',
    )
  })

  const ft = state.filter.toLowerCase()
  S.order.forEach((leaf) => {
    const r = state.rows[leaf]
    const y = ypos[r.id]
    const dim = ft && r.name.toLowerCase().indexOf(ft) < 0 && r.cluster.indexOf(ft) < 0
    parts.push(
      `<g class="row${isEdited(leaf) ? ' edited' : ''}${dim ? ' dim' : ''}" data-id="${r.id}"` +
        ` tabindex="0" role="button" aria-label="${r.name}. Open to edit codings.">` +
        `<rect class="rowhit" x="0" y="${y - ROW / 2}" width="${WIDTH}" height="${ROW}" fill="transparent"/>` +
        `<line x1="${TREE_W}" y1="${y}" x2="${LABEL_X - 5}" y2="${y}"` +
        ' stroke="#5E727D" stroke-width=".5" stroke-dasharray="1 2"/>' +
        `<text x="${LABEL_X}" y="${y + 3.5}" class="leaf"${r.confidence === 'low' ? ' opacity=".55"' : ''}>` +
        `<tspan class="mark">${MARK[r.cluster] || '○'}</tspan> ${r.name}` +
        (r.confidence === 'low' ? '<tspan class="flag"> †</tspan>' : '') +
        (r.sourced === 'no' ? '<tspan class="unsrc"> °</tspan>' : '') +
        '</text></g>',
    )
  })

  /* Arcs bulge with the vertical span they cross, capped so a full-height arc
     stays inside the gutter. */
  const arc = (a, b, cls, w, dash) => {
    const ya = ypos[a]
    const yb = ypos[b]
    const bulge = Math.min(GUT_W - 14, 16 + Math.abs(yb - ya) * 0.3)
    const x0 = GUT_X + 5
    return (
      `<path class="${cls}" data-a="${a}" data-b="${b}" d="M${x0},${ya.toFixed(1)}` +
      ` C${(x0 + bulge).toFixed(1)},${ya.toFixed(1)} ${(x0 + bulge).toFixed(1)},${yb.toFixed(1)}` +
      ` ${x0},${yb.toFixed(1)}" fill="none" stroke-width="${w}"` +
      (dash ? ` stroke-dasharray="${dash}"` : '') +
      ' vector-effect="non-scaling-stroke"/>'
    )
  }

  const layer = (key, arcs) =>
    `<g id="L-${key}"${state.layerOff[key] ? ' class="off"' : ''}>${arcs.join('')}</g>`

  parts.push(
    layer(
      'lin',
      EDGES.map((e) =>
        arc(e.from, e.to, 'lin', 0.9, e.confidence === 'contested' ? DASH.linc : DASH.lin),
      ),
    ),
  )
  parts.push(
    layer(
      'con',
      S.conv.map((c) => arc(c[0], c[1], 'con', 1.2, DASH.con)),
    ),
  )
  parts.push(
    layer(
      'sch',
      S.sch.slice(0, 5).map((c) => arc(c[0], c[1], 'sch', 1.7, DASH.sch)),
    ),
  )

  return (
    `<svg id="atlas" viewBox="0 0 ${WIDTH} ${H}" width="100%" preserveAspectRatio="xMidYMin meet"` +
    ` aria-label="Premise tree of ${N} traditions with lineage overlays">${parts.join('')}</svg>`
  )
}

export function headerText(S) {
  const nEdit = state.rows.filter((_, i) => isEdited(i)).length
  const nSrc = state.rows.filter((r) => r.sourced === 'yes').length
  const nWt = AXES.filter((a) => state.weights[a] !== 1).length
  return (
    `${N} traditions · ${AXES.length} axes · ${EDGES.length} edges · ${nSrc}/${N} sourced` +
    (nEdit ? ` · ${nEdit} edited` : '') +
    (nWt ? ` · ${nWt} reweighted` : '')
  )
}
