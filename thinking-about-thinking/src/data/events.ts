import type { Lane, TimelineEvent } from '../lib/types'

export const lanes: Lane[] = [
  { id: 'near-east', name: 'Near east', color: 'var(--near-east)' },
  { id: 'south-asia', name: 'India', color: 'var(--south-asia)' },
  { id: 'greece', name: 'Greece', color: 'var(--greece)' },
  { id: 'east-asia', name: 'China', color: 'var(--east-asia)' },
  { id: 'europe', name: 'Latin west', color: 'var(--europe)' },
]

export const events: TimelineEvent[] = [
  {
    id: 'ba',
    lane: 'near-east',
    year: -1900,
    label: 'Dispute with the ba',
    title: 'The dispute between a man and his ba',
    date: 'c. 1900 BCE',
    where: 'Middle Kingdom Egypt',
    body:
      'A man argues with his own soul about whether to go on living. The self appears split into two parties who disagree and must be reasoned with — the oldest surviving text that takes inner conflict as its subject. Nothing was built on it: no taxonomy of mental events, no training. This is introspection as literature rather than as method.',
    links: [
      {
        kind: 'primary',
        label: 'Text, translation history and fragments',
        url: 'https://en.wikipedia.org/wiki/Dispute_between_a_man_and_his_Ba',
      },
      {
        kind: 'background',
        label: 'Lichtheim, Ancient Egyptian Literature (archive search)',
        url: 'https://archive.org/search?query=Lichtheim+Ancient+Egyptian+Literature',
      },
    ],
  },
  {
    id: 'ludlul',
    lane: 'near-east',
    year: -1200,
    label: 'Ludlul bel nemeqi',
    title: 'Ludlul bēl nēmeqi',
    date: 'c. 1200 BCE',
    where: 'Kassite Babylonia',
    body:
      'The “Babylonian Job.” A sufferer audits his own conduct, finds nothing to condemn, and then doubts the audit — wondering whether what people call good might look otherwise to the gods. Moral self-examination combined with explicit doubt about the reliability of one’s own judgment.',
    links: [
      {
        kind: 'primary',
        label: 'Alan Lenzi, full translation (PDF)',
        url: 'https://scholarlycommons.pacific.edu/cgi/viewcontent.cgi?article=1189&context=cop-facbooks',
      },
      {
        kind: 'primary',
        label: 'Critical edition, electronic Babylonian Library',
        url: 'https://www.ebl.lmu.de/corpus/L/2/2',
      },
    ],
  },
  {
    id: 'homer',
    lane: 'greece',
    year: -750,
    label: 'Homer: thumos',
    title: 'Homer and the divided thumos',
    date: 'c. 750 BCE',
    where: 'Archaic Greece',
    body:
      'Characters address their own thumos at moments of crisis — Odysseus telling his heart to endure, having endured worse. Bruno Snell read this as evidence that Homeric people had no unified self, only a bundle of quasi-independent organs speaking to them like external voices. Bernard Williams largely dismantled the thesis. What survives the dispute is the soliloquy itself: a mind addressed as though it were two.',
    links: [
      { kind: 'primary', label: 'The Odyssey (Project Gutenberg)', url: 'https://www.gutenberg.org/ebooks/1727' },
      {
        kind: 'background',
        label: 'Ancient Theories of Soul (Stanford Encyclopedia)',
        url: 'https://plato.stanford.edu/entries/ancient-soul/',
      },
    ],
  },
  {
    id: 'brihad',
    lane: 'south-asia',
    year: -700,
    label: 'Brihadaranyaka Upanishad',
    title: 'The Brihadaranyaka Upanishad',
    date: 'c. 700 BCE',
    where: 'Northern India',
    body:
      'Yajnavalkya states the problem everything later circles: you cannot see the seer of seeing, hear the hearer of hearing, or think the thinker of thinking. The knowing subject can never be captured as an object of its own knowledge. Kant’s paralogisms and Wittgenstein’s eye that cannot see itself arrive at the same structural point some twenty-five centuries later — but here it is treated as a doorway rather than a puzzle.',
    links: [
      {
        kind: 'primary',
        label: 'Max Müller translation, complete',
        url: 'https://www.hinduwebsite.com/sacredscripts/hinduism/upanishads/brihad.asp',
      },
      {
        kind: 'background',
        label: 'Overview and dating',
        url: 'https://en.wikipedia.org/wiki/Brihadaranyaka_Upanishad',
      },
    ],
  },
  {
    id: 'heraclitus',
    lane: 'greece',
    year: -500,
    label: 'Heraclitus',
    title: 'Heraclitus searches into himself',
    date: 'c. 500 BCE',
    where: 'Ephesus',
    body:
      'The first Greek to make looking inward a stated programme: he says he went searching into himself, and elsewhere that you could travel every road without finding the limits of the soul, so deep is its logos. Assertion rather than method — but it points the direction the Greek line would take.',
    links: [
      {
        kind: 'primary',
        label: 'Fragments in translation (archive search)',
        url: 'https://archive.org/search?query=Heraclitus+fragments+Burnet',
      },
      { kind: 'background', label: 'Heraclitus (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/heraclitus/' },
    ],
  },
  {
    id: 'sati',
    lane: 'south-asia',
    year: -450,
    label: 'Satipatthana sutta',
    title: 'The Satipatthana Sutta',
    date: 'c. 450 BCE',
    where: 'Magadha',
    body:
      'Mind-watching specified as a repeatable practice. The third of its four foundations is the observation of mental states as states: one knows a mind with craving <em>as</em> a mind with craving. Not the content of the thought — the condition of the thinking. Metacognitive monitoring, written out as an instruction set rather than described.',
    links: [
      {
        kind: 'primary',
        label: 'Thanissaro Bhikkhu translation (Access to Insight)',
        url: 'https://www.accesstoinsight.org/tipitaka/mn/mn.010.than.html',
      },
      { kind: 'primary', label: 'Bhikkhu Sujato translation (SuttaCentral)', url: 'https://suttacentral.net/mn10/en/sujato' },
      {
        kind: 'background',
        label: 'Mind in Indian Buddhist Philosophy (Stanford Encyclopedia)',
        url: 'https://plato.stanford.edu/entries/mind-indian-buddhism/',
      },
    ],
  },
  {
    id: 'greeks',
    lane: 'greece',
    year: -360,
    label: 'Plato, Aristotle',
    title: 'Plato and Aristotle',
    date: 'c. 380–350 BCE',
    where: 'Athens',
    body:
      'Plato’s <em>Theaetetus</em> defines thinking as the soul’s silent conversation with itself, asking and answering, with belief the point where the dialogue settles. Aristotle’s <em>De Anima</em> III.2 asks whether we also perceive that we are perceiving, worries about the regress a separate faculty would create, and locates reflexivity inside perception rather than above it. In <em>Metaphysics</em> Lambda, thought thinking itself becomes the structure of the divine.',
    links: [
      { kind: 'primary', label: 'Plato, Theaetetus (Internet Classics Archive)', url: 'https://classics.mit.edu/Plato/theatu.html' },
      { kind: 'primary', label: 'Aristotle, On the Soul (Internet Classics Archive)', url: 'https://classics.mit.edu/Aristotle/soul.html' },
      {
        kind: 'background',
        label: 'Aristotle’s Psychology (Stanford Encyclopedia)',
        url: 'https://plato.stanford.edu/entries/aristotle-psychology/',
      },
    ],
  },
  {
    id: 'china',
    lane: 'east-asia',
    year: -330,
    label: 'Zhuangzi, inward training',
    title: 'Zhuangzi and Inward Training',
    date: 'c. 350–300 BCE',
    where: 'Warring States China',
    body:
      'The <em>Zhuangzi</em> describes the “fasting of the mind”; the <em>Guanzi</em>’s <em>Neiye</em>, or Inward Training, gives breath-and-attention instructions in rhymed verse — the oldest received Chinese text describing meditation technique. Meanwhile Mencius and Xunzi argue about what the heart-mind actually does. Closer to the Indian project than is usually noticed, and as far as anyone can tell, independent of it.',
    links: [
      { kind: 'primary', label: 'Zhuangzi (Chinese Text Project)', url: 'https://ctext.org/zhuangzi' },
      { kind: 'primary', label: 'Guanzi, containing the Neiye (Chinese Text Project)', url: 'https://ctext.org/guanzi' },
      { kind: 'background', label: 'Zhuangzi (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/zhuangzi/' },
      { kind: 'background', label: 'The Neiye: dating and translations', url: 'https://en.wikipedia.org/wiki/Neiye' },
    ],
  },
  {
    id: 'abhi',
    lane: 'south-asia',
    year: -200,
    label: 'Abhidhamma',
    title: 'The Abhidhamma',
    date: 'from c. 200 BCE',
    where: 'India and Sri Lanka',
    body:
      'Experience decomposed into momentary constituents. The Theravada system catalogues eighty-nine types of consciousness and fifty-two mental factors, and specifies the <em>citta-vithi</em>, a fixed sequence of mind-moments through which a single perception unfolds: adverting, sensing, receiving, investigating, determining, apperceiving, registering. A processing pipeline with stages, derived by introspection and argument rather than instrumentation — and with no self behind it.',
    links: [
      { kind: 'primary', label: 'Abhidhamma texts (Access to Insight)', url: 'https://www.accesstoinsight.org/tipitaka/abhi/index.html' },
      {
        kind: 'primary',
        label: 'The Abhidhamma Pitaka: structure and contents',
        url: 'https://en.wikipedia.org/wiki/Abhidhamma_Pi%E1%B9%ADaka',
      },
      {
        kind: 'background',
        label: 'Mind in Indian Buddhist Philosophy (Stanford Encyclopedia)',
        url: 'https://plato.stanford.edu/entries/mind-indian-buddhism/',
      },
    ],
  },
  {
    id: 'stoics',
    lane: 'greece',
    year: 100,
    label: 'Stoic assent',
    title: 'Stoic assent',
    date: 'c. 100 CE',
    where: 'Rome',
    body:
      'An impression arrives, and the decisive act is whether you assent to it. Epictetus notes that reason is the one faculty that examines both itself and everything else: you inspect your impressions before endorsing them. This is metacognitive control theorised as an ethical technology — not a puzzle about consciousness but a discipline for living.',
    links: [
      { kind: 'primary', label: 'Epictetus, Discourses (Internet Classics Archive)', url: 'https://classics.mit.edu/Epictetus/discourses.html' },
      { kind: 'background', label: 'Stoicism (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/stoicism/' },
    ],
  },
  {
    id: 'nagarjuna',
    lane: 'south-asia',
    year: 200,
    label: 'Madhyamaka critique',
    title: 'Nagarjuna and the Madhyamaka critique',
    date: 'c. 200 CE onward',
    where: 'India',
    body:
      'The counterargument, from inside the tradition. Reflexive awareness is attacked as incoherent: a fingertip cannot touch itself, a blade cannot cut itself, and the lamp that illuminates itself while illuminating the room assumes exactly what it is meant to prove. Candrakirti presses the case, and Tsongkhapa later makes rejecting self-awareness a defining Gelug position.',
    links: [
      {
        kind: 'primary',
        label: 'Vigrahavyavartani in translation (archive search)',
        url: 'https://archive.org/search?query=Vigrahavyavartani+Nagarjuna',
      },
      { kind: 'background', label: 'Nāgārjuna (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/nagarjuna/' },
    ],
  },
  {
    id: 'yogacara',
    lane: 'south-asia',
    year: 350,
    label: 'Yogacara',
    title: 'Yogacara',
    date: 'c. 350 CE',
    where: 'India',
    body:
      'Asanga and Vasubandhu add two ideas with long consequences. The <em>alayavijnana</em>, or storehouse consciousness, is a subpersonal substrate carrying dispositional seeds that shape experience without appearing in it — a theory of the unconscious some fifteen centuries before Freud, and better integrated with a theory of perception. <em>Svasamvedana</em> is the claim that every act of awareness includes an implicit awareness of itself.',
    links: [
      { kind: 'primary', label: 'Yogacara: texts, figures and key doctrines', url: 'https://en.wikipedia.org/wiki/Yogachara' },
      {
        kind: 'background',
        label: 'Mind in Indian Buddhist Philosophy (Stanford Encyclopedia)',
        url: 'https://plato.stanford.edu/entries/mind-indian-buddhism/',
      },
      { kind: 'background', label: 'Self-Consciousness (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/self-consciousness/' },
    ],
  },
  {
    id: 'augustine',
    lane: 'europe',
    year: 400,
    label: 'Augustine, Confessions',
    title: 'Augustine’s Confessions',
    date: 'c. 400 CE',
    where: 'Roman North Africa',
    body:
      'The Latin tradition finally turns fully inward: a book addressed to God that is really an excavation of its author. Memory appears as vast chambers he cannot fathom although they are himself; the will is found to will and not will at once. It is the nearest Western equivalent to what India had been doing for centuries — and the West would take another millennium and a half to get from here to Husserl.',
    links: [
      { kind: 'primary', label: 'Confessions, complete (New Advent)', url: 'https://www.newadvent.org/fathers/1101.htm' },
      { kind: 'background', label: 'Augustine (Stanford Encyclopedia)', url: 'https://plato.stanford.edu/entries/augustine/' },
    ],
  },
]
