/** Where a position or text historically comes from. Used for colour only. */
export type Lineage = 'near-east' | 'south-asia' | 'greece' | 'east-asia' | 'europe'

/** A citation. `primary` points at the text; `background` at scholarship about it. */
export interface SourceLink {
  kind: 'primary' | 'background'
  label: string
  url: string
}

/* ---------- timeline ---------- */

export interface Lane {
  id: Lineage
  name: string
  /** CSS custom property reference, e.g. "var(--india)". */
  color: string
}

export interface TimelineEvent {
  id: string
  lane: Lineage
  /** Negative for BCE. Used for placement; `date` is what readers see. */
  year: number
  /** Short label drawn beside the point on the plot. Keep under ~32 characters. */
  label: string
  title: string
  date: string
  where: string
  /** May contain inline <em> markup. */
  body: string
  links: SourceLink[]
}

/* ---------- cladogram ---------- */

export interface Tip {
  kind: 'tip'
  id: string
  name: string
  lineage: Lineage
  note: string
  links: SourceLink[]
}

export interface Clade {
  kind: 'clade'
  /** Number drawn on the branch entering this clade. */
  mark?: number
  /** The shared derived character that defines the clade. */
  character?: string
  children: TreeNode[]
}

export type TreeNode = Tip | Clade

/* ---------- character matrix ---------- */

export type CellValue = 'yes' | 'no' | 'mixed'

export interface MatrixColumn {
  /** Two lines of header text. */
  head: [string, string]
  /** The question the column actually asks, shown below the table. */
  question: string
}

export interface MatrixRow {
  school: string
  lineage: Lineage
  cells: CellValue[]
}
