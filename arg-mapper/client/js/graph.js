import * as d3 from "d3";
import { NODE_W, NODE_H, getSubtree, computeLayout } from "./tree-utils.js";

export { getSubtree } from "./tree-utils.js";

const LABEL_H = 22;
const LINE_H = 16;
const MAX_LINES = 3;

let focusedPremiseId = null;

export function resetFocus() {
  focusedPremiseId = null;
}

export function getFocusedId() {
  return focusedPremiseId;
}

export function initGraph(svgEl) {
  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  const g = svg.append("g").attr("class", "graph-root");
  // linksLayer always precedes nodesLayer in the DOM, keeping nodes above links regardless of render order
  const linksLayer = g.append("g").attr("class", "links-layer");
  const nodesLayer = g.append("g").attr("class", "nodes-layer");
  // ctx.onNodeFocus(nodeId, nodeText) — called when user clicks a premise/contention
  // ctx.onNodeEdit(nodeId, text)      — called when user clicks the pencil action
  // ctx.onNodeDelete(nodeId)          — called when user clicks the trash action
  // ctx.onToggle()                    — called after any visual state change
  // ctx.dialogueFocusId               — set by main.js; node to highlight as active
  // ctx.dirtyNodes                    — set true by main.js after a text edit to force full node redraw
  return {
    svg,
    g,
    linksLayer,
    nodesLayer,
    onNodeFocus: null,
    onNodeEdit: null,
    onNodeDelete: null,
    onToggle: null,
    dialogueFocusId: null,
    dirtyNodes: false,
  };
}

