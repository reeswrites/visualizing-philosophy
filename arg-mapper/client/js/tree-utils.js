// Pure, D3-free functions for tree traversal and layout computation.
// Extracted here so they can be unit-tested without importing D3.

export const NODE_W = 210;
export const NODE_H = 82;
export const H_GAP = 44;
export const V_GAP = 100;

// Returns every descendant of nodeId (breadth-first, not including nodeId itself).
export function getSubtree(nodeId, nodes) {
  const result = [];
  const queue = [nodeId];
  while (queue.length) {
    const cur = queue.shift();
    for (const child of nodes.filter((n) => n.parentId === cur)) {
      result.push(child);
      queue.push(child.id);
    }
  }
  return result;
}

// Returns { [nodeId]: { x, y } } positions for a flat list of visible nodes.
// Map mode: co-premise groups are placed side-by-side on the same row.
// Focus mode: every node is placed in a simple vertical stack at x=0.
export function computeLayout(nodes, focusMode) {
  const rowH = NODE_H + V_GAP;
  const positions = {};
  const placed = new Set();
  let y = 0;

  for (const node of nodes) {
    if (placed.has(node.id)) continue;

    if (!focusMode && node.copremiseGroup) {
      const group = nodes.filter(
        (n) => n.copremiseGroup === node.copremiseGroup && !placed.has(n.id),
      );
      if (group.length > 1) {
        const span = group.length * (NODE_W + H_GAP) - H_GAP;
        group.forEach((m, i) => {
          positions[m.id] = { x: -span / 2 + i * (NODE_W + H_GAP) + NODE_W / 2, y };
          placed.add(m.id);
        });
        y += rowH;
        continue;
      }
    }

    positions[node.id] = { x: 0, y };
    placed.add(node.id);
    y += rowH;
  }

  return positions;
}
