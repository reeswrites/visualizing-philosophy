import { initGraph, renderGraph, resetFocus, getFocusedId, getSubtree } from "./graph.js";
import {
  getInitialPrompt,
  setFocus,
  getFocusId,
  getState,
  step,
  getAiMode,
  setAiMode,
  reset,
} from "./dialogue.js";
import { initSession, scheduleSave, newSession, listSessions, loadSession, analyzeDocument, streamDialogue } from "./session.js";

const svgEl = document.getElementById("arg-graph");
const messagesEl = document.getElementById("dialogue-messages");
const inputEl = document.getElementById("dialogue-input");
const submitBtn = document.getElementById("dialogue-submit");

// ── AI mode toggle ──
const aiToggle = document.getElementById("ai-mode-toggle");
aiToggle.addEventListener("change", () => {
  setAiMode(aiToggle.checked);
  const label = aiToggle.closest(".ai-toggle-wrap").querySelector(".toggle-label");
  label.textContent = aiToggle.checked ? "AI Guide (beta)" : "AI Guide";
});

// ── Edit overlay ──
const editOverlay = document.getElementById("node-edit-overlay");
const editInput = document.getElementById("node-edit-input");
const editSaveBtn = document.getElementById("node-edit-save");
const editCancelBtn = document.getElementById("node-edit-cancel");
let editingNodeId = null;

function openEditOverlay(nodeId, currentText) {
  editingNodeId = nodeId;
  editInput.value = currentText;
  editOverlay.hidden = false;
  editInput.focus();
  editInput.select();
}

editCancelBtn.addEventListener("click", () => {
  editOverlay.hidden = true;
  editingNodeId = null;
});

editSaveBtn.addEventListener("click", () => {
  const newText = editInput.value.trim();
  if (!newText || !editingNodeId) {
    editOverlay.hidden = true;
    return;
  }
  const node = nodes.find((n) => n.id === editingNodeId);
  if (node) {
    node.text = newText;
    graphCtx.dirtyNodes = true;
    syncUI();
    scheduleSave(nodes, messages);
  }
  editOverlay.hidden = true;
  editingNodeId = null;
});

editInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    editSaveBtn.click();
  }
  if (e.key === "Escape") editCancelBtn.click();
});

// ── Delete overlay ──
const deleteOverlay = document.getElementById("node-delete-overlay");
const deleteDesc = document.getElementById("node-delete-desc");
const deleteConfirm = document.getElementById("node-delete-confirm");
const deleteCancelBtn = document.getElementById("node-delete-cancel");
let deletingNodeId = null;

function openDeleteOverlay(nodeId) {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;
  deletingNodeId = nodeId;
  const descendants = getSubtree(nodeId, nodes);
  deleteDesc.textContent = descendants.length
    ? `"${shorten(node.text, 60)}" and its ${descendants.length} sub-claim${descendants.length > 1 ? "s" : ""} will be permanently removed.`
    : `"${shorten(node.text, 60)}" will be permanently removed.`;
  deleteOverlay.hidden = false;
}

deleteCancelBtn.addEventListener("click", () => {
  deleteOverlay.hidden = true;
  deletingNodeId = null;
});

deleteConfirm.addEventListener("click", () => {
  if (!deletingNodeId) {
    deleteOverlay.hidden = true;
    return;
  }
  const toRemove = new Set([deletingNodeId, ...getSubtree(deletingNodeId, nodes).map((n) => n.id)]);
  nodes = nodes.filter((n) => !toRemove.has(n.id));
  // Exit focus mode if the focused node was deleted
  if (toRemove.has(getFocusedId())) resetFocus();
  deleteOverlay.hidden = true;
  deletingNodeId = null;
  syncUI();
  scheduleSave(nodes, messages);
});

const graphCtx = initGraph(svgEl);
let nodes = [];
let messages = [];

// ── Focus exit button ──
const focusExitBtn = document.createElement("button");
focusExitBtn.id = "focus-exit";
focusExitBtn.textContent = "← Back to argument map";
focusExitBtn.style.display = "none";
document.getElementById("graph-panel").appendChild(focusExitBtn);

