/**
 * The client-side session store, exercised against a real IndexedDB
 * implementation (fake-indexeddb) rather than a hand-rolled mock, so the
 * transaction and index behaviour under test is the behaviour the browser
 * gives us.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'

import { contentionFromText, createLocalStore } from '../../client/js/store/local-store.js'

const USER = 'user-1'
const OTHER = 'user-2'

beforeEach(() => {
  // A fresh factory per test: IndexedDB is otherwise shared across the file.
  globalThis.indexedDB = new IDBFactory()
})

describe('createLocalStore over IndexedDB', () => {
  it('reports which backend it chose', async () => {
    const store = await createLocalStore()
    expect(store.backend).toBe('indexeddb')
  })

  it('creates sessions with numeric ids and the server record shape', async () => {
    const store = await createLocalStore()
    const id = await store.create(USER)

    expect(typeof id).toBe('number')

    const row = await store.get(id)
    expect(row).toMatchObject({ id, user_id: USER, nodes: [], messages: [] })
    // main.js parses these with `iso.replace(' ', 'T') + 'Z'`, so the SQLite
    // shape matters: "YYYY-MM-DD HH:MM:SS", no timezone suffix.
    expect(row.created_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  })

  it('hands out distinct ids', async () => {
    const store = await createLocalStore()
    const ids = [await store.create(USER), await store.create(USER), await store.create(USER)]
    expect(new Set(ids).size).toBe(3)
  })

  it('returns null for a session that does not exist', async () => {
    const store = await createLocalStore()
    expect(await store.get(9999)).toBeNull()
  })

  it('accepts a string id, since localStorage round-trips ids as strings', async () => {
    const store = await createLocalStore()
    const id = await store.create(USER)
    expect(await store.get(String(id))).toMatchObject({ id })
    expect(await store.update(String(id), [{ id: 'n0' }], [])).toBe(true)
  })

  it('saves nodes and messages, and reports a miss rather than creating one', async () => {
    const store = await createLocalStore()
    const id = await store.create(USER)
    const nodes = [{ id: 'n0', parentId: null, type: 'contention', text: 'Uniforms should be mandatory' }]
    const messages = [{ role: 'ai', text: 'What follows from that?' }]

    expect(await store.update(id, nodes, messages)).toBe(true)

    const row = await store.get(id)
    expect(row.nodes).toEqual(nodes)
    expect(row.messages).toEqual(messages)

    expect(await store.update(4242, nodes, messages)).toBe(false)
  })

  it('lists only the sessions belonging to a user', async () => {
    const store = await createLocalStore()
    const mine = await store.create(USER)
    await store.create(OTHER)

    const rows = await store.list(USER)
    expect(rows.map((r) => r.id)).toEqual([mine])
  })

  it('lists most recently updated first', async () => {
    // Driving the clock by hand rather than with fake timers: IndexedDB runs
    // its own callbacks on the timer queue, and freezing it deadlocks.
    let clock = '2026-01-01 10:00:00'
    const store = await createLocalStore({ now: () => clock })

    const first = await store.create(USER)
    clock = '2026-01-01 11:00:00'
    const second = await store.create(USER)

    expect((await store.list(USER)).map((r) => r.id)).toEqual([second, first])

    // Touching the older one moves it to the front.
    clock = '2026-01-01 12:00:00'
    await store.update(first, [], [])
    expect((await store.list(USER)).map((r) => r.id)).toEqual([first, second])
  })

  it('deletes', async () => {
    const store = await createLocalStore()
    const id = await store.create(USER)
    await store.remove(id)
    expect(await store.get(id)).toBeNull()
    expect(await store.list(USER)).toEqual([])
  })

  it('persists across store instances, which is what surviving a reload means', async () => {
    const first = await createLocalStore()
    const id = await first.create(USER)
    await first.update(id, [{ id: 'n0', type: 'contention', text: 'Kept' }], [])

    const second = await createLocalStore()
    const row = await second.get(id)
    expect(row.nodes[0].text).toBe('Kept')
  })
})

describe('the localStorage fallback', () => {
  beforeEach(() => {
    // Simulate a context with no IndexedDB at all.
    globalThis.indexedDB = undefined
    const backing = new Map()
    globalThis.localStorage = {
      getItem: (k) => (backing.has(k) ? backing.get(k) : null),
      setItem: (k, v) => backing.set(k, String(v)),
      removeItem: (k) => backing.delete(k),
    }
  })

  it('is chosen when IndexedDB is unavailable, and behaves the same', async () => {
    const store = await createLocalStore()
    expect(store.backend).toBe('localstorage')

    const id = await store.create(USER)
    expect(typeof id).toBe('number')
    await store.update(id, [{ id: 'n0', text: 'Fallback works' }], [])

    const row = await store.get(id)
    expect(row.nodes[0].text).toBe('Fallback works')
    expect(row.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    expect((await store.list(USER)).map((r) => r.id)).toEqual([id])
    expect(await store.list(OTHER)).toEqual([])

    await store.remove(id)
    expect(await store.get(id)).toBeNull()
  })

  it('survives a quota error on write without throwing', async () => {
    const store = await createLocalStore()
    globalThis.localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }
    await expect(store.create(USER)).resolves.toBeTypeOf('number')
  })

  it('recovers from a corrupted blob instead of failing every read', async () => {
    globalThis.localStorage.setItem('arg-mapper:sessions', '{not json')
    const store = await createLocalStore()
    expect(await store.list(USER)).toEqual([])
    await expect(store.create(USER)).resolves.toBeTypeOf('number')
  })
})

describe('contentionFromText', () => {
  it('takes the first non-empty line, matching the server stub', () => {
    expect(contentionFromText('\n\n  Uniforms should be mandatory  \nbecause…')).toBe(
      'Uniforms should be mandatory',
    )
  })

  it('falls back to a placeholder for text with no content', () => {
    expect(contentionFromText('\n   \n')).toBe('Untitled argument')
  })
})
