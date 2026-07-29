import { describe, it, expect } from 'vitest';
import { nodesToOutline, buildUserPrompt } from '../../server/ai/socratic.js';

const NODES = [
  { id: 'n0', parentId: null,  type: 'contention', text: 'We should ban cars' },
  { id: 'n1', parentId: 'n0', type: 'premise',    text: 'Cars cause pollution' },
  { id: 'n2', parentId: 'n1', type: 'objection',  text: 'Electric cars do not pollute' },
  { id: 'n3', parentId: 'n2', type: 'rebuttal',   text: 'Most charging is still coal-powered' },
];

describe('nodesToOutline', () => {
  it('returns (empty) for an empty array', () => {
    expect(nodesToOutline([], null)).toBe('(empty)');
  });

  it('marks the focused node with ★ and not the others', () => {
    const out = nodesToOutline(NODES, 'n1');
    expect(out).toContain('★');
    const lines = out.split('\n');
    const marked = lines.filter(l => l.includes('★'));
    expect(marked).toHaveLength(1);
    expect(marked[0]).toContain('Cars cause pollution');
  });

  it('indents children deeper than parents', () => {
    const out = nodesToOutline(NODES, null);
    const lines = out.split('\n');
    const contentionLine = lines.find(l => l.includes('contention'));
    const premiseLine    = lines.find(l => l.includes('premise'));
    const objectionLine  = lines.find(l => l.includes('objection'));
    // Contention is at depth 0, premise at depth 1 — premise line has more leading spaces
    expect(premiseLine.length - premiseLine.trimStart().length)
      .toBeGreaterThan(contentionLine.length - contentionLine.trimStart().length);
    // Objection is deeper than premise
    expect(objectionLine.length - objectionLine.trimStart().length)
      .toBeGreaterThan(premiseLine.length - premiseLine.trimStart().length);
  });

  it('includes all node texts', () => {
    const out = nodesToOutline(NODES, null);
    for (const n of NODES) expect(out).toContain(n.text);
  });

  it('works with no focus (focusId = null)', () => {
    const out = nodesToOutline(NODES, null);
    expect(out).not.toContain('★');
  });

  it('handles a single root node', () => {
    const out = nodesToOutline([{ id: 'n0', parentId: null, type: 'contention', text: 'Solo' }], 'n0');
    expect(out).toContain('[contention]');
    expect(out).toContain('Solo');
    expect(out).toContain('★');
  });
});

describe('buildUserPrompt', () => {
  const base = {
    intent:         'premise',
    focusText:      'We should ban cars',
    outline:        '[contention] We should ban cars',
    userInput:      'Because they pollute',
    scriptedPrompt: 'Give one reason.',
  };

  it('includes focusText, userInput, and scriptedPrompt', () => {
    const p = buildUserPrompt(base);
    expect(p).toContain('We should ban cars');
    expect(p).toContain('Because they pollute');
    expect(p).toContain('Give one reason.');
  });

  it('includes the outline', () => {
    const p = buildUserPrompt(base);
    expect(p).toContain('[contention] We should ban cars');
  });

  it('includes a task instruction matching the intent', () => {
    const p = buildUserPrompt(base);
    // 'premise' intent → ask for a reason
    expect(p.toLowerCase()).toContain('reason');
  });

  it('falls back gracefully for an unknown intent', () => {
    const p = buildUserPrompt({ ...base, intent: 'unknown_state' });
    expect(p).toContain('We should ban cars');
    // Should still have some instruction (falls back to premise instruction)
    expect(p).toContain('reason');
  });

  it('ends with a no-preamble instruction', () => {
    const p = buildUserPrompt(base);
    expect(p).toContain('No preamble');
  });
});
