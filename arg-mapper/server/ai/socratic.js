// Pure prompt-building utilities — no network, safe to unit-test in node env.

/** System prompt for the Socratic guide persona. */
export const SOCRATIC_SYSTEM =
  'You are a warm, curious Socratic guide helping students aged 10–14 build rigorous arguments. ' +
  'You ask exactly one short question per turn. You never lecture, never answer your own question, ' +
  'and never use "argument" as jargon. You speak simply and naturally, varying your phrasing each ' +
  'time so the conversation feels fresh. Your goal is to help the student think deeper, not to judge.';

// Instructions per state — tells the model what kind of follow-up question to generate.
const INTENT_INSTRUCTIONS = {
  contention:    'Ask the student to state their main conclusion — what they are trying to argue.',
  premise:       'Ask the student to give one independent reason why their claim is true. Be specific to their claim.',
  copremise_ask: 'Ask whether the reason they just gave needs another claim alongside it to work, or whether it stands on its own.',
  copremise_add: 'Ask them to state the other claim that must also be true for their reason to hold.',
  objection_ask: 'Ask what someone who disagrees might say. Encourage them to steelman the opposition.',
  rebuttal_ask:  'Ask how they would respond to that objection.',
  more_premises: 'Ask if they have another independent reason to believe their claim, or whether they are satisfied.',
  focus_done:    'The dialogue for this node is complete — no question needed.',
};

/**
 * Build a readable indented text outline of the argument tree.
 * The focused node is marked with ★.
 *
 * @param {Array}  nodes   — flat node array
 * @param {string} focusId — id of the currently focused node (or null)
 * @returns {string}
 */
export function nodesToOutline(nodes, focusId) {
  if (!nodes || !nodes.length) return '(empty)';

  // Build a children map keyed by parentId (use '__root__' for top-level nodes)
  const children = new Map();
  for (const n of nodes) {
    const key = n.parentId ?? '__root__';
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(n);
  }

  const lines = [];
  function walk(parentKey, depth) {
    const kids = children.get(parentKey) ?? [];
    for (const n of kids) {
      const star = n.id === focusId ? ' ★' : '';
      const indent = '  '.repeat(depth);
      lines.push(`${indent}[${n.type}]${star} ${n.text}`);
      walk(n.id, depth + 1);
    }
  }

  walk('__root__', 0);
  return lines.join('\n') || '(empty)';
}

/**
 * Build the user-turn prompt for the AI to generate the next Socratic question.
 *
 * @param {object} p
 * @param {string} p.intent         — post-step dialogue state (what kind of question to ask next)
 * @param {string} p.focusText      — the claim currently under examination
 * @param {string} p.outline        — text outline from nodesToOutline()
 * @param {string} p.userInput      — what the student just typed
 * @param {string} p.scriptedPrompt — the scripted fallback (use as a phrasing guide, not verbatim)
 * @returns {string}
 */
export function buildUserPrompt({ intent, focusText, outline, userInput, scriptedPrompt }) {
  const instruction = INTENT_INSTRUCTIONS[intent] ?? INTENT_INSTRUCTIONS.premise;
  return (
    `Argument so far:\n${outline}\n\n` +
    `Current focus: "${focusText}"\n\n` +
    `Student just said: "${userInput}"\n\n` +
    `Your task: ${instruction}\n` +
    `Scripted example (rephrase this naturally in context — do not copy it verbatim): "${scriptedPrompt}"\n\n` +
    'Reply with only the question. No preamble, no explanation.'
  );
}
