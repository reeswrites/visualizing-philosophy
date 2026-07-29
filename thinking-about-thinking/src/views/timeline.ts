import '../styles/site.css'
import { events, lanes } from '../data/events'
import type { TimelineEvent } from '../lib/types'
import { createTooltip, esc, jumpToEntry, line, renderLinks, svg, text } from '../lib/ui'

/**
 * The axis is deliberately non-linear: the centuries between 600 and 200 BCE
 * are stretched because that is where nearly everything happens. Anchors map
 * a year to a fraction of the plot width, with linear interpolation between.
 */
const ANCHORS: [year: number, fraction: number][] = [
  [-2000, 0], [-1200, 0.1], [-800, 0.2], [-600, 0.34], [-400, 0.52],
  [-200, 0.66], [1, 0.76], [200, 0.86], [400, 0.97],
]

const TICKS: [year: number, label: string][] = [
  [-2000, '2000 BCE'], [-1200, '1200 BCE'], [-800, '800 BCE'], [-600, '600 BCE'],
  [-400, '400 BCE'], [-200, '200 BCE'], [1, '1 CE'], [200, '200 CE'], [400, '400 CE'],
]

const WIDTH = 1000
const LEFT = 64
const RIGHT = 966
const AXIS_Y = 58
const LANE_TOP = 96
const LANE_HEIGHT = 84
const ROW_HEIGHT = 27
/** Rough advance width of the label face at 15px, used for collision checks. */
const CHAR_WIDTH = 7.4

function fraction(year: number): number {
  if (year <= ANCHORS[0][0]) return 0
  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const [y0, f0] = ANCHORS[i]
    const [y1, f1] = ANCHORS[i + 1]
    if (year <= y1) return f0 + ((year - y0) / (y1 - y0)) * (f1 - f0)
  }
  return 1
}

const x = (year: number): number => LEFT + fraction(year) * (RIGHT - LEFT)

function tooltipHtml(event: TimelineEvent): string {
  const lane = lanes.find((l) => l.id === event.lane)
  return (
    `<p class="t-date" style="color:${lane?.color}">${esc(event.date)} · ${esc(lane?.name ?? '')}</p>` +
    `<p class="t-title">${esc(event.title)}</p>` +
    `<p class="t-where">${esc(event.where)}</p>` +
    `<p class="t-body">${event.body}</p>` +
    `<ul class="t-links">${renderLinks(event.links)}</ul>`
  )
}

function buildPlot(): SVGSVGElement {
  const height = LANE_TOP + (lanes.length - 1) * LANE_HEIGHT + ROW_HEIGHT * 2 + 34
  const root = svg('svg', {
    viewBox: `0 0 ${WIDTH} ${height}`,
    role: 'img',
    'aria-label': 'Timeline of early reflection on the mind across five regions, 1900 BCE to 400 CE',
  })

  // The axial age band.
  root.appendChild(
    svg('rect', {
      x: x(-600), y: AXIS_Y - 4,
      width: x(-200) - x(-600), height: height - AXIS_Y - 14,
      fill: 'var(--band)',
    }),
  )
  root.appendChild(
    text('THE AXIAL AGE', {
      x: (x(-600) + x(-200)) / 2, y: AXIS_Y - 16,
      'text-anchor': 'middle', class: 'band-note',
    }),
  )

  root.appendChild(line(LEFT - 14, AXIS_Y, RIGHT + 14, AXIS_Y))
  for (const [year, label] of TICKS) {
    root.appendChild(line(x(year), AXIS_Y, x(year), AXIS_Y + 7))
    root.appendChild(text(label, { x: x(year), y: AXIS_Y + 22, 'text-anchor': 'middle', class: 'axis-year' }))
  }

  lanes.forEach((lane, index) => {
    const top = LANE_TOP + index * LANE_HEIGHT
    root.appendChild(text(lane.name, { x: 0, y: top, class: 'lane-name', fill: lane.color }))

    const rule = line(LEFT - 14, top + 8, RIGHT + 14, top + 8)
    rule.setAttribute('stroke', 'var(--rule-soft)')
    root.appendChild(rule)

    // Two label rows per lane, filled greedily so labels never overlap.
    const rowEnd = [-Infinity, -Infinity]
    const items = events.filter((event) => event.lane === lane.id).sort((a, b) => a.year - b.year)

    for (const event of items) {
      const cx = x(event.year)
      const labelWidth = event.label.length * CHAR_WIDTH + 22
      const toTheRight = cx < 660
      const span: [number, number] = toTheRight ? [cx, cx + labelWidth] : [cx - labelWidth, cx]

      let row = span[0] < rowEnd[0] + 14 ? 1 : 0
      if (row === 1 && span[0] < rowEnd[1] + 14) row = 0
      rowEnd[row] = Math.max(rowEnd[row], span[1])

      const cy = top + 22 + row * ROW_HEIGHT
      const group = svg('g', {
        class: 'hit', tabindex: '0', role: 'button',
        'aria-label': `${event.title}, ${event.date}`,
      })
      group.dataset.id = event.id
      group.appendChild(svg('circle', { class: 'ring', cx, cy, r: 10, fill: 'none', stroke: lane.color, 'stroke-width': 1 }))
      group.appendChild(svg('circle', { class: 'dot', cx, cy, r: 4.5, fill: lane.color }))
      group.appendChild(
        text(event.label, {
          x: toTheRight ? cx + 13 : cx - 13, y: cy,
          'text-anchor': toTheRight ? 'start' : 'end',
          'dominant-baseline': 'central', class: 'node-label',
        }),
      )
      root.appendChild(group)
    }
  })

  return root
}

function buildEntries(): string {
  return [...events]
    .sort((a, b) => a.year - b.year)
    .map((event) => {
      const lane = lanes.find((l) => l.id === event.lane)
      return (
        `<article class="entry" id="e-${esc(event.id)}">` +
        `<div class="rail"><span class="swatch" style="background:${lane?.color}"></span>` +
        `${esc(lane?.name ?? '')}<br>${esc(event.date)}</div>` +
        `<div><h3>${esc(event.title)}</h3>` +
        `<p class="where">${esc(event.where)}</p>` +
        `<p class="body">${event.body}</p>` +
        `<ul class="links">${renderLinks(event.links)}</ul></div>` +
        `</article>`
      )
    })
    .join('')
}

function init(): void {
  const shell = document.querySelector<HTMLElement>('.plot-shell')
  const scroll = document.querySelector<HTMLElement>('#plot')
  const tipNode = document.querySelector<HTMLElement>('#tip')
  const entries = document.querySelector<HTMLElement>('#entries')
  if (!shell || !scroll || !tipNode || !entries) return

  scroll.appendChild(buildPlot())
  entries.innerHTML = buildEntries()

  const tooltip = createTooltip(shell, tipNode)
  const byId = new Map(events.map((event) => [event.id, event]))

  for (const group of scroll.querySelectorAll<SVGGElement>('.hit')) {
    const event = byId.get(group.dataset.id ?? '')
    if (!event) continue
    const dot = group.querySelector<SVGCircleElement>('.dot')
    if (!dot) continue

    const open = (): void => tooltip.show(dot, tooltipHtml(event))
    group.addEventListener('mouseenter', open)
    group.addEventListener('focus', open)
    group.addEventListener('mouseleave', tooltip.scheduleHide)
    group.addEventListener('blur', tooltip.scheduleHide)

    const jump = (e: Event): void => {
      e.preventDefault()
      jumpToEntry(`e-${event.id}`)
    }
    group.addEventListener('click', jump)
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') jump(e)
    })
  }
}

init()
