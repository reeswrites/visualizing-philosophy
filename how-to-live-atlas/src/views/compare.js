import { AXES, idx, lineage, nm, state } from '../lib/model.js'
import { axisDist } from '../lib/metric.js'

export function fillSelects(a = 'stoic', b = 'theravada') {
  const opts = state.rows
    .slice()
    .sort((x, y) => (x.name < y.name ? -1 : 1))
    .map((r) => `<option value="${r.id}">${r.name}</option>`)
    .join('')
  const cmpA = document.getElementById('cmpA')
  const cmpB = document.getElementById('cmpB')
  cmpA.innerHTML = `<option value="">—</option>${opts}`
  cmpB.innerHTML = `<option value="">—</option>${opts}`
  cmpA.value = a
  cmpB.value = b
}

/* Axis-by-axis, then the lineage question the axes cannot answer: did these two
   ever touch? Agreement with no path is the convergence claim in miniature. */
export function renderCompare(S) {
  const a = document.getElementById('cmpA').value
  const b = document.getElementById('cmpB').value
  const table = document.getElementById('t-cmp')
  const path = document.getElementById('cmp-path')

  if (!a || !b || a === b) {
    table.innerHTML = '<tr><td>Pick two different traditions.</td></tr>'
    path.textContent = ''
    return
  }

  const ra = state.rows[idx[a]]
  const rb = state.rows[idx[b]]
  let agree = 0

  table.innerHTML =
    `<tr><th>axis</th><th>${ra.name}</th><th>${rb.name}</th><th>d</th></tr>` +
    AXES.map((ax) => {
      const d = axisDist(ax, ra[ax], rb[ax])
      if (d === 0) agree++
      const cls = d ? 'split' : 'agree'
      return (
        `<tr><td class="t">${ax}</td><td class="${cls}">${ra[ax]}</td>` +
        `<td class="${cls}">${rb[ax]}</td><td class="n">${d ? d.toFixed(2) : '—'}</td></tr>`
      )
    }).join('') +
    `<tr><td class="t">weighted</td><td colspan="2">${agree} of ${AXES.length} axes agree</td>` +
    `<td class="n">${S.m[idx[a]][idx[b]].toFixed(3)}</td></tr>`

  const p = lineage.path(a, b)
  path.innerHTML = p
    ? `lineage path (${p.length - 1} hops): ${p.map(nm).join(' → ')}`
    : 'no lineage path — these two share no documented line of influence.'
}
