import type { Clade, Lineage, SourceLink, Tip } from '../lib/types'

function tip(
  id: string,
  name: string,
  lineage: Lineage,
  note: string,
  links: SourceLink[],
): Tip {
  return { kind: 'tip', id, name, lineage, note, links }
}

const sep = (label: string, slug: string): SourceLink => ({
  kind: 'background',
  label: `${label} (Stanford Encyclopedia)`,
  url: `https://plato.stanford.edu/entries/${slug}/`,
})

const wiki = (label: string, slug: string): SourceLink => ({
  kind: 'primary',
  label,
  url: `https://en.wikipedia.org/wiki/${slug}`,
})

const indianEpistemology = sep('Epistemology in Classical Indian Philosophy', 'epistemology-india')
const buddhistMind = sep('Mind in Indian Buddhist Philosophy', 'mind-indian-buddhism')

/**
 * The tree branches on character states, not on historical descent. Tips are
 * coloured by lineage so that convergence shows up as mixed colour inside a
 * clade. Adding a tip is just adding an object to a `children` array — the
 * layout is computed in `src/views/cladogram.ts`.
 */
export const tree: Clade = {
  kind: 'clade',
  children: [
    {
      kind: 'clade',
      mark: 1,
      character: 'A persisting subject exists.',
      children: [
        {
          kind: 'clade',
          mark: 3,
          character: 'The subject is pure witnessing, distinct from every mental content it witnesses.',
          children: [
            tip('samkhya', 'Samkhya and Yoga', 'south-asia',
              'Purusha is contentless awareness; mind itself falls on the side of nature, so thought is something witnessed rather than the witness.',
              [wiki('Samkhya', 'Samkhya'), indianEpistemology]),
            tip('advaita', 'Advaita Vedanta', 'south-asia',
              'Awareness is self-luminous — it reveals itself in the same act by which it reveals its object, the way a lamp lights itself while lighting the room.',
              [wiki('Advaita Vedanta', 'Advaita_Vedanta'), indianEpistemology]),
            tip('shaivism', 'Kashmir Shaivism', 'south-asia',
              'Adds vimarsa: awareness is not merely luminous but actively self-referring, which is what makes it agentive rather than a passive mirror.',
              [wiki('Kashmir Shaivism', 'Kashmir_Shaivism'), sep('Self-Consciousness', 'self-consciousness')]),
          ],
        },
        {
          kind: 'clade',
          mark: 4,
          character: 'The subject is a substance that bears states.',
          children: [
            tip('nyaya', 'Nyaya', 'south-asia',
              'A cognition is not self-revealing. Knowing that you know requires anuvyavasaya, a second cognition that takes the first as its object.',
              [wiki('Nyaya', 'Nyaya'), indianEpistemology]),
            tip('descartes', 'Descartes', 'europe',
              'The mind is transparent to itself: there is nothing in it of which it is not aware, and clear and distinct perception certifies its own truth.',
              [sep('Descartes', 'descartes'), sep('Self-Knowledge', 'self-knowledge')]),
          ],
        },
      ],
    },
    {
      kind: 'clade',
      mark: 2,
      character: 'No substantial subject can be known.',
      children: [
        tip('kant', 'Kant', 'europe',
          'The “I think” must be able to accompany all my representations — but it is a formal condition of experience, not an object experience could disclose.',
          [sep('Kant', 'kant'), sep('Self-Knowledge', 'self-knowledge')]),
        {
          kind: 'clade',
          mark: 5,
          character: 'There is no subject at all, only events.',
          children: [
            {
              kind: 'clade',
              mark: 6,
              character: 'Awareness reveals itself in the same act by which it reveals its object.',
              children: [
                tip('yogacara', 'Yogacara', 'south-asia',
                  'Svasamvedana: every act of awareness carries an implicit awareness of itself. Paired with the alayavijnana, a substrate that shapes experience without appearing in it.',
                  [wiki('Yogacara', 'Yogachara'), buddhistMind]),
                tip('dignaga', 'Dignaga and Dharmakirti', 'south-asia',
                  'Build the epistemology out: without self-awareness there would be no memory of having perceived, since we never separately perceive our perceiving.',
                  [wiki('Dignaga', 'Dignaga'), buddhistMind]),
                tip('phenomenology', 'Phenomenology (Husserl, Sartre)', 'europe',
                  'Experience is pre-reflectively self-aware. Reflection does not create the acquaintance, it only makes explicit what was already there.',
                  [sep('Phenomenology', 'phenomenology'), sep('Self-Consciousness', 'self-consciousness')]),
                tip('selfrep', 'Self-representationalism (Kriegel)', 'europe',
                  'A conscious state represents itself as part of representing its object — the analytic reinvention of the same-order view, now in explicit dialogue with Dharmakirti.',
                  [sep('Consciousness', 'consciousness'), sep('Self-Consciousness', 'self-consciousness')]),
              ],
            },
            {
              kind: 'clade',
              mark: 7,
              character: 'Awareness does not reveal itself; knowing that you know takes a further act.',
              children: [
                tip('abhidhamma', 'Abhidhamma', 'south-asia',
                  'Experience is a stream of momentary events in a fixed processing sequence. Nothing in the list of factors is a reflexive act, and nothing behind them is a self.',
                  [wiki('Abhidharma', 'Abhidharma'), buddhistMind]),
                tip('madhyamaka', 'Madhyamaka', 'south-asia',
                  'Reflexivity is incoherent: a blade cannot cut itself, and the self-illuminating lamp assumes what it was meant to prove.',
                  [wiki('Madhyamaka', 'Madhyamaka'), sep('Nāgārjuna', 'nagarjuna')]),
                tip('hume', 'Hume', 'europe',
                  'Entering most intimately into what he calls himself, he stumbles on a perception and never on the perceiver. The self is a bundle, and its unity a habit.',
                  [sep('Hume', 'hume'), sep('Self-Knowledge', 'self-knowledge')]),
                tip('hot', 'Higher-order theories (Rosenthal)', 'europe',
                  'A mental state is conscious when a further state is about it. Structurally the Nyaya position, arrived at independently and in English.',
                  [sep('Consciousness', 'consciousness'), sep('Self-Consciousness', 'self-consciousness')]),
                tip('illusionism', 'Illusionism (Dennett, Frankish)', 'europe',
                  'Introspection is not observation of an inner display but a fallible theorising about oneself — the seeming is real, what it seems to be is not.',
                  [sep('Consciousness', 'consciousness'), sep('Self-Knowledge', 'self-knowledge')]),
              ],
            },
          ],
        },
      ],
    },
  ],
}

/** The numbered marks drawn on branches, in order. */
export const characters: string[] = [
  'A persisting subject exists.',
  'No substantial subject can be known.',
  'The subject is pure witnessing, distinct from every mental content it witnesses.',
  'The subject is a substance that bears states.',
  'There is no subject at all, only events.',
  'Awareness reveals itself in the same act by which it reveals its object.',
  'Awareness does not reveal itself; knowing that you know takes a further act.',
]

export const treeLegend: { lineage: Lineage; label: string }[] = [
  { lineage: 'south-asia', label: 'South Asian traditions' },
  { lineage: 'europe', label: 'European traditions' },
]
