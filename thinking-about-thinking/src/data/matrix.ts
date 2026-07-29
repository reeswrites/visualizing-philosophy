import type { MatrixColumn, MatrixRow } from '../lib/types'

export const columns: MatrixColumn[] = [
  {
    head: ['Persisting', 'subject'],
    question: 'Is there a subject that persists through the succession of mental events?',
  },
  {
    head: ['Self-luminous', 'awareness'],
    question: 'Does an act of awareness reveal itself in the same act by which it reveals its object?',
  },
  {
    head: ['Truth intrinsic', 'to cognition'],
    question:
      'Does a cognition certify its own truth (svatah-pramanya), or must validity be established by something further (paratah-pramanya)?',
  },
  {
    head: ['Privileged', 'self-access'],
    question: 'Is a subject’s access to their own mental states epistemically better than their access to anything else?',
  },
  {
    head: ['Trained first-person', 'method'],
    question: 'Is disciplined introspection treated as a legitimate instrument for producing evidence?',
  },
]

export const rows: MatrixRow[] = [
  { school: 'Advaita Vedanta', lineage: 'south-asia', cells: ['yes', 'yes', 'yes', 'yes', 'yes'] },
  { school: 'Samkhya and Yoga', lineage: 'south-asia', cells: ['yes', 'yes', 'mixed', 'yes', 'yes'] },
  { school: 'Mimamsa (Prabhakara)', lineage: 'south-asia', cells: ['yes', 'yes', 'yes', 'yes', 'no'] },
  { school: 'Nyaya', lineage: 'south-asia', cells: ['yes', 'no', 'no', 'no', 'no'] },
  { school: 'Yogacara', lineage: 'south-asia', cells: ['no', 'yes', 'mixed', 'yes', 'yes'] },
  { school: 'Abhidhamma', lineage: 'south-asia', cells: ['no', 'no', 'mixed', 'yes', 'yes'] },
  { school: 'Madhyamaka', lineage: 'south-asia', cells: ['no', 'no', 'no', 'no', 'yes'] },
  { school: 'Descartes', lineage: 'europe', cells: ['yes', 'yes', 'yes', 'yes', 'no'] },
  { school: 'Phenomenology', lineage: 'europe', cells: ['mixed', 'yes', 'mixed', 'yes', 'yes'] },
  { school: 'Higher-order theories', lineage: 'europe', cells: ['no', 'no', 'no', 'no', 'no'] },
]

export const symbols: Record<MatrixRow['cells'][number], { glyph: string; label: string }> = {
  yes: { glyph: '●', label: 'affirms' },
  no: { glyph: '○', label: 'denies' },
  mixed: { glyph: '◐', label: 'contested or qualified within the school' },
}
