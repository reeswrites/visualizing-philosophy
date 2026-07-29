import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

/* positions.csv and lineage.csv are the source of truth for the codings;
   src/data.json is what the page loads. These tests exist to catch the two
   drifting apart, because nothing at runtime would notice. */

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
const DATA = JSON.parse(read('src/data.json'))

/* Minimal RFC-4180: quoted fields, doubled quotes inside them. Enough for
   these two files, and cheaper than a dependency. */
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (field !== '' || row.length) {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      }
      if (c === '\r' && text[i + 1] === '\n') i++
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }

  const head = rows.shift()
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

const positions = parseCSV(read('positions.csv'))
const lineage = parseCSV(read('lineage.csv'))

test('data.json rows match positions.csv field for field', () => {
  assert.equal(DATA.rows.length, positions.length)
  const cols = Object.keys(positions[0])
  DATA.rows.forEach((row, i) => {
    for (const c of cols) assert.equal(String(row[c]), positions[i][c], `row ${row.id}, ${c}`)
  })
})

test('data.json edges match lineage.csv field for field', () => {
  assert.equal(DATA.edges.length, lineage.length)
  const cols = Object.keys(lineage[0])
  DATA.edges.forEach((edge, i) => {
    for (const c of cols) assert.equal(String(edge[c]), lineage[i][c], `edge ${i}, ${c}`)
  })
})

test('every edge connects two traditions that exist', () => {
  const ids = new Set(DATA.rows.map((r) => r.id))
  for (const e of DATA.edges) {
    assert.ok(ids.has(e.from), `unknown edge source: ${e.from}`)
    assert.ok(ids.has(e.to), `unknown edge target: ${e.to}`)
    assert.notEqual(e.from, e.to)
  }
})

test('ids are unique', () => {
  const ids = DATA.rows.map((r) => r.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('every coding is a declared state, and every declared state is used', () => {
  for (const ax of DATA.axes) {
    const declared = new Set(DATA.states[ax])
    const used = new Set(DATA.rows.map((r) => r[ax]))
    for (const v of used) assert.ok(declared.has(v), `${ax}: "${v}" is not a declared state`)
    // An unused state would silently widen the editor's dropdowns.
    for (const v of declared) assert.ok(used.has(v), `${ax}: "${v}" is declared but unused`)
  }
})

test('the unsourced codings are labelled as such, both ways', () => {
  for (const r of DATA.rows) {
    assert.ok(r.sourced === 'yes' || r.sourced === 'no', `${r.id}: sourced="${r.sourced}"`)
    assert.ok(r.source.length > 0, `${r.id}: no source string at all`)
    const admits = r.source.startsWith('unverified in this build')
    assert.equal(
      admits,
      r.sourced === 'no',
      `${r.id}: sourced flag and source text disagree`,
    )
  }
  // The page's own claim, in the lede: half the codings are unsourced.
  const sourced = DATA.rows.filter((r) => r.sourced === 'yes').length
  assert.ok(
    sourced > DATA.rows.length * 0.3 && sourced < DATA.rows.length * 0.7,
    `"half the codings are unsourced" no longer holds: ${sourced}/${DATA.rows.length} sourced`,
  )
})

test('precomputed statistics reference traditions that still exist', () => {
  const ids = new Set(DATA.rows.map((r) => r.id))
  for (const key of Object.keys(DATA.perturb)) {
    for (const id of key.split('|')) assert.ok(ids.has(id), `perturb key names ${id}`)
  }
  for (const s of DATA.support) {
    for (const id of s.members) assert.ok(ids.has(id), `support cluster names ${id}`)
    assert.ok(s.pct >= 0 && s.pct <= 100)
  }
  for (const g of DATA.gaps) {
    for (const ax of DATA.axes) {
      assert.ok(DATA.states[ax].includes(g.code[ax]), `gap has invalid ${ax}: ${g.code[ax]}`)
    }
    assert.ok(g.neighbours >= 3)
  }
})

test('no coherent-but-unoccupied cell is actually occupied', () => {
  const held = new Set(DATA.rows.map((r) => DATA.axes.map((a) => r[a]).join('|')))
  for (const g of DATA.gaps) {
    const code = DATA.axes.map((a) => g.code[a]).join('|')
    assert.ok(!held.has(code), `listed as unoccupied but held: ${code}`)
  }
})
