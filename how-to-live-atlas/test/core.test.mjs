import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { axisDist, premise } from '../src/lib/metric.js'
import { INF, buildLineage } from '../src/lib/lineage.js'
import { leafOrder, upgma } from '../src/lib/tree.js'
import { PREM_CLOSE, derive } from '../src/lib/derive.js'

const DATA = JSON.parse(readFileSync(new URL('../src/data.json', import.meta.url), 'utf8'))
const { rows, edges, axes, states } = DATA
const equal = Object.fromEntries(axes.map((a) => [a, 1]))
const lineage = buildLineage(rows, edges)

test('axisDist is zero only for identical states, and symmetric', () => {
  for (const ax of axes) {
    for (const a of states[ax]) {
      assert.equal(axisDist(ax, a, a), 0)
      for (const b of states[ax]) {
        assert.equal(axisDist(ax, a, b), axisDist(ax, b, a))
        if (a !== b) assert.ok(axisDist(ax, a, b) > 0, `${ax}: ${a} vs ${b} collapsed to 0`)
        assert.ok(axisDist(ax, a, b) <= 1)
      }
    }
  }
})

test('scope treats self as maximally distant, not adjacent', () => {
  // The whole point of exempting `self` from the ordering: an egoist is not a
  // near neighbour of a role-network view.
  assert.equal(axisDist('scope', 'self', 'role_network'), 1)
  assert.equal(axisDist('scope', 'self', 'cosmos'), 1)
  assert.ok(axisDist('scope', 'role_network', 'all_humans') < 1)
})

test('premise matrix is symmetric, zero-diagonal and bounded', () => {
  const m = premise(rows, axes, equal)
  assert.equal(m.length, rows.length)
  for (let i = 0; i < rows.length; i++) {
    assert.equal(m[i][i], 0)
    for (let j = 0; j < rows.length; j++) {
      assert.equal(m[i][j], m[j][i])
      assert.ok(m[i][j] >= 0 && m[i][j] <= 1)
    }
  }
})

test('reweighting to a single axis reduces distance to that axis alone', () => {
  const only = { ...equal }
  axes.forEach((a) => {
    only[a] = a === 'askesis' ? 1 : 0
  })
  const m = premise(rows, axes, only)
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      assert.equal(m[i][j], axisDist('askesis', rows[i].askesis, rows[j].askesis))
    }
  }
})

test('zero total weight does not divide by zero', () => {
  const none = Object.fromEntries(axes.map((a) => [a, 0]))
  const m = premise(rows, axes, none)
  assert.ok(m.every((r) => r.every((v) => Number.isFinite(v) && v === 0)))
})

test('upgma joins every leaf exactly once, at non-decreasing heights', () => {
  const m = premise(rows, axes, equal)
  const t = upgma(m)
  const order = leafOrder(t)
  assert.equal(order.length, rows.length)
  assert.equal(new Set(order).size, rows.length)

  const internal = Object.values(t.nodes).filter((d) => !('leaf' in d))
  assert.equal(internal.length, rows.length - 1)
  const rootH = t.nodes[t.root].h
  for (const d of internal) assert.ok(d.h <= rootH + 1e-12)
})

test('lineage hops are symmetric and agree with the path length', () => {
  const idx = Object.fromEntries(rows.map((r, i) => [r.id, i]))
  for (const a of rows) {
    for (const b of rows) {
      assert.equal(lineage.hops[idx[a.id]][idx[b.id]], lineage.hops[idx[b.id]][idx[a.id]])
      const p = lineage.path(a.id, b.id)
      if (p === null) assert.equal(lineage.hops[idx[a.id]][idx[b.id]], INF)
      else assert.equal(p.length - 1, lineage.hops[idx[a.id]][idx[b.id]])
    }
  }
})

test('lineage paths run end to end through real edges', () => {
  const p = lineage.path('platonist', 'thomist')
  assert.equal(p[0], 'platonist')
  assert.equal(p[p.length - 1], 'thomist')
  const pairs = new Set(edges.flatMap((e) => [`${e.from}|${e.to}`, `${e.to}|${e.from}`]))
  for (let i = 0; i < p.length - 1; i++) assert.ok(pairs.has(`${p[i]}|${p[i + 1]}`))
})

test('derive separates convergence from inheritance', () => {
  const S = derive({ rows, edges, axes, weights: equal, lineage })
  const idx = Object.fromEntries(rows.map((r, i) => [r.id, i]))

  // A convergence must be premise-close with no path at all; a clade must be
  // premise-close with one. Nothing may appear in both.
  for (const [a, b, d] of S.conv) {
    assert.ok(d <= PREM_CLOSE)
    assert.equal(lineage.hops[idx[a]][idx[b]], INF)
  }
  for (const [a, b, d] of S.clade) {
    assert.ok(d <= PREM_CLOSE)
    assert.ok(lineage.hops[idx[a]][idx[b]] <= 2)
  }
  const conv = new Set(S.conv.map(([a, b]) => `${a}|${b}`))
  assert.ok(S.clade.every(([a, b]) => !conv.has(`${a}|${b}`)))

  assert.equal(S.sch.length, edges.length)
  assert.ok(S.delta > 0 && S.delta < 1)
  assert.ok(S.conn > 0 && S.conn < 1)
})

test('delta score is deterministic, so the printed figure is quotable', () => {
  const a = derive({ rows, edges, axes, weights: equal, lineage }).delta
  const b = derive({ rows, edges, axes, weights: equal, lineage }).delta
  assert.equal(a, b)
})

test('jackknife records survival for every axis', () => {
  const S = derive({ rows, edges, axes, weights: equal, lineage })
  assert.deepEqual(Object.keys(S.jk).sort(), [...axes].sort())
})
