/**
 * The app was written to run inside an artifact runtime that provides an async
 * key-value store at `window.storage`. Outside that runtime — on GitHub Pages,
 * or `npm run dev` — nothing provides it, so this installs a compatible one
 * backed by localStorage.
 *
 * Deliberately API-identical so src/BeliefMart.jsx needs no changes and stays
 * runnable in both places. The `shared` flag is accepted and ignored: there is
 * no server here, so every visitor's data is their own.
 */

const PREFIX = "belief-mart:";

const memory = new Map(); // fallback for private browsing / disabled storage

function backend() {
  try {
    const probe = "__bm_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
      key: (i) => [...memory.keys()][i] ?? null,
      get length() {
        return memory.size;
      },
    };
  }
}

export function installStorageShim() {
  if (typeof window === "undefined" || window.storage) return;

  const store = backend();

  window.storage = {
    async get(key, shared = false) {
      const raw = store.getItem(PREFIX + key);
      return raw === null ? null : { key, value: raw, shared };
    },
    async set(key, value, shared = false) {
      store.setItem(PREFIX + key, String(value));
      return { key, value: String(value), shared };
    },
    async delete(key, shared = false) {
      store.removeItem(PREFIX + key);
      return { key, deleted: true, shared };
    },
    async list(prefix = "", shared = false) {
      const keys = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && k.startsWith(PREFIX + prefix)) keys.push(k.slice(PREFIX.length));
      }
      return { keys, prefix, shared };
    },
  };
}
