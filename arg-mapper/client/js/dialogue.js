// Focus-aware dialogue state machine.
// `focusId` / `focusText` track which claim the conversation is currently building support for.
// Call setFocus() to redirect to any node in the tree.
//
// AI mode: when enabled, stepAI() is called instead of step().
// stepAI() is a skeleton — replace the stub with real LLM calls in a future session.

let state = "contention";
let aiMode = false;
let focusId = null;
let focusText = "";
let pendingPremiseId = null;
let pendingObjId = null;
let copremiseGroup = null;
let idCounter = 0;

const PROMPTS = {
  contention: "What is the argument you're trying to make? State your main conclusion.",
  premise: (t) => `Why do you believe "${shorten(t)}"? Give one reason.`,
  copremise_ask:
    "Does that reason need another claim alongside it to work, or does it stand on its own?",
  copremise_add: "What is the other claim that must also be true?",
  objection_ask: 'What would someone who disagrees say? (Type "skip" to move on.)',
  objection_add: "How would you respond to that objection?",
  more_premises: (t) =>
    `Any other independent reason to believe "${shorten(t)}"? (Type "done" to finish.)`,
};

export function setAiMode(enabled) {
  aiMode = enabled;
}
export function getAiMode() {
  return aiMode;
}

export function getInitialPrompt() {
  return PROMPTS.contention;
}

// ── AI mode skeleton ──────────────────────────────────────────────────────────
// Replace the stub body with real LLM calls when implementing AI mode.
//
// What the AI layer should do (per BRIEF.md):
//   - Ask the next Socratic question in context (not a scripted string)
//   - Detect when user offers a lone premise and flag the Golden Rule:
//       "Every argument needs at least two co-premises — what else must be true?"
//   - Surface hidden assumptions:
//       "You seem to be assuming X — do you want to make that explicit?"
//   - Flag logical fallacies inline:
//       "This might be an appeal to authority. What evidence supports it?"
//   - Generate a counter-argument on demand to stress-test reasoning
//   - Vary phrasing so repeated steps don't feel formulaic
//   - Scaffold the rebuttal step especially heavily (weakest layer per research)
//
// Inputs needed for the LLM call:
//   - Full argument tree (nodes) serialised as a readable outline
//   - Current focusId and focusText (what claim we are building support for)
//   - Current state machine state (what step we are on)
//   - User input (what the student just said)
//   - System prompt defining the Socratic guide persona (age 10–14, never lectures)
//
// Return shape mirrors step(): { nodes, prompt, focusDone? }
//
export async function stepAI(userInput, nodes) {
  // TODO: replace with LLM call
  //
  // const outline = nodesToOutline(nodes);   // serialise tree for context
  // const response = await callLLM({
  //   system: SOCRATIC_SYSTEM_PROMPT,
  //   messages: [{ role: 'user', content: buildPrompt(userInput, outline, state, focusText) }],
  // });
  // return parseLLMResponse(response, nodes, state);

  // Stub: fall back to scripted step so the UI still works while AI is unimplemented
  return step(userInput, nodes);
}

// Redirect dialogue to build support for a different node.
// Returns the opening prompt to display.
export function setFocus(nodeId, nodeText) {
  focusId = nodeId;
  focusText = nodeText;
  state = "premise";
  pendingPremiseId = null;
  pendingObjId = null;
  copremiseGroup = null;
  return PROMPTS.premise(nodeText);
}

export function getFocusId() {
  return focusId;
}

/** Returns the current state label before the next step() call. */
export function getState() {
  return state;
}

export function step(userInput, nodes) {
  const text = userInput.trim();
  if (!text) return null;

  switch (state) {
    case "contention": {
      const id = nextId();
      nodes.push({ id, parentId: null, type: "contention", text });
      // Auto-focus the contention so subsequent steps hang off it
      focusId = id;
      focusText = text;
      state = "premise";
      return { nodes, prompt: PROMPTS.premise(text) };
    }

    case "premise": {
      const id = nextId();
      pendingPremiseId = id;
      copremiseGroup = null;
      nodes.push({ id, parentId: focusId, type: "premise", text });
      state = "copremise_ask";
      return { nodes, prompt: PROMPTS.copremise_ask };
    }

    case "copremise_ask": {
      const lo = text.toLowerCase();
      // Detect negation first — "no, it doesn't need another" should NOT trigger co-premise
      const isNegation = /\bno\b|n't\b|\bnot\b|\balone\b|\bindependent(ly)?\b/.test(lo);
      const needsCopremise =
        !isNegation &&
        (lo.includes("yes") ||
          lo.includes("together") ||
          lo.includes("alongside") ||
          lo.includes("need") ||
          lo.includes("both") ||
          lo.includes("another"));
      if (needsCopremise) {
        copremiseGroup = `cg-${pendingPremiseId}`;
        const first = nodes.find((n) => n.id === pendingPremiseId);
        if (first) first.copremiseGroup = copremiseGroup;
        state = "copremise_add";
        return { nodes, prompt: PROMPTS.copremise_add };
      }
      state = "objection_ask";
      return { nodes, prompt: PROMPTS.objection_ask };
    }

    case "copremise_add": {
      const id = nextId();
      nodes.push({ id, parentId: focusId, type: "premise", text, copremiseGroup });
      state = "objection_ask";
      return { nodes, prompt: PROMPTS.objection_ask };
    }

    case "objection_ask": {
      if (text.toLowerCase() === "skip") {
        state = "more_premises";
        return { nodes, prompt: PROMPTS.more_premises(focusText) };
      }
      const id = nextId();
      pendingObjId = id;
      const target = [...nodes]
        .reverse()
        .find((n) => n.type === "premise" && n.parentId === focusId);
      nodes.push({ id, parentId: target?.id ?? focusId, type: "objection", text });
      state = "rebuttal_ask";
      return { nodes, prompt: PROMPTS.objection_add };
    }

    case "rebuttal_ask": {
      const id = nextId();
      nodes.push({ id, parentId: pendingObjId, type: "rebuttal", text });
      pendingObjId = null;
      state = "more_premises";
      return { nodes, prompt: PROMPTS.more_premises(focusText) };
    }

    case "more_premises": {
      if (text.toLowerCase() === "done") {
        state = "focus_done";
        return {
          nodes,
          prompt:
            "Done here. Click any premise in the map to dig into its reasoning, or click the contention to add another independent argument.",
          focusDone: true,
        };
      }
      const id = nextId();
      pendingPremiseId = id;
      copremiseGroup = null;
      nodes.push({ id, parentId: focusId, type: "premise", text });
      state = "copremise_ask";
      return { nodes, prompt: PROMPTS.copremise_ask };
    }

    case "focus_done":
      return { nodes, prompt: null };

    default:
      return null;
  }
}

export function reset() {
  state = "contention";
  focusId = null;
  focusText = "";
  idCounter = 0;
  pendingPremiseId = null;
  pendingObjId = null;
  copremiseGroup = null;
}

function nextId() {
  return `n${++idCounter}`;
}

function shorten(text, max = 40) {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
