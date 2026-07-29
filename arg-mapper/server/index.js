import express from 'express';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Sessions } from './db.js';
import { aiConfigured, streamChat } from './ai/provider.js';
import { nodesToOutline, buildUserPrompt, SOCRATIC_SYSTEM } from './ai/socratic.js';

// Load .env if it exists (Node 20.12+). Silent no-op on older Node or missing file.
try { process.loadEnvFile(); } catch {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT = join(__dirname, '../client');

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());
app.use(express.static(CLIENT));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/sessions', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'X-User-Id header required' });
  const rows = Sessions.listForUser.all(userId);
  res.json(rows.map(r => ({ ...r, nodes: JSON.parse(r.nodes) })));
});

app.post('/api/sessions', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'X-User-Id header required' });
  const { lastInsertRowid: id } = Sessions.create.run(userId);
  res.status(201).json({ id });
});

app.get('/api/sessions/:id', (req, res) => {
  const row = Sessions.get.get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, nodes: JSON.parse(row.nodes), messages: JSON.parse(row.messages) });
});

app.put('/api/sessions/:id', (req, res) => {
  const { nodes, messages } = req.body;
  if (!Array.isArray(nodes) || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'nodes and messages must be arrays' });
  }
  const result = Sessions.update.run(JSON.stringify(nodes), JSON.stringify(messages), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.delete('/api/sessions/:id', (req, res) => {
  Sessions.delete.run(req.params.id);
  res.json({ ok: true });
});

// Stub — replace body with real LLM call to extract full argument structure.
// Input: { text: string }
// Output: { id: number, nodes: Node[] }
app.post('/api/analyze-document', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(400).json({ error: 'X-User-Id header required' });
  const { text } = req.body;
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text required' });
  }
  const contention = text.split('\n').map(l => l.trim()).find(Boolean) ?? 'Untitled argument';
  const nodes = [{ id: 'n0', parentId: null, type: 'contention', text: contention }];
  const { lastInsertRowid: id } = Sessions.create.run(userId);
  Sessions.update.run(JSON.stringify(nodes), '[]', id);
  res.status(201).json({ id, nodes });
});

// POST /api/dialogue/stream — stream an AI-phrased Socratic question.
// Body: { intent, nodes, focusId, userInput, scriptedPrompt }
// Response: text/event-stream with data: {"delta":"…"} chunks, terminated by data: [DONE]
// Returns 503 when AI_API_KEY is not configured; client falls back to scripted prompt.
app.post('/api/dialogue/stream', async (req, res) => {
  if (!aiConfigured()) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  const { intent, nodes, focusId, userInput, scriptedPrompt } = req.body;
  if (!intent || !Array.isArray(nodes) || typeof userInput !== 'string') {
    return res.status(400).json({ error: 'intent, nodes, and userInput are required' });
  }

  const focusNode = nodes.find((n) => n.id === focusId);
  const focusText = focusNode?.text ?? '';
  const outline = nodesToOutline(nodes, focusId);
  const userPrompt = buildUserPrompt({ intent, focusText, outline, userInput, scriptedPrompt: scriptedPrompt ?? '' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const ac = new AbortController();
  req.on('close', () => ac.abort());

  try {
    for await (const delta of streamChat({
      system: SOCRATIC_SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
      signal: ac.signal,
    })) {
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (err) {
    if (err.name !== 'AbortError') {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    }
  } finally {
    res.end();
  }
});

app.get('*', (_req, res) => res.sendFile(join(CLIENT, 'index.html')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