export function renderGraph(svgEl, nodes, ctx) {
  const { g, linksLayer, nodesLayer } = ctx;

  if (ctx.dirtyNodes) {
    nodesLayer.selectAll(".node").remove();
    linksLayer.selectAll(".link-group").remove();
    ctx.dirtyNodes = false;
  }

  if (!nodes.length) return;

  // Focus mode: show focused premise + its full subtree
  // Map mode:   show contention + all premises (no deeper children)
  let visible;
  if (focusedPremiseId) {
    const subtreeIds = new Set([
      focusedPremiseId,
      ...getSubtree(focusedPremiseId, nodes).map((n) => n.id),
    ]);
    visible = nodes.filter((n) => subtreeIds.has(n.id));
  } else {
    // Map mode: contention + only its direct children (depth-1 thread nodes)
    const contentionId = nodes.find((n) => n.type === "contention")?.id;
    visible = nodes.filter(
      (n) => n.type === "contention" || (n.type === "premise" && n.parentId === contentionId),
    );
  }

  const pos = computeLayout(visible, !!focusedPremiseId);

  // Links — always in linksLayer so they stay behind nodesLayer in DOM order
  linksLayer.selectAll(".link-group").remove();
  visible.forEach((node) => {
    if (!node.parentId) return;
    const p = pos[node.parentId];
    const c = pos[node.id];
    if (!p || !c) return;
    linksLayer.append("line")
      .attr("class", `link-group link ${node.type}`)
      .attr("x1", p.x)
      .attr("y1", p.y + NODE_H / 2)
      .attr("x2", c.x)
      .attr("y2", c.y - NODE_H / 2);
  });

  // Nodes
  const nodeGroups = nodesLayer.selectAll(".node").data(visible, (d) => d.id);

  const enter = nodeGroups
    .enter()
    .append("g")
    .attr("class", (d) => `node ${d.type}`)
    .attr("transform", (d) => `translate(${pos[d.id].x},${pos[d.id].y})`);

  enter
    .append("rect")
    .attr("x", -NODE_W / 2)
    .attr("y", -NODE_H / 2)
    .attr("width", NODE_W)
    .attr("height", NODE_H)
    .attr("rx", 9);

  enter
    .append("text")
    .attr("class", "type-label")
    .attr("x", -NODE_W / 2 + 10)
    .attr("y", -NODE_H / 2 + 14)
    .text((d) => labelFor(d.type));

  enter.each(function (d) {
    // Reserve 18px at the bottom of premise nodes for the thread indicator strip
    const reserve = d.type === "premise" ? 18 : 0;
    appendWrappedText(
      d3.select(this),
      d.text,
      NODE_W - 22,
      -NODE_H / 2 + LABEL_H,
      NODE_H - LABEL_H - 8 - reserve,
    );
  });

  nodeGroups
    .transition()
    .duration(300)
    .attr("transform", (d) => `translate(${pos[d.id].x},${pos[d.id].y})`);

  nodeGroups.exit().remove();

  // ── Thread indicators (map mode) ──
  // Show dots for ALL children of a premise (sub-premises, objections, rebuttals)
  nodesLayer.selectAll(".node").each(function (d) {
    const nodeG = d3.select(this);
    nodeG.selectAll(".thread-indicator").remove();

    if (d.type !== "premise" || focusedPremiseId) return;

    const allChildren = getSubtree(d.id, nodes); // full depth
    if (!allChildren.length) return;

    // One dot per node in the subtree, ordered premises → objections → rebuttals.
    // Shows actual weight at a glance; overflow collapses to "+N".
    const ordered = [
      ...allChildren.filter((n) => n.type === "premise"),
      ...allChildren.filter((n) => n.type === "objection"),
      ...allChildren.filter((n) => n.type === "rebuttal"),
    ];
    const MAX_DOTS = 7;
    const shown = ordered.slice(0, MAX_DOTS);
    const overflow = ordered.length - shown.length;

    const ind = nodeG.append("g").attr("class", "thread-indicator");
    const stripY = NODE_H / 2 - 16;

    ind
      .append("line")
      .attr("x1", -NODE_W / 2 + 12)
      .attr("y1", stripY)
      .attr("x2", NODE_W / 2 - 12)
      .attr("y2", stripY)
      .attr("class", "indicator-sep");

    ind
      .append("text")
      .attr("x", -NODE_W / 2 + 14)
      .attr("y", NODE_H / 2 - 5)
      .attr("class", "indicator-chevron")
      .text("▶");

    const spacing = 11;
    const overflowW = overflow > 0 ? 18 : 0;
    const totalDotW = shown.length * spacing + overflowW;
    const dotStartX = -totalDotW / 2 + spacing / 2;

    shown.forEach((n, i) => {
      ind
        .append("circle")
        .attr("cx", dotStartX + i * spacing)
        .attr("cy", NODE_H / 2 - 8)
        .attr("r", 4)
        .attr("class", `indicator-dot ${n.type}`);
    });

    if (overflow > 0) {
      ind
        .append("text")
        .attr("x", dotStartX + shown.length * spacing + 2)
        .attr("y", NODE_H / 2 - 4)
        .attr("class", "indicator-overflow")
        .text(`+${overflow}`);
    }
  });

  // ── Node action buttons (edit ✎ / delete ✕) ──
  // Appear on hover for all non-contention nodes; stop click propagation so they
  // don't accidentally trigger focus mode.
  nodesLayer.selectAll(".node:not(.contention)").each(function (d) {
    const nodeG = d3.select(this);
    if (nodeG.select(".node-actions").empty()) {
      const actions = nodeG.append("g").attr("class", "node-actions");

      actions
        .append("text")
        .attr("class", "node-action-edit")
        .attr("x", NODE_W / 2 - 30)
        .attr("y", -NODE_H / 2 + 14)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "auto")
        .text("✎");

      actions
        .append("text")
        .attr("class", "node-action-delete")
        .attr("x", NODE_W / 2 - 13)
        .attr("y", -NODE_H / 2 + 14)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "auto")
        .text("✕");
    }

    nodeG.select(".node-action-edit").on("click", function (event) {
      event.stopPropagation();
      if (ctx.onNodeEdit) ctx.onNodeEdit(d.id, d.text);
    });

    nodeG.select(".node-action-delete").on("click", function (event) {
      event.stopPropagation();
      if (ctx.onNodeDelete) ctx.onNodeDelete(d.id);
    });
  });

  // ── Active dialogue focus highlight ──
  nodesLayer.selectAll(".node").classed("node--active", (d) => d.id === ctx.dialogueFocusId);

  // ── Click handlers ──
  // All premises are clickable — clicking enters focus mode and shifts dialogue
  nodesLayer.selectAll(".node.premise, .node.contention").each(function (d) {
    d3.select(this)
      .style("cursor", "pointer")
      .on("click", function () {
        focusedPremiseId = d.type === "premise" ? d.id : null;
        if (ctx.onNodeFocus) ctx.onNodeFocus(d.id, d.text);
        if (ctx.onToggle) ctx.onToggle();
      });
  });

  // viewBox
  const allPos = Object.values(pos);
  const allX = allPos.map((p) => p.x);
  const allY = allPos.map((p) => p.y);
  const H_PAD = 60,
    V_PAD = 50;
  const vbX = Math.min(...allX) - NODE_W / 2 - H_PAD;
  const vbY = Math.min(...allY) - NODE_H / 2 - V_PAD;
  const vbW = Math.max(...allX) + NODE_W / 2 + H_PAD - vbX;
  const vbH = Math.max(...allY) + NODE_H / 2 + V_PAD - vbY;
  svgEl.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
}

function labelFor(type) {
  return (
    { contention: "Contention", premise: "Premise", objection: "Objection", rebuttal: "Rebuttal" }[
      type
    ] ?? type
  );
}

function appendWrappedText(nodeG, text, maxPx, areaTopY, areaH) {
  const charsPerLine = Math.floor(maxPx / 7.8);
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > charsPerLine && line) {
      lines.push(line);
      line = word;
      if (lines.length === MAX_LINES) break;
    } else {
      line = candidate;
    }
  }
  if (lines.length < MAX_LINES && line) lines.push(line);

  const usedWords = lines.join(" ").split(" ").length;
  if (usedWords < words.length && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = (last.length > 3 ? last.slice(0, -3).trimEnd() : last) + "…";
  }

  const totalH = lines.length * LINE_H;
  const startY = areaTopY + (areaH - totalH) / 2 + LINE_H * 0.75;

  lines.forEach((l, i) => {
    nodeG
      .append("text")
      .attr("x", 0)
      .attr("y", startY + i * LINE_H)
      .attr("text-anchor", "middle")
      .text(l);
  });
}
