import './style.css'
import { AXES, compute, resetState, state } from './lib/model.js'
import { readHash, writeHash } from './lib/permalink.js'
import { exportCSV, exportSVG } from './lib/export.js'
import { chartSVG, headerText } from './views/chart.js'
import {
  convergenceHTML,
  gapsHTML,
  schismHTML,
  statsHTML,
  supportHTML,
} from './views/tables.js'
import { closeEditor, openEditor } from './views/editor.js'
import { fillSelects, renderCompare } from './views/compare.js'

const el = (id) => document.getElementById(id)

/* The last computed derivation. Compare reads S.m, so it is held here rather
   than recomputed per view. */
let S = null

/* One render path for every kind of change — an edit, a reweighting, a filter.
   Cheap enough at 47 rows that partial updates would only add ways to drift. */
function render() {
  S = compute()

  el('chart').innerHTML = chartSVG(S)
  el('hdr').textContent = headerText(S)
  el('stats').innerHTML = statsHTML(S)
  el('t-con').innerHTML = convergenceHTML(S)
  el('t-sch').innerHTML = schismHTML(S)

  bindRows()
  if (state.selected) select(state.selected, true)
  renderCompare(S)
  writeHash()
}

function bindRows() {
  el('chart')
    .querySelectorAll('.row')
    .forEach((g) => {
      const id = g.getAttribute('data-id')
      const toggle = () => (state.selected === id ? clearSelection() : select(id))
      g.addEventListener('click', toggle)
      g.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          toggle()
        }
      })
    })
}

function clearSelection() {
  state.selected = null
  const svg = el('atlas')
  if (!svg) return
  svg.classList.remove('sel')
  svg.querySelectorAll('.on').forEach((n) => n.classList.remove('on'))
  closeEditor()
}

/* Selecting a row fades everything it has no relation to, then re-marks the
   rows at the far end of each of its arcs — the neighbourhood, not the row.
   `keep` re-applies a selection after a re-render without reopening the editor. */
function select(id, keep) {
  const svg = el('atlas')
  state.selected = id
  svg.querySelectorAll('.on').forEach((n) => n.classList.remove('on'))
  svg.classList.add('sel')

  const near = { [id]: 1 }
  svg.querySelectorAll('path[data-a]').forEach((p) => {
    const a = p.getAttribute('data-a')
    const b = p.getAttribute('data-b')
    if (a === id || b === id) {
      p.classList.add('on')
      near[a] = 1
      near[b] = 1
    }
  })
  svg.querySelectorAll('.row').forEach((r) => {
    if (near[r.getAttribute('data-id')]) r.classList.add('on')
  })

  if (!keep) {
    openEditor(id, render)
    el('cmpA').value = id
    renderCompare(S)
  }
}

/* Equal weighting was a silent choice in the original figure. Exposing it as
   sliders makes it an arguable one. */
function buildWeights() {
  const panel = el('weights')
  panel.innerHTML =
    AXES.map(
      (a) =>
        `<div class="wrow"><label for="w-${a}" style="display:block">${a}</label>` +
        `<input type="range" id="w-${a}" min="0" max="3" step="0.5" value="${state.weights[a]}"` +
        ` data-ax="${a}" aria-label="Weight for ${a}">` +
        `<span id="wv-${a}">${state.weights[a].toFixed(1)}</span></div>`,
    ).join('') +
    '<p class="path" style="margin-top:6px">All axes count equally by default. ' +
    'That was a silent choice; this makes it an arguable one.</p>'

  panel.querySelectorAll('input[type=range]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const a = slider.getAttribute('data-ax')
      state.weights[a] = +slider.value
      el(`wv-${a}`).textContent = state.weights[a].toFixed(1)
      render()
    })
  })
}

/* Layer toggles hide arcs in place rather than re-rendering: the tree must not
   move underneath you when you turn an overlay off. */
;['lin', 'con', 'sch'].forEach((key) => {
  el(`b-${key}`).addEventListener('click', function () {
    const on = this.getAttribute('aria-pressed') === 'true'
    this.setAttribute('aria-pressed', String(!on))
    state.layerOff[key] = on
    el(`L-${key}`).classList.toggle('off', on)
  })
})

el('b-clr').addEventListener('click', clearSelection)

el('b-rst').addEventListener('click', () => {
  resetState()
  buildWeights()
  clearSelection()
  render()
})

el('b-wt').addEventListener('click', function () {
  const on = this.getAttribute('aria-pressed') === 'true'
  this.setAttribute('aria-pressed', String(!on))
  el('weights').classList.toggle('hide', on)
})

el('filter').addEventListener('input', function () {
  state.filter = this.value.trim()
  render()
})

el('cmpA').addEventListener('change', () => renderCompare(S))
el('cmpB').addEventListener('change', () => renderCompare(S))
el('b-csv').addEventListener('click', exportCSV)
el('b-svg').addEventListener('click', exportSVG)

el('b-share').addEventListener('click', function () {
  const btn = this
  const done = (ok) => {
    btn.textContent = ok ? 'copied' : 'copy failed'
    setTimeout(() => {
      btn.textContent = 'copy share link'
    }, 1600)
  }
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(location.href).then(
      () => done(true),
      () => done(false),
    )
  } else {
    done(false)
  }
})

/* Written once: both are offline figures over the unedited codings. */
el('t-sup').innerHTML = supportHTML()
el('t-gap').innerHTML = gapsHTML()

readHash()
fillSelects()
buildWeights()
render()
