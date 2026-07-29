import { contentionFromText, createLocalStore } from './store/local-store.js';

/**
 * Sessions, over whichever backend is available.
 *
 * Served by the Express app, sessions go to SQLite and the AI Guide works.
 * Opened as static files with no server behind them, sessions go to
 * IndexedDB and the Guide falls back to its scripted prompts — which the
 * dialogue state machine already provides for every step, so nothing about
 * the reasoning flow depends on the network.
 *
 * The backend is decided once, at init, by probing /api/health.
 */

let sessionId = null;
let saveTimer = null;
let backend = null;
let localStore = null;
/** In-flight probe, so concurrent first callers share one request. */
let detecting = null;

function getOrCreateUserId() {
  let id = localStorage.getItem('userId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('userId', id);
  }
  return id;
}

const userId = getOrCreateUserId();

function userHeaders(extra = {}) {
  return { 'X-User-Id': userId, ...extra };
}

/** True once we know a server is answering. Callers use it for UI copy. */
export function hasServer() {
  return backend === 'server';
}

export function storageLabel() {
  if (backend === 'server') return 'server';
  return localStore?.backend === 'localstorage' ? 'this browser (localStorage)' : 'this browser (IndexedDB)';
}

function detectBackend() {
  if (backend) return Promise.resolve(backend);
  detecting ??= probeBackend();
  return detecting;
}

async function probeBackend() {
  try {
    // A short timeout matters for the static case: file:// and Pages both
    // answer fast (a failed fetch or a 404), but a hung request would
    // otherwise stall the first paint.
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 1500);
    const res = await fetch('./api/health', { headers: userHeaders(), signal: ac.signal });
    clearTimeout(timer);
    const body = res.ok ? await res.json().catch(() => null) : null;
    backend = body?.ok ? 'server' : 'local';
  } catch {
    backend = 'local';
  }
  if (backend === 'local') localStore = await createLocalStore();
  return backend;
}

export async function initSession() {
  await detectBackend();

  const stored = localStorage.getItem('sessionId');
  if (stored) {
    const existing = await readSession(stored);
    if (existing) {
      sessionId = Number(stored);
      return existing;
    }
  }

  sessionId = await makeSession();
  localStorage.setItem('sessionId', String(sessionId));
  return null;
}

async function readSession(id) {
  if (backend === 'server') {
    const res = await fetch(`./api/sessions/${id}`, { headers: userHeaders() });
    return res.ok ? res.json() : null;
  }
  return localStore.get(id);
}

async function makeSession() {
  if (backend === 'server') {
    const res = await fetch('./api/sessions', { method: 'POST', headers: userHeaders() });
    const { id } = await res.json();
    return id;
  }
  return localStore.create(userId);
}

export function scheduleSave(nodes, messages) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(nodes, messages), 800);
}

async function save(nodes, messages) {
  if (!sessionId) return;
  if (backend === 'server') {
    await fetch(`./api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ nodes, messages }),
    });
    return;
  }
  await localStore.update(sessionId, nodes, messages);
}

export async function newSession() {
  localStorage.removeItem('sessionId');
  sessionId = null;
  await detectBackend();
  sessionId = await makeSession();
  localStorage.setItem('sessionId', String(sessionId));
}

export async function listSessions() {
  await detectBackend();
  if (backend === 'server') {
    const res = await fetch('./api/sessions', { headers: userHeaders() });
    return res.ok ? res.json() : [];
  }
  return localStore.list(userId);
}

export async function loadSession(id) {
  const data = await readSession(id);
  if (!data) return null;
  sessionId = Number(id);
  localStorage.setItem('sessionId', String(id));
  return data;
}

/**
 * Stream an AI-phrased Socratic question from the server.
 * Calls onToken(delta) for each streamed text chunk.
 * Returns the full text, or null when there is no server, the AI is not
 * configured (503), or an error occurs — callers fall back to the scripted
 * prompt in every one of those cases.
 *
 * @param {{ intent: string, nodes: Array, focusId: string|null, userInput: string, scriptedPrompt: string }} opts
 * @param {(delta: string) => void} onToken
 * @returns {Promise<string|null>}
 */
export async function streamDialogue({ intent, nodes, focusId, userInput, scriptedPrompt }, onToken) {
  if (backend !== 'server') return null;

  let res;
  try {
    res = await fetch('./api/dialogue/stream', {
      method: 'POST',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ intent, nodes, focusId, userInput, scriptedPrompt }),
    });
  } catch {
    return null;
  }

  if (res.status === 503 || !res.ok) return null;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') return fullText || null;
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) return null;
          if (parsed.delta) {
            fullText += parsed.delta;
            onToken(parsed.delta);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullText || null;
}

export async function analyzeDocument(text) {
  await detectBackend();

  if (backend === 'server') {
    const res = await fetch('./api/analyze-document', {
      method: 'POST',
      headers: userHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();
    sessionId = data.id;
    localStorage.setItem('sessionId', String(data.id));
    return data;
  }

  if (typeof text !== 'string' || !text.trim()) throw new Error('Analysis failed');

  const nodes = [{ id: 'n0', parentId: null, type: 'contention', text: contentionFromText(text) }];
  const id = await localStore.create(userId);
  await localStore.update(id, nodes, []);
  sessionId = id;
  localStorage.setItem('sessionId', String(id));
  return { id, nodes };
}
