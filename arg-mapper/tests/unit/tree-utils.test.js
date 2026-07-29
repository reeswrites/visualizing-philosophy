import { describe, it, expect } from 'vitest';
import { getSubtree, computeLayout, NODE_W, NODE_H, H_GAP, V_GAP } from '../../client/js/tree-utils.js';

// ── getSubtree ────────────────────────────────────────────────────────────────

describe('getSubtree', () => {
  const nodes = [
    { id: 'root', parentId: null },
    { id: 'c1',   parentId: 'root' },
    { id: 'c2',   parentId: 'root' },
    { id: 'c1a',  parentId: 'c1' },
    { id: 'c1b',  parentId: 'c1' },
    { id: 'c1a1', parentId: 'c1a' },
  ];

  it('returns empty array for a leaf node', () => {
    expect(getSubtree('c2', nodes)).toHaveLength(0);
  });

  it('returns direct children only for a node with no grandchildren', () => {
    const result = getSubtree('c2', nodes);
    expect(result).toHaveLength(0);
  });

  it('returns direct children of a mid-level node', () => {
    const result = getSubtree('c1', nodes);
    const ids = result.map(n => n.id);
    expect(ids).toContain('c1a');
    expect(ids).toContain('c1b');
    expect(ids).toContain('c1a1');
    expect(result).toHaveLength(3);
  });

  it('returns the full subtree recursively from root', () => {
    const result = getSubtree('root', nodes);
    expect(result).toHaveLength(5); // c1, c2, c1a, c1b, c1a1
  });

  it('does not include the node itself', () => {
    const result = getSubtree('root', nodes);
    expect(result.map(n => n.id)).not.toContain('root');
  });

  it('returns empty array for a node that does not exist', () => {
    expect(getSubtree('nonexistent', nodes)).toHaveLength(0);
  });

  it('returns empty array when nodes list is empty', () => {
    expect(getSubtree('root', [])).toHaveLength(0);
  });

  it('preserves node objects by reference', () => {
    const child = nodes.find(n => n.id === 'c1');
    const result = getSubtree('root', nodes);
    expect(result).toContain(child);
  });
});

// ── computeLayout ─────────────────────────────────────────────────────────────

const ROW = NODE_H + V_GAP; // vertical step between rows

describe('computeLayout', () => {
  describe('single node', () => {
    it('places a lone node at x=0, y=0', () => {
      const pos = computeLayout([{ id: 'n1' }], false);
      expect(pos.n1).toEqual({ x: 0, y: 0 });
    });
  });

  describe('map mode (focusMode=false)', () => {
    it('stacks non-copremise nodes vertically at x=0', () => {
      const nodes = [
        { id: 'n1' },
        { id: 'n2' },
        { id: 'n3' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.n1).toEqual({ x: 0, y: 0 });
      expect(pos.n2).toEqual({ x: 0, y: ROW });
      expect(pos.n3).toEqual({ x: 0, y: ROW * 2 });
    });

    it('places two co-premises on the same row', () => {
      const nodes = [
        { id: 'n1', copremiseGroup: 'cg1' },
        { id: 'n2', copremiseGroup: 'cg1' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.n1.y).toBe(pos.n2.y);
    });

    it('places two co-premises symmetrically around x=0', () => {
      const nodes = [
        { id: 'n1', copremiseGroup: 'cg1' },
        { id: 'n2', copremiseGroup: 'cg1' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.n1.x).toBeLessThan(0);
      expect(pos.n2.x).toBeGreaterThan(0);
      expect(pos.n1.x + pos.n2.x).toBeCloseTo(0, 5); // symmetric
    });

    it('separates two co-premises by NODE_W + H_GAP', () => {
      const nodes = [
        { id: 'n1', copremiseGroup: 'cg1' },
        { id: 'n2', copremiseGroup: 'cg1' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.n2.x - pos.n1.x).toBeCloseTo(NODE_W + H_GAP, 5);
    });

    it('places three co-premises on the same row', () => {
      const nodes = [
        { id: 'a', copremiseGroup: 'cg1' },
        { id: 'b', copremiseGroup: 'cg1' },
        { id: 'c', copremiseGroup: 'cg1' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.a.y).toBe(pos.b.y);
      expect(pos.b.y).toBe(pos.c.y);
    });

    it('a node after a co-premise group occupies the next row', () => {
      const nodes = [
        { id: 'cp1', copremiseGroup: 'cg1' },
        { id: 'cp2', copremiseGroup: 'cg1' },
        { id: 'solo' },
      ];
      const pos = computeLayout(nodes, false);
      expect(pos.solo.y).toBe(ROW);
    });

    it('a lone node with a copremiseGroup is stacked vertically', () => {
      const nodes = [{ id: 'n1', copremiseGroup: 'orphan' }];
      const pos = computeLayout(nodes, false);
      expect(pos.n1).toEqual({ x: 0, y: 0 });
    });
  });

  describe('focus mode (focusMode=true)', () => {
    it('stacks co-premises vertically — no side-by-side grouping', () => {
      const nodes = [
        { id: 'n1', copremiseGroup: 'cg1' },
        { id: 'n2', copremiseGroup: 'cg1' },
      ];
      const pos = computeLayout(nodes, true);
      expect(pos.n1.y).not.toBe(pos.n2.y); // different rows
      expect(pos.n1.x).toBe(0);
      expect(pos.n2.x).toBe(0);
    });

    it('all nodes are at x=0 in focus mode', () => {
      const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
      const pos = computeLayout(nodes, true);
      Object.values(pos).forEach(p => expect(p.x).toBe(0));
    });
  });

  describe('id assignment', () => {
    it('assigns a position to every node in the input', () => {
      const nodes = [{ id: 'x' }, { id: 'y' }, { id: 'z' }];
      const pos = computeLayout(nodes, false);
      expect(Object.keys(pos)).toHaveLength(3);
    });

    it('does not assign positions to nodes not in input', () => {
      const pos = computeLayout([{ id: 'only' }], false);
      expect(Object.keys(pos)).toEqual(['only']);
    });
  });
});
