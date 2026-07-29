import { AXES, PRECOMPUTED, idx, nm, state } from '../lib/model.js'

export function statsHTML(S) {
  return (
    `delta score <b>${S.delta.toFixed(3)}</b> (0 = perfect tree, 1 = maximally reticulate) &middot; ` +
    `lineage-connected <b>${(100 * S.conn).toFixed(1)}%</b>` +
    `<br>convergences <b>${S.conv.length}</b> &middot; clades <b>${S.clade.length}</b> ` +
    `&middot; widest schism <b>${S.sch.length ? S.sch[0][2].toFixed(3) : '—'}</b>`
  )
}

/* Convergence rows carry their own robustness: jackknife survival recomputes
   live, perturbation survival is the frozen offline figure and is simply
   omitted for any pair the original pass never scored. */
export function convergenceHTML(S) {
  const rows = S.conv
    .map((c) => {
      const k1 = `${c[0]}|${c[1]}`
      const k2 = `${c[1]}|${c[0]}`
      let jkn = 0
      AXES.forEach((d) => {
        if (S.jk[d][k1] || S.jk[d][k2]) jkn++
      })
      const pt = PRECOMPUTED.perturb[k1] ?? PRECOMPUTED.perturb[k2] ?? null
      const low =
        state.rows[idx[c[0]]].confidence === 'low' || state.rows[idx[c[1]]].confidence === 'low'
      return (
        `<tr><td class="n">${c[2].toFixed(3)}</td>` +
        `<td class="r${jkn < AXES.length ? ' frail' : ''}">jk${jkn}/${AXES.length}` +
        `${pt != null ? ` pt${Math.round(pt)}%` : ''}</td>` +
        `<td${low ? ' class="frail"' : ''}>${nm(c[0])} ~ ${nm(c[1])}</td></tr>`
      )
    })
    .join('')
  return (
    '<tr><th>d</th><th>robust</th><th>pair</th></tr>' +
    (rows || '<tr><td colspan="3">none at this threshold</td></tr>')
  )
}

export function schismHTML(S) {
  return (
    '<tr><th>d</th><th>type</th><th>pair</th></tr>' +
    S.sch
      .slice(0, 8)
      .map(
        (c) =>
          `<tr><td class="n">${c[2].toFixed(3)}</td><td class="t">${c[3]}</td>` +
          `<td>${nm(c[0])} | ${nm(c[1])}</td></tr>`,
      )
      .join('')
  )
}

/* Support and gaps come from the offline pass over the unedited codings, so
   they are written once at boot and never re-rendered on edit. */
export function supportHTML() {
  return (
    '<tr><th>support</th><th>cluster</th></tr>' +
    PRECOMPUTED.support
      .slice(0, 8)
      .map(
        (s) =>
          `<tr><td class="n">${Math.round(s.pct)}%</td><td>${s.members.map(nm).join(', ')}</td></tr>`,
      )
      .join('')
  )
}

export function gapsHTML() {
  return PRECOMPUTED.gaps
    .slice(0, 6)
    .map(
      (g) =>
        `<li>${AXES.map((a) => g.code[a]).join(' / ')}` +
        ` &nbsp;<span style="color:var(--ink)">(${g.neighbours})</span></li>`,
    )
    .join('')
}
