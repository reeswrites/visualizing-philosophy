import { AXES, ORIG, STATES, idx, state } from '../lib/model.js'

/* The row editor. Every change is recorded against ORIG so a coding you have
   argued with is visibly yours and revertible one axis at a time. */
export function openEditor(id, onEdit) {
  const i = idx[id]
  const r = state.rows[i]

  document.getElementById('ename').textContent = r.name
  document.getElementById('enote').textContent = r.note

  const src = document.getElementById('esrc')
  src.textContent = (r.sourced === 'yes' ? 'Source: ' : '') + r.source
  src.className = r.sourced === 'yes' ? '' : 'no'

  const grid = document.getElementById('egrid')
  grid.innerHTML = AXES.map((ax) => {
    const chg = r[ax] !== ORIG[i][ax]
    const revert = chg
      ? `<button class="rv" data-ax="${ax}" title="revert to ${ORIG[i][ax]}"` +
        ` aria-label="Revert ${ax}">↺</button>`
      : ''
    const options = STATES[ax]
      .map((s) => `<option value="${s}"${s === r[ax] ? ' selected' : ''}>${s}</option>`)
      .join('')
    return (
      `<div><label for="ax-${ax}">${ax}${revert}</label>` +
      `<select id="ax-${ax}" class="${chg ? 'chg' : ''}" data-ax="${ax}">${options}</select></div>`
    )
  }).join('')

  document.getElementById('editor').classList.remove('hide')

  grid.querySelectorAll('select').forEach((sel) => {
    sel.addEventListener('change', () => {
      state.rows[i][sel.getAttribute('data-ax')] = sel.value
      onEdit()
      openEditor(id, onEdit)
    })
  })
  grid.querySelectorAll('.rv').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ax = btn.getAttribute('data-ax')
      state.rows[i][ax] = ORIG[i][ax]
      onEdit()
      openEditor(id, onEdit)
    })
  })
}

export function closeEditor() {
  document.getElementById('editor').classList.add('hide')
}
