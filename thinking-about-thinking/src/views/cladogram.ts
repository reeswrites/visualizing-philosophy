import '../styles/site.css'
import { columns, rows, symbols } from '../data/matrix'
import { characters, tree, treeLegend } from '../data/tree'
import type { Clade, Tip, TreeNode } from '../lib/types'
import { createTooltip, esc, jumpToEntry, line, lineageColor, renderLinks, svg, text } from '../lib/ui'

const VIEW_WIDTH = 700
const TOP = 40
const TIP_GAP = 32
const ROOT_X = 44
const DEPTH_STEP = 56
const TIP_X = 300
const LABEL_X = 316
const MARK_RADIUS = 9

interface Placed {
  node: TreeNode
  x: number
  y: number
  parentX: number
}

/**
 * Rectangular cladogram layout. Tips are stacked at a fixed x so the labels
 * form a column; every internal node sits at the midpoint of its children and
 * at an x set by its depth from the root.
 */
function layout(root: Clade): { placed: Placed[]; height: number } {
  const placed: Placed[] = []
  let tipIndex = 0

  function walk(node: TreeNode, depth: number, parentX: number): number {
    if (node.kind === 'tip') {
      const y = TOP + tipIndex * TIP_GAP
      tipIndex += 1
      placed.push({ node, x: TIP_X, y, parentX })
      return y
    }
    const nodeX = ROOT_X + depth * DEPTH_STEP
    const childYs = node.children.map((child) => walk(child, depth + 1, nodeX))
    const y = (Math.min(...childYs) + Math.max(...childYs)) / 2
    placed.push({ node, x: nodeX, y, parentX })
    return y
  }

  walk(root, 0, ROOT_X - 24)
  return { placed, height: TOP + tipIndex * TIP_GAP + 30 }
}

function tipTooltip(tip: Tip): string {
  return (
    `<p class="t-date" style="color:${lineageColor(tip.lineage)}">Character state</p>` +
    `<p class="t-title">${esc(tip.name)}</p>` +
    `<p class="t-body">${esc(tip.note)}</p>` +
    `<ul class="t-links">${renderLinks(tip.links)}</ul>`
  )
}

/** A horizontal branch, split around its character mark if it carries one. */
function branch(root: SVGSVGElement, x1: number, x2: number, y: number, mark?: number): void {
  if (mark === undefined) {
    root.appendChild(line(x1, y, x2, y))
    return
  }
  const mid = (x1 + x2) / 2
  root.appendChild(line(x1, y, mid - MARK_RADIUS, y))
  root.appendChild(line(mid + MARK_RADIUS, y, x2, y))
  root.appendChild(
    svg('circle', { cx: mid, cy: y, r: MARK_RADIUS, fill: 'var(--paper)', stroke: 'var(--rule)', 'stroke-width': 1 }),
  )
  root.appendChild(
    text(String(mark), { x: mid, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'mark-num' }),
  )
}

function buildTree(): SVGSVGElement {
  const { placed, height } = layout(tree)
  const legendY = height - 12
  const root = svg('svg', {
    viewBox: `0 0 ${VIEW_WIDTH} ${height + 20}`,
    role: 'img',
    'aria-label':
      'Cladogram grouping fifteen positions on the self and consciousness by character state rather than historical descent',
  })

  for (const item of placed) {
    branch(root, item.parentX, item.x, item.y, item.node.kind === 'clade' ? item.node.mark : undefined)

    if (item.node.kind === 'clade') {
      const childYs = item.node.children.map((child) => placed.find((p) => p.node === child)?.y ?? item.y)
      root.appendChild(line(item.x, Math.min(...childYs), item.x, Math.max(...childYs)))
      continue
    }

    const tip = item.node
    const color = lineageColor(tip.lineage)
    const group = svg('g', { class: 'hit', tabindex: '0', role: 'button', 'aria-label': tip.name })
    group.dataset.id = tip.id
    group.appendChild(svg('circle', { class: 'ring', cx: item.x, cy: item.y, r: 10, fill: 'none', stroke: color, 'stroke-width': 1 }))
    group.appendChild(svg('circle', { class: 'dot', cx: item.x, cy: item.y, r: 4, fill: color }))
    group.appendChild(
      text(tip.name, { x: LABEL_X, y: item.y, 'dominant-baseline': 'central', class: 'node-label' }),
    )
    root.appendChild(group)
  }

  treeLegend.forEach((entry, index) => {
    const cx = 48 + index * 202
    root.appendChild(svg('circle', { cx, cy: legendY, r: 4, fill: lineageColor(entry.lineage) }))
    root.appendChild(text(entry.label, { x: cx + 12, y: legendY, 'dominant-baseline': 'central', class: 'legend-label' }))
  })

  return root
}

