import type { Lineage, SourceLink } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Create an SVG element with attributes. */
export function svg<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, name)
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value))
  return node
}

/** A straight line in the current stroke colour. */
export function line(x1: number, y1: number, x2: number, y2: number): SVGLineElement {
  return svg('line', { x1, y1, x2, y2, stroke: 'var(--rule)', 'stroke-width': 1 })
}

export function text(content: string, attrs: Record<string, string | number>): SVGTextElement {
  const node = svg('text', attrs)
  node.textContent = content
  return node
}

export function lineageColor(lineage: Lineage): string {
  return `var(--${lineage})`
}

/** Escape a string for safe interpolation into innerHTML. */
export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

/**
 * Render a list of citations. Link labels are escaped; body text elsewhere is
 * authored in `src/data` and may contain deliberate <em> markup.
 */
export function renderLinks(links: SourceLink[]): string {
  return links
    .map(
      (link) =>
        `<li class="src"><span class="tag">${link.kind}</span>` +
        `<a href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a></li>`,
    )
    .join('')
}

export interface Tooltip {
  show(anchor: SVGGraphicsElement, html: string): void
  scheduleHide(): void
  hide(): void
}

/**
 * A hoverable tooltip pinned above (or below, if there is no room) an anchor
 * element. It stays open while the pointer is inside it, so the citation
 * links are actually clickable.
 */
export function createTooltip(shell: HTMLElement, tip: HTMLElement): Tooltip {
  let pointerInside = false
  let timer: number | undefined

  tip.addEventListener('mouseenter', () => {
    pointerInside = true
    window.clearTimeout(timer)
  })
  tip.addEventListener('mouseleave', () => {
    pointerInside = false
    scheduleHide()
  })

  function hide(): void {
    tip.classList.remove('on')
  }

  function scheduleHide(): void {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      if (!pointerInside) hide()
    }, 160)
  }

  function show(anchor: SVGGraphicsElement, html: string): void {
    window.clearTimeout(timer)
    tip.innerHTML = html
    tip.classList.add('on')

    const shellBox = shell.getBoundingClientRect()
    const anchorBox = anchor.getBoundingClientRect()
    const width = tip.offsetWidth
    const height = tip.offsetHeight

    const centred = anchorBox.left - shellBox.left + anchorBox.width / 2 - width / 2
    const left = Math.max(4, Math.min(centred, shellBox.width - width - 4))

    let top = anchorBox.top - shellBox.top - height - 14
    if (top < 0) top = anchorBox.bottom - shellBox.top + 14

    tip.style.left = `${left}px`
    tip.style.top = `${top}px`
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide()
  })
  window.addEventListener('resize', hide)

  return { show, scheduleHide, hide }
}

/** Scroll to an entry and highlight it briefly. */
export function jumpToEntry(id: string): void {
  const target = document.getElementById(id)
  if (!target) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
  for (const node of document.querySelectorAll('.flash')) node.classList.remove('flash')
  target.classList.add('flash')
}