function syncUI() {
  focusExitBtn.style.display = getFocusedId() ? "block" : "none";
  graphCtx.dialogueFocusId = getFocusId();
  renderGraph(svgEl, nodes, graphCtx);
}

// When the user clicks a node in the map, shift the dialogue context to that node
graphCtx.onNodeFocus = (nodeId, nodeText) => {
  if (nodeId === getFocusId() && getState() !== "focus_done") return;
  const prompt = setFocus(nodeId, nodeText);
  addDivider(nodeText);
  addAIMessage(prompt);
  inputEl.disabled = false;
  submitBtn.disabled = false;
  syncUI();
  scheduleSave(nodes, messages);
};

graphCtx.onToggle = () => syncUI();
graphCtx.onNodeEdit = (id, text) => openEditOverlay(id, text);
graphCtx.onNodeDelete = (id) => openDeleteOverlay(id);

// Back button — exit visual focus and return dialogue to contention
focusExitBtn.addEventListener("click", () => {
  resetFocus();
  const contention = nodes.find((n) => n.type === "contention");
  if (contention) {
    const prompt = setFocus(contention.id, contention.text);
    addDivider(contention.text);
    addAIMessage(prompt);
  }
  syncUI();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && getFocusedId()) {
    focusExitBtn.click();
  }
});

// ── Legend ──
const legend = document.createElement("div");
legend.id = "graph-legend";
legend.innerHTML = `
  <div class="legend-item"><div class="legend-swatch" style="background:#dbeafe;border-color:#2563eb"></div> Contention</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#fff;border-color:#1e293b"></div> Premise</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#fee2e2;border-color:#dc2626"></div> Objection</div>
  <div class="legend-item"><div class="legend-swatch" style="background:#dcfce7;border-color:#16a34a"></div> Rebuttal</div>
`;
document.getElementById("graph-panel").appendChild(legend);

function addAIMessage(text) {
  messages.push({ role: "ai", text });
  renderMessage({ role: "ai", text });
}

function addUserMessage(text) {
  messages.push({ role: "user", text });
  renderMessage({ role: "user", text });
}

function addDivider(label) {
  messages.push({ role: "divider", text: label });
  renderMessage({ role: "divider", text: label });
}

