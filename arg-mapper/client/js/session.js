let sessionId = null;
let saveTimer = null;

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

export async function initSession() {
  const stored = localStorage.getItem('sessionId');
  if (stored) {
    const res = await fetch(`/api/sessions/${stored}`, { headers: userHeaders() });
    if (res.ok) {
      sessionId = Number(stored);
      return await res.json();
    }
  }
  const res = await fetch('/api/sessions', { method: 'POST', headers: userHeaders() });
  const { id } = await res.json();
  sessionId = id;
  localStorage.setItem('sessionId', id);
  return null;
}

export function scheduleSave(nodes, messages) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(nodes, messages), 800);
}

async function save(nodes, messages) {
  if (!sessionId) return;
  await fetch(`/api/sessions/${sessionId}`, {
    method: 'PUT',
    headers: userHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ nodes, messages }),
  });
}

export function newSession() {
  localStorage.removeItem('sessionId');
  sessionId = null;
  return fetch('/api/sessions', { method: 'POST', headers: userHeaders() })
    .then(r => r.json())
    .then(({ id }) => {
      sessionId = id;
      localStorage.setItem('sessionId', id);
    });
}

export async function listSessions() {
  const res = await fetch('/api/sessions', { headers: userHeaders() });
  if (!res.ok) return [];
  return res.json();
}

export async function loadSession(id) {
  const res = await fetch(`/api/sessions/${id}`, { headers: userHeaders() });
  if (!res.ok) return null;
  sessionId = Number(id);
  localStorage.setItem('sessionId', id);
  return res.json();
}

/**
 * Stream an AI-phrased Socratic question from the server.
 * Calls onToken(delta) for each streamed text chunk.
 * Returns the full text, or null if AI is not configured (503) or an error occurs
 * (callers should fall back to the scripted prompt in that case).
 *
 * @param {{ intent: string, nodes: Array, focusId: string|null, userInput: string, scriptedPrompt: string }} opts
 * @param {(delta: string) => void} onToken
 * @returns {Promise<string|null>}
 */
export async function streamDialogue({ intent, nodes, focusId, userInput, scriptedPrompt }, onToken) {
  let res;
  try {
    res = await fetch('/api/dialogue/stream', {
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
  const res = await fetch('/api/analyze-document', {
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
