# Architecture review — in progress

Run `/improve-codebase-architecture` to resume. This file is a checkpoint.

## Candidates (from the grilling session)

| # | Name | Strength |
|---|------|----------|
| A | Introduce an Argument-Tree module | **Strong** — chosen for grilling |
| B | Pull node-selection into tree-utils | Worth exploring |
| C | Delete the dead AI skeleton (`stepAI`, `initSession`) | Worth exploring |
| D | One SSE-decoding adapter | Speculative |
| E | Advance-dialogue interface | Worth exploring |

Full visual report: `/tmp/claude-501/architecture-review-20260531.html` (ephemeral — regenerate with the skill).

---

## Candidate A — grilling in progress

**The problem:** Tree mutation is smeared across four call sites.
- `dialogue.js` pushes nodes via `step(userInput, nodes)` and owns `idCounter`
- `main.js` filters-to-delete (line 100), edits text inline (line 53)
- `server/index.js` mints nodes in the `analyze-document` stub
- `graph.js` calls `getSubtree` for thread indicators

**The deepening:** One `ArgumentTree` module owns `nodes` and all operations (`addNode`, `editText`, `deleteSubtree`, `outline`, `visibleFor`). Id-gen, parentId integrity, subtree math all move inside.

### Open questions at the end of the session

**Branch 1 — Ownership shape:**
Two options on the table:
- **Option 1 (passed in):** `step(userInput, tree)` — dialogue receives the tree, calls `tree.addNode(…)`, returns `{ prompt, focusDone }`. Tree is an external dependency.
- **Option 2 (internal):** `dialogue.step(userInput)` — dialogue holds a reference to the tree internally; caller never passes it.

**Branch 2 — Module vs class:**
- **Class** (`new ArgumentTree()`) — easy to instantiate fresh for tests, natural reset-between-sessions.
- **Module with exported functions** — matches existing codebase style (`dialogue.js`, `session.js`), but requires an explicit `reset()` and global state, which complicates testing.

**Next grill questions to ask:**
1. Option 1 or 2 for ownership — does the session boundary (home → new session → `startFresh()`) feel cleaner if the tree is passed around, or internal?
2. Class or module?
3. Does `visibleFor(focusId)` belong on the tree, or stay in `tree-utils` / `graph.js`?
4. Does `computeLayout` move inside the tree (hiding it from graph), or stay at `tree-utils` as a pure layout utility?
5. What happens to the `dialogue.js` state machine state (`pendingPremiseId`, `copremiseGroup`, `focusId`) — does any of it migrate into the tree, or does dialogue own all conversational state and the tree owns only structural state?
