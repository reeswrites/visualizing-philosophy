import { describe, it, expect, beforeEach } from 'vitest';
import {
  step, reset, setFocus, getFocusId,
  getInitialPrompt, setAiMode, getAiMode, stepAI,
} from '../../client/js/dialogue.js';

// Helper: run the full contention step so state advances to 'premise'
function addContention(text = 'My contention') {
  const nodes = [];
  const result = step(text, nodes);
  return { nodes: result.nodes, contentionId: result.nodes[0].id };
}

describe('dialogue', () => {
  beforeEach(() => {
    reset();
    setAiMode(false);
  });

  // ── Initial state ────────────────────────────────────────────────────────────

  describe('getInitialPrompt', () => {
    it('returns the contention question', () => {
      expect(getInitialPrompt()).toContain("What is the argument you're trying to make");
    });
  });

  // ── Empty / whitespace input ─────────────────────────────────────────────────

  describe('empty input', () => {
    it('returns null for empty string', () => {
      expect(step('', [])).toBeNull();
    });

    it('returns null for whitespace-only input', () => {
      expect(step('   ', [])).toBeNull();
    });

    it('does not advance state on empty input', () => {
      step('', []);
      // State is still 'contention' — next real input still creates a contention
      const nodes = [];
      const result = step('Real claim', nodes);
      expect(result.nodes[0].type).toBe('contention');
    });
  });

  // ── Contention step ──────────────────────────────────────────────────────────

  describe('contention step', () => {
    it('creates a contention node with null parentId', () => {
      const result = step('Cats rule', []);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({ type: 'contention', parentId: null, text: 'Cats rule' });
    });

    it('trims leading/trailing whitespace from text', () => {
      const result = step('  spaced  ', []);
      expect(result.nodes[0].text).toBe('spaced');
    });

    it('returns the premise prompt referencing the claim', () => {
      const result = step('Homework should be banned', []);
      expect(result.prompt).toContain('Why do you believe');
      expect(result.prompt).toContain('Homework should be banned');
    });

    it('assigns a string id to the contention', () => {
      const result = step('Claim', []);
      expect(typeof result.nodes[0].id).toBe('string');
      expect(result.nodes[0].id.length).toBeGreaterThan(0);
    });

    it('sets focusId to the contention id', () => {
      const result = step('Claim', []);
      expect(getFocusId()).toBe(result.nodes[0].id);
    });
  });

  // ── Premise step ─────────────────────────────────────────────────────────────

  describe('premise step', () => {
    it('creates a premise node as a child of the contention', () => {
      const { nodes, contentionId } = addContention();
      const result = step('My reason', nodes);
      const premise = result.nodes.find(n => n.type === 'premise');
      expect(premise).toMatchObject({ type: 'premise', parentId: contentionId });
    });

    it('asks about co-premises', () => {
      const { nodes } = addContention();
      const result = step('My reason', nodes);
      expect(result.prompt).toContain('Does that reason need another claim');
    });

    it('adds premises as independent siblings under the same parent', () => {
      const { nodes, contentionId } = addContention();
      step('Reason one', nodes);
      // Skip to more_premises via no → skip
      step('no', nodes);
      step('skip', nodes);
      step('Reason two', nodes); // more_premises → adds second premise
      step('no', nodes);        // copremise_ask
      step('skip', nodes);      // objection_ask
      step('done', nodes);

      const premises = nodes.filter(n => n.type === 'premise');
      expect(premises).toHaveLength(2);
      premises.forEach(p => expect(p.parentId).toBe(contentionId));
    });
  });

  // ── Co-premise ask ───────────────────────────────────────────────────────────

  describe('copremise_ask', () => {
    function reachCopremiseAsk() {
      const { nodes } = addContention('Tax cuts grow the economy');
      step('Businesses invest more when taxes are lower', nodes);
      return nodes;
    }

    it('"no" skips to objection', () => {
      const nodes = reachCopremiseAsk();
      const result = step('no', nodes);
      expect(result.prompt).toContain('What would someone who disagrees say');
    });

    it('"yes" advances to co-premise add', () => {
      const nodes = reachCopremiseAsk();
      const result = step('yes', nodes);
      expect(result.prompt).toContain('What is the other claim');
    });

    it('"no, it does not need another claim" skips despite containing "need" and "another"', () => {
      const nodes = reachCopremiseAsk();
      const result = step('no, it does not need another claim', nodes);
      expect(result.prompt).toContain('What would someone who disagrees say');
    });

    it('"no, it stands alone" skips despite containing "alone"', () => {
      const nodes = reachCopremiseAsk();
      const result = step('no, it stands alone', nodes);
      expect(result.prompt).toContain('What would someone who disagrees say');
    });

    it('"no it doesn\'t need it" skips despite containing "need"', () => {
      const nodes = reachCopremiseAsk();
      const result = step("no it doesn't need it", nodes);
      expect(result.prompt).toContain('What would someone who disagrees say');
    });

    it('"together they prove it" accepts co-premise', () => {
      const nodes = reachCopremiseAsk();
      const result = step('together they prove it', nodes);
      expect(result.prompt).toContain('What is the other claim');
    });

    it('"yes, they both need to be true" accepts co-premise', () => {
      const nodes = reachCopremiseAsk();
      const result = step('yes, they both need to be true', nodes);
      expect(result.prompt).toContain('What is the other claim');
    });

    it('"it is independently valid" skips co-premise', () => {
      const nodes = reachCopremiseAsk();
      const result = step('it is independently valid', nodes);
      expect(result.prompt).toContain('What would someone who disagrees say');
    });

    it('assigns matching copremiseGroup to both co-premises', () => {
      const nodes = reachCopremiseAsk();
      step('yes', nodes);
      step('The second claim', nodes);
      const premises = nodes.filter(n => n.type === 'premise');
      expect(premises).toHaveLength(2);
      expect(premises[0].copremiseGroup).toBeTruthy();
      expect(premises[0].copremiseGroup).toBe(premises[1].copremiseGroup);
    });

    it('co-premises have the same parentId', () => {
      const { nodes, contentionId } = addContention();
      step('First premise', nodes);
      step('yes', nodes);
      step('Second premise', nodes);
      const premises = nodes.filter(n => n.type === 'premise');
      premises.forEach(p => expect(p.parentId).toBe(contentionId));
    });
  });

  // ── Objection & rebuttal ─────────────────────────────────────────────────────

  describe('objection step', () => {
    function reachObjectionAsk() {
      const { nodes } = addContention();
      step('My reason', nodes);
      step('no', nodes);
      return nodes;
    }

    it('"skip" bypasses the objection and goes to more-premises', () => {
      const nodes = reachObjectionAsk();
      const result = step('skip', nodes);
      expect(result.prompt).toContain('Any other independent reason');
      expect(nodes.filter(n => n.type === 'objection')).toHaveLength(0);
    });

    it('creates an objection node and asks for rebuttal', () => {
      const nodes = reachObjectionAsk();
      const result = step('Someone could argue X', nodes);
      expect(result.prompt).toContain('How would you respond');
      const objection = nodes.find(n => n.type === 'objection');
      expect(objection).toBeTruthy();
      expect(objection.text).toBe('Someone could argue X');
    });

    it('attaches the objection to the most recent premise', () => {
      const { nodes, contentionId } = addContention();
      step('My reason', nodes);           // n2
      step('no', nodes);
      step('Someone argues otherwise', nodes); // objection
      const objection = nodes.find(n => n.type === 'objection');
      const lastPremise = nodes.filter(n => n.type === 'premise').at(-1);
      expect(objection.parentId).toBe(lastPremise.id);
    });
  });

  describe('rebuttal step', () => {
    function reachRebuttalAsk() {
      const { nodes } = addContention();
      step('My reason', nodes);
      step('no', nodes);
      step('Counter argument', nodes);
      return nodes;
    }

    it('creates a rebuttal node as child of the objection', () => {
      const nodes = reachRebuttalAsk();
      const result = step('My rebuttal', nodes);
      const rebuttal = nodes.find(n => n.type === 'rebuttal');
      const objection = nodes.find(n => n.type === 'objection');
      expect(rebuttal).toBeTruthy();
      expect(rebuttal.parentId).toBe(objection.id);
    });

    it('advances to more-premises after rebuttal', () => {
      const nodes = reachRebuttalAsk();
      const result = step('My rebuttal', nodes);
      expect(result.prompt).toContain('Any other independent reason');
    });
  });

  // ── More-premises / done ─────────────────────────────────────────────────────

  describe('more_premises / done', () => {
    function reachMorePremises() {
      const { nodes } = addContention();
      step('First reason', nodes);
      step('no', nodes);
      step('skip', nodes);
      return nodes;
    }

    it('"done" ends the focus and returns focusDone', () => {
      const nodes = reachMorePremises();
      const result = step('done', nodes);
      expect(result.focusDone).toBe(true);
    });

    it('"DONE" (case-insensitive) also ends the focus', () => {
      const nodes = reachMorePremises();
      const result = step('DONE', nodes);
      expect(result.focusDone).toBe(true);
    });

    it('"done" returns a prompt with navigation instructions', () => {
      const nodes = reachMorePremises();
      const result = step('done', nodes);
      expect(result.prompt).toContain('Click any premise');
    });

    it('focus_done state returns null prompt on any further input', () => {
      const nodes = reachMorePremises();
      step('done', nodes);
      const result = step('anything', nodes);
      expect(result.prompt).toBeNull();
    });

    it('adding another premise loops back to copremise_ask', () => {
      const nodes = reachMorePremises();
      const result = step('Second reason', nodes);
      expect(result.prompt).toContain('Does that reason need another claim');
      expect(nodes.filter(n => n.type === 'premise')).toHaveLength(2);
    });
  });

  // ── setFocus ─────────────────────────────────────────────────────────────────

  describe('setFocus', () => {
    it('resets state to premise and returns the premise prompt', () => {
      const { nodes } = addContention('My claim');
      step('Reason', nodes);
      step('no', nodes);
      step('skip', nodes);
      step('done', nodes); // now focus_done

      const prompt = setFocus('n1', 'My claim');
      expect(prompt).toContain('Why do you believe');
      expect(getFocusId()).toBe('n1');
    });

    it('after setFocus, steps add premises under the new focus node', () => {
      const nodes = [];
      step('My contention', nodes);               // n1 = contention
      step('First reason', nodes);                // n2 = premise under n1
      step('no', nodes); step('skip', nodes); step('done', nodes);

      setFocus('n1', 'My contention');            // redirect back to contention
      step('Second reason', nodes);               // n3 = new premise under n1
      step('no', nodes); step('skip', nodes); step('done', nodes);

      const premisesUnderN1 = nodes.filter(n => n.type === 'premise' && n.parentId === 'n1');
      expect(premisesUnderN1).toHaveLength(2);
    });
  });

  // ── AI mode ──────────────────────────────────────────────────────────────────

  describe('AI mode toggle', () => {
    it('is off by default', () => {
      expect(getAiMode()).toBe(false);
    });

    it('setAiMode(true) enables AI mode', () => {
      setAiMode(true);
      expect(getAiMode()).toBe(true);
    });

    it('setAiMode(false) disables AI mode', () => {
      setAiMode(true);
      setAiMode(false);
      expect(getAiMode()).toBe(false);
    });
  });

  describe('stepAI stub', () => {
    it('produces the same result as step (fallthrough)', async () => {
      const nodes1 = [];
      const r1 = step('Claim', nodes1);

      reset();
      const nodes2 = [];
      const r2 = await stepAI('Claim', nodes2);

      expect(r2.prompt).toBe(r1.prompt);
      expect(r2.nodes[0].type).toBe(r1.nodes[0].type);
      expect(r2.nodes[0].text).toBe(r1.nodes[0].text);
    });
  });
});
