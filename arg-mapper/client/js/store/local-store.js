/**
 * Session storage in the browser, for running with no server at all.
 *
 * Mirrors the shape the Express + SQLite backend returns — including the
 * snake_case `created_at` / `updated_at` and the SQLite-style timestamp
 * format — so `session.js` can swap one for the other and nothing downstream
 * needs to know which is in use.
 *
 * IndexedDB rather than localStorage: an argument tree is unbounded, and
 * localStorage is a synchronous 5MB cliff that throws once you hit it.
 * localStorage is still the fallback for browsers or contexts (private modes,
 * some embedded webviews) where IndexedDB is unavailable.
 */

const DB_NAME = 'arg-mapper';
const DB_VERSION = 1;
const STORE = 'sessions';

/** SQLite's `datetime('now')` format, so `fmtDate` in main.js parses it unchanged. */
function systemNow() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        // autoIncrement keeps ids numeric, matching the SQLite rowids the
        // client already coerces with Number().
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    transaction.oncomplete = () => resolve(result?.__request ? result.__request.result : result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/** Wraps an IDBRequest so `tx` can resolve with its result after commit. */
const req = (request) => ({ __request: request });

function indexedDbStore(db, now) {
  return {
    async create(userId) {
      const stamp = now();
      const id = await tx(db, 'readwrite', (store) =>
        req(store.add({ user_id: userId, created_at: stamp, updated_at: stamp, nodes: [], messages: [] })),
      );
      return Number(id);
    },

    async get(id) {
      const row = await tx(db, 'readonly', (store) => req(store.get(Number(id))));
      return row ?? null;
    },

    async list(userId) {
      const rows = await tx(db, 'readonly', (store) => req(store.index('user_id').getAll(userId)));
      return rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    },

    async update(id, nodes, messages) {
      const key = Number(id);
      const existing = await tx(db, 'readonly', (store) => req(store.get(key)));
      if (!existing) return false;
      await tx(db, 'readwrite', (store) =>
        req(store.put({ ...existing, nodes, messages, updated_at: now() })),
      );
      return true;
    },

    async remove(id) {
      await tx(db, 'readwrite', (store) => req(store.delete(Number(id))));
      return true;
    },
  };
}

/**
 * Same interface over localStorage, for when IndexedDB is missing. One JSON
 * blob under one key; ids stay numeric and monotonic.
 */
function localStorageStore(now) {
  const KEY = 'arg-mapper:sessions';

  const read = () => {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const write = (rows) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(rows));
    } catch {
      // Out of quota: the in-memory copy for this page still works, and the
      // next write may succeed once something is deleted.
    }
  };

  return {
    async create(userId) {
      const rows = read();
      const stamp = now();
      const id = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
      rows.push({ id, user_id: userId, created_at: stamp, updated_at: stamp, nodes: [], messages: [] });
      write(rows);
      return id;
    },

    async get(id) {
      return read().find((r) => Number(r.id) === Number(id)) ?? null;
    },

    async list(userId) {
      return read()
        .filter((r) => r.user_id === userId)
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    },

    async update(id, nodes, messages) {
      const rows = read();
      const row = rows.find((r) => Number(r.id) === Number(id));
      if (!row) return false;
      Object.assign(row, { nodes, messages, updated_at: now() });
      write(rows);
      return true;
    },

    async remove(id) {
      write(read().filter((r) => Number(r.id) !== Number(id)));
      return true;
    },
  };
}

/**
 * The document-analysis stub, moved client-side unchanged: take the first
 * non-empty line as the contention. The server version does exactly this, so
 * nothing is lost by running it here.
 */
export function contentionFromText(text) {
  return (
    text
      .split('\n')
      .map((l) => l.trim())
      .find(Boolean) ?? 'Untitled argument'
  );
}

/**
 * @param {{ now?: () => string }} [options] - `now` is injectable so tests can
 *   order records deterministically; timestamps are second-resolution, and
 *   faking the timer queue would deadlock IndexedDB's own async scheduling.
 */
export async function createLocalStore({ now = systemNow } = {}) {
  try {
    const db = await openDB();
    return { ...indexedDbStore(db, now), backend: 'indexeddb' };
  } catch {
    return { ...localStorageStore(now), backend: 'localstorage' };
  }
}
