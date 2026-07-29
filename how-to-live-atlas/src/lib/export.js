import { AXES, state } from './model.js'

function download(name, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 800)
}

/* Exports the edited codings in the same shape as positions.csv, so a
   disagreement can go back into the source data rather than staying in a tab. */
export function exportCSV() {
  const cols = ['id', 'name', 'cluster', 'era', ...AXES, 'confidence', 'sourced', 'source', 'note']
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = state.rows.map((r) => cols.map((c) => esc(r[c])).join(','))
  download('positions-edited.csv', [cols.join(','), ...body].join('\n'), 'text/csv')
}

/* The page styles the SVG from the stylesheet, which a detached file cannot
   reach — so the exported copy carries the rules it actually needs inline. */
export function exportSVG() {
  const svg = document.getElementById('atlas').cloneNode(true)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent =
    '.leaf{font:11.4px Palatino,Georgia,serif;fill:#16232B}' +
    '.mark{font-size:7px;fill:#5E727D}.flag{fill:#9B3A3A}.unsrc{fill:#5E727D}' +
    '.eyebrow{font:7.4px monospace;fill:#5E727D;letter-spacing:.15em}' +
    '.lin{stroke:#B0742A}.con{stroke:#2E7D6B}.sch{stroke:#9B3A3A}' +
    '.off{display:none}'
  svg.insertBefore(style, svg.firstChild)
  download('premise-tree.svg', new XMLSerializer().serializeToString(svg), 'image/svg+xml')
}