/** Readable fallback for the tooltips, and the place citations actually live. */
function buildPositions(tips: Tip[]): string {
  return tips
    .map(
      (tip) =>
        `<article class="entry" id="t-${esc(tip.id)}">` +
        `<div class="rail"><span class="swatch" style="background:${lineageColor(tip.lineage)}"></span>` +
        `${tip.lineage === 'europe' ? 'European' : 'South Asian'}</div>` +
        `<div><h3>${esc(tip.name)}</h3>` +
        `<p class="body">${esc(tip.note)}</p>` +
        `<ul class="links">${renderLinks(tip.links)}</ul></div>` +
        `</article>`,
    )
    .join('')
}

function buildCharacters(): string {
  return characters
    .map((character, index) => `<li><span class="num">${index + 1}</span><span>${esc(character)}</span></li>`)
    .join('')
}

function buildMatrix(): string {
  const head =
    `<tr><th class="school" scope="col">School</th>` +
    columns.map((column) => `<th scope="col">${esc(column.head[0])}<br>${esc(column.head[1])}</th>`).join('') +
    `</tr>`

  const body = rows
    .map((row) => {
      const cells = row.cells
        .map((cell) => {
          const symbol = symbols[cell]
          return `<td><span class="sym" role="img" aria-label="${esc(symbol.label)}">${symbol.glyph}</span></td>`
        })
        .join('')
      return (
        `<tr><th class="school" scope="row" style="font-weight:400">` +
        `<span class="swatch" style="background:${lineageColor(row.lineage)}"></span>${esc(row.school)}</th>${cells}</tr>`
      )
    })
    .join('')

  return `<thead>${head}</thead><tbody>${body}</tbody>`
}

function buildQuestions(): string {
  return columns
    .map(
      (column, index) =>
        `<li><span class="num">${index + 1}</span><span><strong>${esc(column.head.join(' '))}</strong> — ${esc(column.question)}</span></li>`,
    )
    .join('')
}

function init(): void {
  const shell = document.querySelector<HTMLElement>('.plot-shell')
  const scroll = document.querySelector<HTMLElement>('#tree')
  const tipNode = document.querySelector<HTMLElement>('#tip')
  if (!shell || !scroll || !tipNode) return

  scroll.appendChild(buildTree())

  const characterList = document.querySelector<HTMLElement>('#characters')
  if (characterList) characterList.innerHTML = buildCharacters()

  const matrix = document.querySelector<HTMLElement>('#matrix')
  if (matrix) matrix.innerHTML = buildMatrix()

  const key = document.querySelector<HTMLElement>('#matrix-key')
  if (key) {
    key.innerHTML = Object.values(symbols)
      .map((symbol) => `<span>${symbol.glyph} ${esc(symbol.label)}</span>`)
      .join('')
  }

  const questions = document.querySelector<HTMLElement>('#questions')
  if (questions) questions.innerHTML = buildQuestions()

  const tooltip = createTooltip(shell, tipNode)
  const tips = new Map<string, Tip>()
  const collect = (node: TreeNode): void => {
    if (node.kind === 'tip') tips.set(node.id, node)
    else node.children.forEach(collect)
  }
  collect(tree)

  const positions = document.querySelector<HTMLElement>('#positions')
  if (positions) positions.innerHTML = buildPositions([...tips.values()])

  for (const group of scroll.querySelectorAll<SVGGElement>('.hit')) {
    const tip = tips.get(group.dataset.id ?? '')
    const dot = group.querySelector<SVGCircleElement>('.dot')
    if (!tip || !dot) continue

    const open = (): void => tooltip.show(dot, tipTooltip(tip))
    group.addEventListener('mouseenter', open)
    group.addEventListener('focus', open)
    group.addEventListener('mouseleave', tooltip.scheduleHide)
    group.addEventListener('blur', tooltip.scheduleHide)

    const jump = (event: Event): void => {
      event.preventDefault()
      jumpToEntry(`t-${tip.id}`)
    }
    group.addEventListener('click', jump)
    group.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') jump(event)
    })
  }
}

init()
