// AI provider seam — all provider specifics live here.
// To switch providers: change AI_BASE_URL + AI_API_KEY + AI_MODEL env vars.
// The endpoint must be OpenAI-compatible (/chat/completions with SSE stream).
// Works with OpenRouter (default), OpenAI, Groq, Together, Fireworks, etc.

const BASE_URL = process.env.AI_BASE_URL ?? 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = process.env.AI_MODEL ?? 'anthropic/claude-3.5-haiku';

/** True when an API key is set and AI calls can be made. */
export function aiConfigured() {
  return Boolean(process.env.AI_API_KEY);
}

/**
 * Stream a chat completion, yielding text deltas as they arrive.
 * Uses raw fetch + SSE parsing against the OpenAI-compatible wire format.
 *
 * @param {object}   opts
 * @param {string}   opts.system   — system prompt
 * @param {Array}    opts.messages — [{role, content}, ...]
 * @param {AbortSignal} [opts.signal] — to cancel on client disconnect
 * @yields {string} text delta
 */
export async function* streamChat({ system, messages, signal }) {
  if (!aiConfigured()) throw new Error('AI_API_KEY not set');

  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      // OpenRouter-recommended; harmless against other providers
      'HTTP-Referer': 'https://arg-mapper.app',
      'X-Title': 'Argument Mapper',
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
