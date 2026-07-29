import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../data.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    nodes TEXT NOT NULL DEFAULT '[]',
    messages TEXT NOT NULL DEFAULT '[]'
  )
`);

// Migration: add user_id to existing DBs that predate this column
try { db.exec(`ALTER TABLE sessions ADD COLUMN user_id TEXT`); } catch {}

const DEMO_NODES = [
  { id: "n0", parentId: null, type: "contention", text: "School uniforms should be mandatory" },
  { id: "n1", parentId: "n0", type: "premise", text: "Schools should reduce visible markers of inequality" },
  { id: "n1a", parentId: "n1", type: "premise", text: "Uniforms remove visible signals of family wealth", copremiseGroup: "cg-1" },
  { id: "n1b", parentId: "n1", type: "premise", text: "Schools are responsible for equal participation and dignity", copremiseGroup: "cg-1" },
  { id: "n2", parentId: "n0", type: "premise", text: "Attendance rates improve in schools with uniform policies" },
  { id: "n3", parentId: "n0", type: "premise", text: "Uniforms improve the learning environment" },
  { id: "n3a", parentId: "n3", type: "premise", text: "Students' clothing is a source of social comparison and anxiety", copremiseGroup: "cg-3" },
  { id: "n3b", parentId: "n3", type: "premise", text: "Reducing that anxiety measurably increases time-on-task", copremiseGroup: "cg-3" },
];

// Seed demo with user_id=NULL so it's never returned in user session lists
const isEmpty = db.prepare('SELECT COUNT(*) as c FROM sessions').get().c === 0;
if (isEmpty) {
  db.prepare(`INSERT INTO sessions (user_id, nodes, messages) VALUES (NULL, ?, '[]')`).run(JSON.stringify(DEMO_NODES));
}

export const Sessions = {
  listForUser: db.prepare(`SELECT id, created_at, updated_at, nodes FROM sessions WHERE user_id = ? ORDER BY updated_at DESC`),
  get: db.prepare(`SELECT * FROM sessions WHERE id = ?`),
  create: db.prepare(`INSERT INTO sessions (user_id, nodes, messages) VALUES (?, '[]', '[]')`),
  update: db.prepare(`UPDATE sessions SET nodes = ?, messages = ?, updated_at = datetime('now') WHERE id = ?`),
  delete: db.prepare(`DELETE FROM sessions WHERE id = ?`),
};