function renderMessage({ role, text }) {
  const div = document.createElement("div");
  if (role === "ai") {
    div.className = "msg ai";
    div.innerHTML = `<div class="label">Guide</div>${escHtml(text)}`;
  } else if (role === "user") {
    div.className = "msg user";
    div.textContent = text;
  } else {
    div.className = "msg-divider";
    div.textContent = text;
  }
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// Create a streaming AI bubble. Returns { append(delta), done(fullText) }.
// Use append() while tokens arrive; call done() to set the final text (handles
// both streaming success and fallback — done() replaces whatever was appended).
function renderStreamingMessage() {
  const div = document.createElement("div");
  div.className = "msg ai";
  const label = document.createElement("div");
  label.className = "label";
  label.textContent = "Guide";
  div.appendChild(label);
  const textNode = document.createTextNode("");
  div.appendChild(textNode);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  return {
    append(delta) {
      textNode.textContent += delta;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
    done(fullText) {
      textNode.textContent = fullText;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    },
  };
}

function startFresh() {
  reset();
  resetFocus();
  nodes = [];
  messages = [];
  graphCtx.dialogueFocusId = null;
  graphCtx.dirtyNodes = true;
  renderGraph(svgEl, nodes, graphCtx);
  messagesEl.innerHTML = "";
  addAIMessage(getInitialPrompt());
}

// ── Home screen ──
function showApp() {
  document.getElementById("home-screen").setAttribute("hidden", "");
  document.getElementById("app").removeAttribute("hidden");
}

async function showHome() {
  document.getElementById("home-screen").removeAttribute("hidden");
  document.getElementById("app").setAttribute("hidden", "");
  try {
    const sessions = await listSessions();
    renderHomeSessionList(sessions);
  } catch {}
}

function renderHomeSessionList(sessions) {
  const list = document.getElementById("home-session-list");
  const section = document.getElementById("home-sessions-section");
  const nonEmpty = sessions.filter(s => Array.isArray(s.nodes) && s.nodes.length > 0);
  if (nonEmpty.length === 0) { section.hidden = true; return; }
  section.hidden = false;
  list.innerHTML = "";
  for (const s of nonEmpty) {
    const contention = s.nodes.find(n => n.type === "contention");
    const title = contention?.text ?? "Untitled";
    const btn = document.createElement("button");
    btn.className = "home-session-item";
    btn.innerHTML = `<span class="home-session-title">${escHtml(shorten(title, 90))}</span><span class="home-session-date">${fmtDate(s.updated_at)}</span>`;
    btn.addEventListener("click", () => openSession(s.id));
    list.appendChild(btn);
  }
}

async function openSession(id) {
  const data = await loadSession(id);
  if (!data) return;
  reset();
  resetFocus();
  nodes = data.nodes;
  messages = data.messages ?? [];
  graphCtx.dialogueFocusId = null;
  graphCtx.dirtyNodes = true;
  renderGraph(svgEl, nodes, graphCtx);
  messagesEl.innerHTML = "";
  messages.forEach(renderMessage);
  inputEl.disabled = false;
  submitBtn.disabled = false;
  showApp();
}

function fmtDate(iso) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  const diffDays = Math.floor((Date.now() - d) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

document.getElementById("home-new-btn").addEventListener("click", async () => {
  await newSession();
  startFresh();
  inputEl.disabled = false;
  submitBtn.disabled = false;
  showApp();
});

document.getElementById("home-upload-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const labelSpan = document.querySelector("#home-upload-label span");
  const origText = labelSpan.textContent;
  labelSpan.textContent = "Analyzing…";
  try {
    const text = await file.text();
    const data = await analyzeDocument(text);
    reset();
    resetFocus();
    nodes = data.nodes;
    messages = [];
    graphCtx.dialogueFocusId = null;
    graphCtx.dirtyNodes = true;
    renderGraph(svgEl, nodes, graphCtx);
    messagesEl.innerHTML = "";
    const contention = nodes.find(n => n.type === "contention");
    if (contention) {
      const prompt = setFocus(contention.id, contention.text);
      addAIMessage(prompt);
    }
    inputEl.disabled = false;
    submitBtn.disabled = false;
    showApp();
  } catch {
    // stay on home screen if analysis fails
  } finally {
    labelSpan.textContent = origText;
    e.target.value = "";
  }
});

// ── New argument button (in-app header → return to home) ──
document.getElementById("new-argument-btn").addEventListener("click", () => {
  showHome();
});

// ── Session init — show home screen ──
showHome();

async function handleSubmit() {
  const text = inputEl.value.trim();
  if (!text) return;

  addUserMessage(text);
  inputEl.value = "";
  submitBtn.disabled = true;
  inputEl.disabled = true;

  // Capture the pre-step state so the AI knows what kind of question to phrase.
  const intent = getState();
  const result = step(text, nodes);

  if (!result) {
    submitBtn.disabled = false;
    inputEl.disabled = false;
    return;
  }

  nodes = result.nodes;
  graphCtx.dialogueFocusId = getFocusId();
  renderGraph(svgEl, nodes, graphCtx);
  focusExitBtn.style.display = getFocusedId() ? "block" : "none";

  if (result.prompt) {
    if (getAiMode()) {
      // AI path: stream a context-aware rephrasing of the scripted prompt.
      // Falls back to the scripted prompt on 503 / network error.
      const bubble = renderStreamingMessage();
      const aiText = await streamDialogue(
        { intent, nodes, focusId: getFocusId(), userInput: text, scriptedPrompt: result.prompt },
        (delta) => bubble.append(delta),
      );
      const finalText = aiText ?? result.prompt;
      bubble.done(finalText);
      messages.push({ role: "ai", text: finalText });
    } else {
      addAIMessage(result.prompt);
    }
  }

  scheduleSave(nodes, messages);
  if (result.focusDone || !result.prompt) {
    submitBtn.disabled = true;
    inputEl.disabled = true;
  } else {
    submitBtn.disabled = false;
    inputEl.disabled = false;
    inputEl.focus();
  }
}

submitBtn.addEventListener("click", handleSubmit);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSubmit();
  }
});

function escHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shorten(text, max = 40) {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}
