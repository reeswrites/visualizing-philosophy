import { useState, useMemo, useRef, useEffect } from "react";

/* ===== LOGIC:START =====  everything to LOGIC:END is pure JS with no React or
   DOM dependency at module level, so belief-mart.test.mjs can import and test it.
   Keep new data and scoring rules inside these markers. ===== */

/* ------------------------------------------------------------------ */
/*  THE TRADITIONS                                                     */
/* ------------------------------------------------------------------ */

const FAITHS = [
  { id: "cath", name: "Catholic & Orthodox Christianity", line: "sacrament, tradition, one church", core: ["god-personal", "fallen", "resurrection", "law-ritual", "clergy", "weekly"], caveat: "Catholic and Orthodox Christianity share an entry despite real differences. Orthodoxy speaks of ancestral rather than original sin and denies inherited guilt, though it affirms the inherited corruption this shelf actually asks about." },
  { id: "evan", name: "Evangelical Protestantism", line: "scripture alone, grace alone", core: ["god-personal", "fallen", "grace", "one-book", "heaven-hell", "universal", "outsiders-lost"], caveat: "Tagged from US survey data, where evangelicals split roughly evenly on whether other religions can lead to eternal life while their leadership does not. Evangelicalism outside the US varies widely." },
  { id: "main", name: "Mainline Protestantism", line: "the same book, read more loosely", core: ["god-personal", "grace", "many-roads", "injustice", "weekly", "sabbath"], caveat: "Derived from the evangelical entry with documented divergences rather than tagged independently, so it inherits any error there." },
  { id: "islam", name: "Sunni Islam", line: "one God, one book, five prayers", core: ["god-personal", "daily-prayer", "one-book", "deeds", "resurrection", "obligation-poor", "convert-in"] },
  { id: "jud", name: "Rabbinic Judaism", line: "a people, a law, and an argument", core: ["god-personal", "law-ritual", "sabbath", "food-rules", "a-people", "injustice", "not-our-business"] },
  { id: "vedanta", name: "Advaita Vedanta", line: "Hinduism: you were never separate", core: ["god-impersonal", "forgetting", "rebirth", "dissolve", "veil", "meditation-path"], caveat: "Hinduism is split only two ways here, into Advaita and devotional practice. That leaves out Vishishtadvaita, Dvaita, Shaiva and Shakta traditions, temple Hinduism, and the dharmic mainstream." },
  { id: "bhakti", name: "Devotional Hinduism", line: "bhakti: love is the shortest road", core: ["god-personal", "devotion", "rebirth", "chanting", "pilgrimage", "cycles"], caveat: "A movement spanning a thousand years and many languages, not a single school. Its saints proclaimed equality before God; whether it changed anything socially is a live argument, and Ambedkar's answer was no." },
  { id: "thera", name: "Theravada Buddhism", line: "see clearly, let go", core: ["craving", "rebirth", "meditation-path", "monastics", "dissolve", "compassion"] },
  { id: "zen", name: "Zen & Mahayana Buddhism", line: "wake up, then come back for everyone", core: ["forgetting", "sitting", "teacher", "interconnected", "compassion", "monastics"] },
  { id: "sikh", name: "Sikhism", line: "one God, one kitchen, no priests", core: ["god-personal", "equality", "forgetting", "chanting", "obligation-poor", "one-book"] },
  { id: "jain", name: "Jainism", line: "harm nothing, whatever it costs", core: ["ahimsa", "rebirth", "uncreated", "food-rules", "monastics", "deeds"] },
  { id: "tao", name: "Daoism", line: "the way, and the temples that grew on it", core: ["god-impersonal", "nothing-wrong", "interconnected", "uncreated", "alone", "spirits"], caveat: "Western scholarship long split Daoism into philosophical daojia and religious daojiao. Daoists themselves have generally ignored that line, and recent scholarship treats the two as inseparable, so both strands are folded together here." },
  { id: "conf", name: "Confucianism", line: "order, family, cultivated character", core: ["family-order", "elders", "virtue", "ancestors", "law-ritual", "injustice"] },
  { id: "shinto", name: "Shinto", line: "the kami are already here", core: ["spirits", "altar", "seasons", "a-people", "nothing-wrong", "no-tell"] },
  { id: "bahai", name: "Bahá'í Faith", line: "one humanity, revelation still unfolding", core: ["god-personal", "progress", "universal", "equality", "deeds", "daily-prayer", "many-roads"] },
  { id: "zoro", name: "Zoroastrianism", line: "good thoughts, good words, good deeds", core: ["god-personal", "heaven-hell", "resurrection", "deeds", "one-arc", "seasons"] },
  { id: "pagan", name: "Modern Paganism & Wicca", line: "the wheel of the year", core: ["gods-many", "seasons", "harm-none", "own-experience", "local", "interconnected"] },
  { id: "uu", name: "Unitarian Universalism", line: "bring your own theology", core: ["own-experience", "compassion", "injustice", "weekly", "equality", "many-roads"] },
  { id: "human", name: "Secular Humanism", line: "this life, this world, our problem", core: ["no-gods", "lights-out", "evidence", "reduce-suffering", "no-practice", "injustice"] },
  { id: "stoic", name: "Stoicism", line: "nature, reason, and what's up to you", core: ["god-impersonal", "craving", "virtue", "reason-path", "alone", "interconnected"], caveat: "A philosophy rather than a religion, and its god fits no modern label cleanly — scholars reach for pantheist, panentheist and theist in turn, all anachronistic. It also has one of the thinnest carts here, which flatters it: a tradition with few recorded positions rarely disagrees with you, and some of that silence is this shelf's gap rather than Stoicism's." },
  { id: "deism", name: "Deism", line: "a maker who left no instructions", core: ["clockmaker", "evidence", "no-practice", "alone", "reason-path"], caveat: "Never an organised body with agreed doctrine, so this is a reconstruction from what individual deists argued. It is the quietest entry here — silent on most of the shelves — which means a high score against it says more about what it declines to rule out than about what it holds." },
  { id: "animist", name: "Animist traditions", line: "a world full of persons, only some of them human", core: ["spirits", "ancestors", "elders", "local", "seasons", "a-people"], caveat: "Animism is an outsider's analytic category, coined by E. B. Tylor in 1871 for what he considered primitive religion. Graham Harvey and Nurit Bird-David have since reclaimed it to mean a relational way of living among other-than-human persons. Either way it covers thousands of unrelated traditions, and no single entry can speak for them." },
];

const FAITH_BY_ID = Object.fromEntries(FAITHS.map((f) => [f.id, f]));

/* ------------------------------------------------------------------ */
/*  THE SHELVES                                                        */
/*  y = this tradition affirms it   p = partly / some schools          */
/*  n = this tradition rejects it   d = how much it asks of you (1-5)  */
/* ------------------------------------------------------------------ */

const AISLES = [
  {
    n: 1,
    name: "Who or what is in charge",
    items: [
      { id: "god-personal", t: "One God who listens", s: "A single mind behind everything, and it knows your name.", d: 2, y: ["cath", "evan", "islam", "jud", "sikh", "bhakti", "zoro", "bahai"], p: ["uu", "stoic", "vedanta"], n: ["thera", "zen", "human", "deism", "jain"] },
      { id: "god-impersonal", t: "One reality, no personality", s: "The ground of everything — not a person, not watching.", d: 2, y: ["vedanta", "tao", "stoic"], p: ["zen", "uu", "bahai", "cath"], n: ["evan", "islam", "bhakti"] },
      { id: "gods-many", t: "Many gods", s: "Different powers for different parts of life, all real.", d: 2, y: ["pagan", "shinto", "animist"], p: ["bhakti", "thera", "tao"], n: ["islam", "jud", "evan", "cath", "sikh", "bahai", "human", "zoro"] },
      { id: "pantheism", t: "The universe is the divine", s: "Nothing outside it made it. The thing itself is holy.", d: 1, y: ["vedanta", "tao", "pagan", "stoic"], p: ["shinto", "animist", "uu", "zen"], n: ["islam", "jud", "evan", "cath", "bahai", "zoro"] },
      { id: "no-gods", t: "No gods at all", s: "Nature is the whole story. Nobody is home upstairs.", d: 1, y: ["human"], p: ["uu"], n: ["islam", "cath", "evan", "jud", "sikh", "bhakti", "bahai", "zoro", "deism", "pagan"] },
      { id: "clockmaker", t: "A maker who stepped back", s: "Something started this and has not intervened since.", d: 1, y: ["deism"], p: ["conf", "animist"], n: ["evan", "islam", "bhakti", "cath", "jud"] },
      { id: "spirits", t: "Spirits in rivers, mountains, houses", s: "The world is populated, not empty.", d: 2, y: ["shinto", "animist", "pagan"], p: ["tao", "bhakti", "thera", "conf", "cath", "islam"], n: ["evan", "human", "stoic", "jud"] },
      { id: "unknowable", t: "Real, but past understanding", s: "Whatever it is, every word we have for it is wrong.", d: 1, y: ["vedanta", "tao", "bahai", "zen"], p: ["cath", "jud", "islam", "uu", "thera"], n: ["evan", "human"] },
    ],
  },
  {
    n: 2,
    name: "What's wrong with us",
    items: [
      { id: "fallen", t: "We are born bent", s: "Something in us is crooked and we can't straighten it alone.", d: 2, y: ["evan", "cath"], p: ["zoro"], n: ["islam", "jud", "vedanta", "human", "conf", "uu", "tao", "shinto"] },
      { id: "good-ignorant", t: "Good, but asleep", s: "Nothing is wrong with us that seeing clearly wouldn't fix.", d: 1, y: ["vedanta", "zen", "conf", "human", "uu"], p: ["islam", "sikh", "tao", "thera"], n: ["evan", "cath"] },
      { id: "craving", t: "Wanting is the wound", s: "Grasping at things that pass is what keeps hurting.", d: 2, y: ["thera", "zen", "jain", "stoic"], p: ["tao", "bhakti", "sikh", "vedanta"], n: [] },
      { id: "forgetting", t: "We forgot what we are", s: "The self you defend is a case of mistaken identity.", d: 2, y: ["vedanta", "zen", "sikh", "tao"], p: ["bhakti", "pagan", "thera"], n: ["islam", "evan", "jud"] },
      { id: "injustice", t: "The problem is out there", s: "Broken arrangements between people, not broken souls.", d: 3, y: ["jud", "conf", "uu", "human"], p: ["evan", "cath", "bahai", "islam", "sikh"], n: ["thera", "vedanta"] },
      { id: "nothing-wrong", t: "Nothing is wrong", s: "Life doesn't need fixing. It needs living.", d: 1, y: ["tao"], p: ["animist", "pagan", "human", "shinto"], n: ["evan", "cath", "islam", "thera", "jain", "zoro"] },
    ],
  },
  {
    n: 3,
    name: "What happens after",
    items: [
      { id: "heaven-hell", t: "Judged once, then forever", s: "One life, one verdict, two destinations.", d: 2, y: ["islam", "evan", "cath"], p: ["bahai", "zoro", "jud"], n: ["thera", "zen", "vedanta", "human", "shinto", "tao", "conf"] },
      { id: "rebirth", t: "Born again and again", s: "You come back until you finish what you're here to learn.", d: 2, y: ["vedanta", "bhakti", "thera", "zen", "jain", "sikh"], p: [], n: ["islam", "evan", "cath", "jud", "human", "bahai", "zoro"] },
      { id: "dissolve", t: "You merge, and the 'you' ends", s: "The drop doesn't survive the ocean. That's the good news.", d: 2, y: ["vedanta", "thera", "zen", "sikh"], p: ["tao", "stoic"], n: ["islam", "evan", "cath", "jud", "bahai", "jain", "bhakti"] },
      { id: "ancestors", t: "The dead stay close", s: "They didn't leave. They changed address.", d: 2, y: ["conf", "shinto", "animist"], p: ["cath", "tao", "bhakti", "pagan"], n: ["evan", "islam", "human"] },
      { id: "lights-out", t: "Death is the end", s: "No sequel. Which is exactly why this matters.", d: 1, y: ["human"], p: ["stoic", "jud", "conf"], n: ["islam", "evan", "cath", "thera", "vedanta", "bahai", "bhakti", "zoro"] },
      { id: "resurrection", t: "Bodies raised at the end of time", s: "Not ghosts — you, restored, when history closes.", d: 2, y: ["islam", "cath", "evan", "zoro", "jud"], p: ["bahai"], n: ["thera", "zen", "vedanta", "human", "tao"] },
      { id: "otherworld", t: "The soul travels on", s: "Somewhere else, then perhaps back around.", d: 1, y: ["pagan", "animist", "bahai"], p: ["zoro", "shinto", "cath"], n: ["human", "thera"] },
    ],
  },
  {
    n: 4,
    name: "How you get right",
    items: [
      { id: "grace", t: "It's a gift; you can't earn it", s: "The rescue arrives from outside you or not at all.", d: 2, y: ["evan", "bhakti"], p: ["cath", "sikh", "zen", "islam"], n: ["jain", "thera", "human", "conf", "jud", "zoro"] },
      { id: "deeds", t: "Your actions are weighed", s: "What you did is the case you're making.", d: 3, y: ["islam", "jud", "jain", "conf", "zoro", "bahai"], p: ["cath", "human", "sikh", "thera"], n: ["evan"] },
      { id: "law-ritual", t: "Keep the law, keep the rites", s: "Doing it properly is not a formality. It's the point.", d: 4, y: ["jud", "islam", "cath", "shinto", "conf", "zoro"], p: ["bhakti", "sikh"], n: ["evan", "human", "uu", "zen", "tao"] },
      { id: "meditation-path", t: "Sit until you see it", s: "No one can hand you this. You have to look yourself.", d: 4, y: ["thera", "zen", "vedanta", "jain"], p: ["tao", "stoic", "uu", "sikh"], n: [] },
      { id: "devotion", t: "Love a god with your whole self", s: "Not agreement. Attachment.", d: 3, y: ["bhakti", "sikh", "evan"], p: ["cath", "islam", "zoro", "vedanta"], n: ["human", "thera", "conf", "jain"] },
      { id: "reason-path", t: "Think clearly and honestly", s: "Fewer illusions is itself the improvement.", d: 2, y: ["human", "stoic", "deism", "uu"], p: ["conf", "bahai", "cath", "thera"], n: ["evan"] },
      { id: "nothing-to-fix", t: "There's nothing to be saved from", s: "The rescue framing is the mistake.", d: 1, y: ["tao", "shinto", "human"], p: ["pagan", "animist", "zen"], n: ["evan", "islam", "cath", "thera", "jain", "zoro", "bhakti"] },
    ],
  },
  {
    n: 5,
    name: "Where truth comes from",
    items: [
      { id: "one-book", t: "One book, final and revealed", s: "It was given, it is finished, and it settles arguments.", d: 3, y: ["islam", "evan", "sikh"], p: ["jud", "zoro", "bahai"], n: ["uu", "human", "pagan", "shinto", "tao", "conf", "animist", "deism", "zen"] },
      { id: "tradition", t: "Scripture, plus centuries of arguing", s: "The commentary is not clutter around the text. It's the text.", d: 3, y: ["jud", "cath", "vedanta", "thera", "conf"], p: ["islam", "bhakti", "zoro"], n: ["evan", "human"] },
      { id: "teacher", t: "A living teacher, in a lineage", s: "Some things only transmit person to person.", d: 3, y: ["zen", "vedanta", "bhakti", "tao"], p: ["thera", "sikh", "cath", "islam"], n: ["evan", "human", "deism"] },
      { id: "own-experience", t: "Your own experience decides", s: "If it didn't happen to you, it's hearsay.", d: 1, y: ["uu", "pagan"], p: ["zen", "human", "vedanta", "tao", "bahai"], n: ["islam", "cath", "evan", "conf", "jud"] },
      { id: "evidence", t: "Reason and evidence", s: "Claims about the world answer to the world.", d: 2, y: ["human", "stoic", "deism", "uu", "bahai"], p: ["conf", "cath"], n: ["evan", "pagan"] },
      { id: "elders", t: "What the ancestors knew", s: "They ran the experiment for a few thousand years already.", d: 2, y: ["conf", "animist", "shinto"], p: ["jud", "tao", "cath", "islam"], n: ["human", "uu"] },
      { id: "clergy", t: "A clergy with real authority", s: "Some people are ordained to decide, and that binds you.", d: 3, y: ["cath", "shinto", "zoro"], p: ["islam", "thera", "bhakti", "jud", "tao"], n: ["evan", "human", "uu", "sikh", "pagan", "bahai"] },
    ],
  },
  {
    n: 6,
    name: "What you actually do",
    items: [
      { id: "daily-prayer", t: "Prayer at fixed times, daily", s: "The clock, not the mood, decides.", d: 4, y: ["islam", "jud", "sikh", "zoro", "bahai"], p: ["evan", "bhakti", "cath"], n: ["human", "uu"] },
      { id: "weekly", t: "One gathering a week", s: "Same room, same people, whether or not you feel like it.", d: 3, y: ["evan", "cath", "jud", "sikh", "uu", "islam"], p: ["bahai", "shinto"], n: ["deism"] },
      { id: "sitting", t: "Daily meditation", s: "Twenty minutes with nothing to show for it.", d: 3, y: ["zen", "thera", "vedanta", "jain"], p: ["tao", "stoic", "uu", "sikh"], n: [] },
      { id: "fasting", t: "A season of going without", s: "Hunger on purpose, on a schedule.", d: 4, y: ["islam", "cath", "jud", "bahai", "jain"], p: ["zoro", "evan", "thera", "pagan"], n: ["human", "conf", "sikh"] },
      { id: "pilgrimage", t: "Travel to a place that matters", s: "Some things you have to go and stand in front of.", d: 4, y: ["islam", "cath", "bhakti", "shinto", "jain"], p: ["jud", "zoro", "thera"], n: ["human", "evan", "sikh"] },
      { id: "food-rules", t: "Rules about what you eat", s: "Three times a day you remember which side you're on.", d: 4, y: ["jud", "islam", "jain"], p: ["bhakti", "thera", "sikh", "zoro", "vedanta", "zen"], n: ["human", "evan", "uu", "shinto"] },
      { id: "sabbath", t: "One day a week off, protected", s: "Not a break from work. A wall around it.", d: 3, y: ["jud", "evan", "cath"], p: ["zoro"], n: ["human", "islam"] },
      { id: "chanting", t: "Chant, mantra, sacred sound", s: "Repetition until the words stop being words.", d: 2, y: ["bhakti", "vedanta", "zen", "thera", "sikh", "jain"], p: ["shinto", "pagan", "cath", "islam"], n: ["human"] },
      { id: "altar", t: "A home altar with offerings", s: "A corner of the house that isn't yours.", d: 2, y: ["shinto", "animist", "bhakti", "tao", "pagan", "conf"], p: ["cath"], n: ["islam", "evan", "jud", "human", "sikh"] },
      { id: "seasons", t: "Festivals tied to the turning year", s: "The calendar keeps time with the sky, not the office.", d: 2, y: ["pagan", "shinto", "animist", "zoro", "jud"], p: ["tao", "conf", "cath", "bhakti"], n: ["evan", "human"] },
      { id: "no-practice", t: "Nothing required", s: "Believe it, live decently, skip the machinery.", d: 1, y: ["human", "deism"], p: ["uu", "tao"], n: ["islam", "jud", "cath", "jain", "sikh", "thera", "bhakti", "zoro"] },
    ],
  },
  {
    n: 7,
    name: "How to be good",
    items: [
      { id: "commands", t: "Right and wrong were handed down", s: "Not voted on, not derived. Given.", d: 3, y: ["islam", "evan", "jud", "cath", "zoro"], p: ["sikh", "bahai"], n: ["human", "stoic", "thera", "conf", "uu", "tao", "pagan", "shinto"] },
      { id: "ahimsa", t: "Harm nothing that lives", s: "All the way down to the insects. No exceptions.", d: 5, y: ["jain"], p: ["thera", "bhakti", "vedanta", "zen", "pagan", "sikh"], n: [] },
      { id: "compassion", t: "Compassion above everything", s: "If a rule and a suffering person collide, the person wins.", d: 3, y: ["zen", "thera", "bhakti", "uu", "sikh", "bahai"], p: ["cath", "human", "islam", "jud"], n: [] },
      { id: "obligation-poor", t: "Giving is owed, not generous", s: "A share of what you have was never yours.", d: 4, y: ["islam", "jud", "sikh", "cath", "bahai"], p: ["evan", "bhakti", "human", "zoro"], n: [] },
      { id: "family-order", t: "Honor family and your place in it", s: "You are a son, a mother, a neighbor before you are yourself.", d: 3, y: ["conf", "shinto", "animist"], p: ["jud", "islam", "cath", "bhakti", "sikh"], n: ["human", "zen", "pagan", "thera"] },
      { id: "harm-none", t: "Do as you like, harm no one", s: "The only rule that needs no enforcement.", d: 1, y: ["pagan"], p: ["human", "uu", "tao"], n: ["islam", "cath", "evan", "jud", "conf", "jain", "zoro"] },
      { id: "reduce-suffering", t: "Judge by whether suffering drops", s: "Results decide, not intentions or rules.", d: 2, y: ["human", "uu"], p: ["thera", "zen", "stoic", "bahai"], n: ["evan", "islam", "jud"] },
      { id: "virtue", t: "Build character; that's the reward", s: "Not what you do. What doing it makes you.", d: 3, y: ["stoic", "conf", "bahai"], p: ["cath", "thera", "jud", "jain", "islam"], n: ["evan"] },
    ],
  },
  {
    n: 8,
    name: "Time and the universe",
    items: [
      { id: "one-arc", t: "Created once, heading for an ending", s: "A story with a first page and a last one.", d: 2, y: ["islam", "evan", "cath", "zoro", "bahai"], p: ["jud"], n: ["vedanta", "thera", "tao", "jain", "shinto"] },
      { id: "cycles", t: "Endless cycles, no final act", s: "It has all happened before and will again.", d: 2, y: ["vedanta", "bhakti", "jain"], p: ["thera", "zen", "tao", "pagan", "stoic"], n: ["islam", "evan", "cath", "zoro", "bahai"] },
      { id: "uncreated", t: "Nobody made it; it always was", s: "The question 'who started it' is malformed.", d: 1, y: ["jain", "tao", "thera", "zen"], p: ["human", "vedanta", "conf"], n: ["islam", "evan", "cath", "jud", "zoro", "bahai", "deism"] },
      { id: "interconnected", t: "Nothing is separate from anything", s: "The lines between things are drawn by us.", d: 2, y: ["vedanta", "zen", "tao", "pagan", "animist", "uu"], p: ["thera", "shinto", "stoic"], n: ["evan", "islam"] },
      { id: "veil", t: "The world we see is a veil", s: "Solid, convincing, and not the real thing.", d: 2, y: ["vedanta"], p: ["zen", "thera", "pagan", "cath"], n: ["jud", "conf", "shinto", "human", "tao", "jain"] },
      { id: "progress", t: "History is going somewhere better", s: "Slowly, unevenly, but somewhere.", d: 2, y: ["bahai", "human", "zoro"], p: ["evan", "cath", "uu", "islam", "jud"], n: ["tao", "thera", "shinto"] },
    ],
  },
  {
    n: 9,
    name: "Who it's for",
    items: [
      { id: "universal", t: "It's for everyone — go tell them", s: "Keeping it to yourself would be the unkind thing.", d: 4, y: ["islam", "evan", "cath", "bahai"], p: ["sikh", "thera", "zen"], n: ["jud", "shinto", "animist", "conf", "pagan"] },
      { id: "a-people", t: "It belongs to one people", s: "Bound to a particular history, land, and family line.", d: 2, y: ["jud", "shinto", "animist"], p: ["conf", "zoro", "bhakti"], n: ["evan", "islam", "bahai", "uu"] },
      { id: "alone", t: "A path you walk alone", s: "No membership, no building, no roll call.", d: 1, y: ["deism", "tao", "stoic"], p: ["human", "pagan", "zen"], n: ["islam", "cath", "sikh", "jud", "evan", "bahai"] },
      { id: "local", t: "Small and local; no headquarters", s: "Whoever shows up is the whole institution.", d: 2, y: ["pagan", "animist", "shinto"], p: ["uu", "tao", "evan", "jud"], n: ["cath", "bahai", "islam"] },
      { id: "monastics", t: "Some people should go all in", s: "Monks and nuns, holding the deep end for everyone else.", d: 3, y: ["thera", "zen", "cath", "jain", "tao"], p: ["vedanta", "shinto", "bhakti"], n: ["bahai", "islam", "evan", "sikh", "jud", "conf", "human", "zoro"] },
      { id: "equality", t: "No priests, no ranks, all equal", s: "Same floor, same food, same access.", d: 3, y: ["sikh", "uu", "human", "bahai"], p: ["evan", "islam", "jain", "bhakti"], n: ["cath", "conf", "shinto", "zoro"] },
    ],
  },
  {
    n: 10,
    name: "Everyone who isn't in",
    items: [
      { id: "outsiders-lost", t: "Outside this, you are lost", s: "Not a slur. A diagnosis, and the reason to hurry.", d: 4, y: ["evan"], p: ["islam", "zoro"], n: ["uu", "human", "jud", "bahai", "pagan", "shinto", "thera", "vedanta", "sikh", "tao", "animist", "conf", "deism"] },
      { id: "many-roads", t: "Many roads up one mountain", s: "Different maps, same summit, and mine isn't the only one.", d: 1, y: ["vedanta", "uu", "bahai", "sikh", "bhakti"], p: ["cath", "zen", "tao", "thera", "pagan", "human", "deism", "jud"], n: ["evan", "islam"] },
      { id: "we-have-it-whole", t: "We have it whole; they have pieces", s: "They aren't wrong. They stopped early.", d: 2, y: ["cath", "islam", "bahai", "zoro"], p: ["evan", "thera", "vedanta", "jud", "sikh", "conf"], n: ["uu", "pagan", "human"] },
      { id: "not-our-business", t: "Other people's souls aren't my business", s: "We have ours. They have theirs. Fine.", d: 1, y: ["jud", "shinto", "conf", "animist", "tao", "deism"], p: ["pagan", "human", "uu", "stoic"], n: ["evan", "islam", "cath", "bahai"] },
      { id: "convert-in", t: "Anyone can join", s: "Walk in, say the words, and you're one of us.", d: 2, y: ["islam", "evan", "cath", "bahai", "sikh", "thera"], p: ["uu", "zen", "pagan", "vedanta", "jud", "zoro"], n: ["shinto", "animist", "conf"] },
      { id: "no-tell", t: "Never try to convert anyone", s: "If they ask, answer. Otherwise leave people alone.", d: 1, y: ["jud", "shinto", "animist", "pagan", "conf", "deism", "tao"], p: ["uu", "human", "stoic", "zen", "vedanta"], n: ["evan", "islam", "cath", "bahai", "sikh"] },
      { id: "intermarry", t: "Marry outside and something is lost", s: "It doesn't survive a generation of not minding.", d: 4, y: ["jud", "zoro", "animist"], p: ["islam", "cath", "bhakti", "conf", "shinto"], n: ["uu", "human", "pagan", "bahai", "deism"] },
      { id: "argue-well", t: "Disagreement is the healthy state", s: "Two who argue and stay are worth ten who nod.", d: 2, y: ["jud", "uu", "human"], p: ["zen", "cath", "tao", "thera", "conf", "stoic"], n: ["evan", "islam"] },
    ],
  },
];

/* Mainline Protestantism shares most of the evangelical shelf and parts company
   on a documented handful, so rather than hand-tagging 74 items twice it inherits
   every evangelical tag except these. Pew 2008/2014: ~80% of mainline Protestants
   say many religions lead to eternal life, against a roughly even split among
   evangelicals; ~69% of mainline believe in hell, against ~90% of evangelicals.
   null = no position either way. */
const MAINLINE_OVERRIDES = {
  "outsiders-lost": "n",
  "many-roads": "y",
  "we-have-it-whole": "p",
  "not-our-business": "p",
  "no-tell": "p",
  universal: "p",
  "one-book": "p",
  tradition: "p",
  evidence: "y",
  "own-experience": "p",
  "argue-well": "p",
  clergy: "p",
  "heaven-hell": "p",
  fallen: "p",
  injustice: "y",
  progress: "y",
  equality: "y",
  "reduce-suffering": "p",
  compassion: "y",
  monastics: "p",
  "food-rules": null,
  seasons: "p",
  "law-ritual": null,
};

AISLES.forEach((a) =>
  a.items.forEach((it) => {
    const slot = Object.prototype.hasOwnProperty.call(MAINLINE_OVERRIDES, it.id)
      ? MAINLINE_OVERRIDES[it.id]
      : it.y.includes("evan") ? "y"
      : it.p.includes("evan") ? "p"
      : it.n.includes("evan") ? "n"
      : null;
    if (slot === "y") it.y.push("main");
    else if (slot === "p") it.p.push("main");
    else if (slot === "n") it.n.push("main");
  })
);

const ALL_ITEMS = AISLES.flatMap((a) => a.items.map((i) => ({ ...i, aisle: a.n, an: a.name })));
const ITEM_BY_ID = Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i]));
const ITEM_INDEX = Object.fromEntries(ALL_ITEMS.map((i, n) => [i.id, n]));

/* How many traditions hold this? Beliefs almost everyone shares tell us
   little about you, so they count for less. */
const WEIGHT = {};
const RARITY = {};
ALL_ITEMS.forEach((i) => {
  const support = i.y.length + i.p.length * 0.5;
  const w = Math.log2(FAITHS.length / (1 + support));
  WEIGHT[i.id] = Math.min(2.4, Math.max(0.5, w));
  RARITY[i.id] = w >= 1.9 ? "SPECIALTY" : w <= 1.25 ? "COMMON STOCK" : null;
});

/* Everything a tradition affirms outright — its own cart. */
function cartFor(faithId) {
  return ALL_ITEMS.filter((i) => i.y.includes(faithId)).map((i) => i.id);
}

/* ---- naming ---- */
const NAME_A = {
  "no-gods": "Godless", "god-personal": "Covenant", "god-impersonal": "Groundless",
  pantheism: "World", "gods-many": "Manifold", spirits: "Hearth", clockmaker: "Absentee",
  unknowable: "Cloudy", forgetting: "Amnesiac", craving: "Unclenched", fallen: "Bent",
  "nothing-wrong": "Unbothered", rebirth: "Returning", "lights-out": "Final",
  dissolve: "Dissolving", ancestors: "Attended", veil: "Curtained", interconnected: "Seamless",
  cycles: "Circling", "one-arc": "Ending", progress: "Improving", ahimsa: "Harmless",
  "many-roads": "Ecumenical", "outsiders-lost": "Narrow", "not-our-business": "Minding",
};
const NAME_B = {
  sitting: "Cushion", "daily-prayer": "Hours", "food-rules": "Table", fasting: "Empty Plate",
  pilgrimage: "Long Road", "no-practice": "Free Sunday", sabbath: "Day Off", chanting: "Sound",
  altar: "Corner", seasons: "Wheel", weekly: "Hall", "obligation-poor": "Tenth",
  equality: "Common Floor", monastics: "Deep End", "meditation-path": "Long Look",
  compassion: "Open Hand", commands: "Tablet", evidence: "Ledger", teacher: "Lineage",
  "one-book": "Book", tradition: "Margin Notes", alone: "Solitude", local: "Parish",
  "argue-well": "Argument", "no-tell": "Closed Door", "convert-in": "Open Door",
};
function buildName(bag, seed = 0) {
  const as = bag.map((id) => NAME_A[id]).filter(Boolean);
  const bs = bag.map((id) => NAME_B[id]).filter(Boolean);
  if (!as.length && !bs.length) return "The Unnamed Thing";
  const a = as.length ? as[seed % as.length] : "Assembled";
  const b = bs.length ? bs[(seed + (as.length ? 1 : 0)) % bs.length] : "Arrangement";
  return `The ${a} ${b}`;
}
function nameVariants(bag) {
  const as = bag.map((id) => NAME_A[id]).filter(Boolean).length || 1;
  const bs = bag.map((id) => NAME_B[id]).filter(Boolean).length || 1;
  return Math.max(as, bs);
}

/* ---- share codes ---- */
const CODE_BYTES = Math.ceil(ALL_ITEMS.length / 8);
const checksum = (bytes) => {
  let sum = 0x5b;
  for (let i = 0; i < CODE_BYTES; i++) sum = (sum + bytes[i] * (i + 3)) & 0xff;
  return sum;
};

function encodeBag(bag, name) {
  const bytes = new Uint8Array(CODE_BYTES + 1);
  bag.forEach((id) => {
    const i = ITEM_INDEX[id];
    if (i != null) bytes[i >> 3] |= 1 << (i & 7);
  });
  bytes[CODE_BYTES] = checksum(bytes);
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  const b64 = btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return name ? `${b64}~${encodeURIComponent(name)}` : b64;
}
function decodeBag(code) {
  try {
    const [raw, nm] = String(code).trim().split("~");
    if (!/^[A-Za-z0-9\-_]{4,}$/.test(raw)) return null;
    let s = raw.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    const bin = atob(s);
    if (bin.length !== CODE_BYTES + 1) return null;
    const bytes = new Uint8Array(CODE_BYTES + 1);
    for (let i = 0; i <= CODE_BYTES; i++) bytes[i] = bin.charCodeAt(i);
    if (bytes[CODE_BYTES] !== checksum(bytes)) return null;
    const ids = [];
    ALL_ITEMS.forEach((it, i) => {
      if (bytes[i >> 3] & (1 << (i & 7))) ids.push(it.id);
    });
    if (!ids.length) return null;
    return { bag: ids, name: nm ? decodeURIComponent(nm) : null };
  } catch (e) {
    return null;
  }
}

/* Pairs that pull against each other. Real traditions live with tensions too —
   these are flagged, not forbidden. */
const TENSIONS = [
  ["no-gods", "god-personal", "You picked nobody home and someone listening."],
  ["no-gods", "gods-many", "None, or a great many. Pick a direction."],
  ["no-gods", "clockmaker", "A maker who left still counts as a maker."],
  ["god-personal", "clockmaker", "Either it hears you or it walked away."],
  ["god-personal", "god-impersonal", "A mind that knows you, and no mind at all."],
  ["heaven-hell", "rebirth", "One verdict, or as many rounds as it takes."],
  ["lights-out", "heaven-hell", "The end, and then judgment."],
  ["lights-out", "rebirth", "The end, and then again."],
  ["lights-out", "resurrection", "The end, and then your body back."],
  ["lights-out", "ancestors", "Gone for good, but still around."],
  ["lights-out", "dissolve", "Nothing to merge into if there's nothing after."],
  ["lights-out", "otherworld", "No sequel, and a journey onward."],
  ["nothing-to-fix", "grace", "Rescue from what, exactly?"],
  ["nothing-to-fix", "fallen", "Born bent, with nothing to be saved from."],
  ["nothing-wrong", "fallen", "Nothing wrong, except the thing wrong with us."],
  ["nothing-wrong", "craving", "Nothing wrong, but wanting is a wound."],
  ["no-practice", "daily-prayer", "Nothing required, five times a day."],
  ["no-practice", "fasting", "Nothing required, but skip meals on schedule."],
  ["no-practice", "food-rules", "Nothing required, plus a list of what you can't eat."],
  ["no-practice", "sitting", "Nothing required, except every morning."],
  ["no-practice", "sabbath", "Nothing required, one day a week, non-negotiable."],
  ["no-practice", "pilgrimage", "Nothing required, aside from the journey."],
  ["one-arc", "cycles", "One arc or no arc."],
  ["one-arc", "uncreated", "Created once, and never created."],
  ["one-book", "own-experience", "The book settles it, unless you disagree."],
  ["commands", "harm-none", "Handed down, and also up to you."],
  ["commands", "reduce-suffering", "Obey the rule, or count the outcome — they will differ someday."],
  ["universal", "a-people", "For everyone, and for your people only."],
  ["clergy", "equality", "Nobody outranks anyone, except the ordained."],
  ["veil", "nothing-wrong", "The world is an illusion and perfectly fine as it is."],
  ["outsiders-lost", "many-roads", "Every road works, except the ones that don't."],
  ["outsiders-lost", "not-our-business", "They're lost, and it's none of your concern."],
  ["outsiders-lost", "no-tell", "They're lost, and you're not going to mention it."],
  ["no-tell", "universal", "It's for everyone, but don't tell anyone."],
  ["convert-in", "a-people", "Anyone can join a thing you're born into."],
  ["intermarry", "many-roads", "All roads are good; just don't marry someone on one."],
];

/* ------------------------------------------------------------------ */
/*  SCORING                                                            */
/* ------------------------------------------------------------------ */

function scoreFaiths(selected) {
  const picks = selected.map((id) => ITEM_BY_ID[id]).filter(Boolean);
  const max = picks.reduce((s, it) => s + 2 * WEIGHT[it.id], 0) || 1;
  return FAITHS.map((f) => {
    let raw = 0;
    let agree = [];
    let clash = [];
    picks.forEach((it) => {
      const w = WEIGHT[it.id];
      if (it.y.includes(f.id)) { raw += 2 * w; agree.push(it.id); }
      else if (it.p.includes(f.id)) { raw += 1 * w; agree.push(it.id); }
      else if (it.n.includes(f.id)) { raw -= 2 * w; clash.push(it.id); }
    });
    const pct = Math.max(0, Math.round((raw / max) * 100));
    /* How much of the bag does this tradition have any position on at all? A
       tradition can rank well simply by never disagreeing, so this gets shown
       rather than folded into the score — some of the silence below is genuinely
       theirs and some of it is just tagging this shelf hasn't reached yet. */
    const spoken = picks.filter((it) => agree.includes(it.id) || clash.includes(it.id));
    const coverage = picks.length
      ? spoken.reduce((s, it) => s + WEIGHT[it.id], 0) / picks.reduce((s, it) => s + WEIGHT[it.id], 0)
      : 0;
    const missing = f.core.filter((c) => !selected.includes(c));
    const narrowed = [...agree].filter((id) => WEIGHT[id] >= 1.4).sort((a, b) => WEIGHT[b] - WEIGHT[a]).slice(0, 3);
    return { ...f, pct, raw, agree, clash, missing, narrowed, coverage, spoken: spoken.length };
  }).sort((a, b) => b.raw - a.raw);
}

function findTensions(selected) {
  const set = new Set(selected);
  return TENSIONS.filter(([a, b]) => set.has(a) && set.has(b));
}

/* How much can this bag actually tell us? A cart of beliefs almost
   everyone shares can't narrow anything down, however well it matches. */
function specificity(bag) {
  if (!bag.length) return { avg: 0, label: "NONE", note: "" };
  const avg = bag.reduce((s, id) => s + WEIGHT[id], 0) / bag.length;
  if (avg < 1.35)
    return { avg, label: "LOW", note: "Most of what you picked is held almost everywhere, so this match is soft. Add something from the red-tagged shelf to sharpen it." };
  if (avg < 1.7)
    return { avg, label: "MEDIUM", note: "A workable mix of common ground and things that actually divide people." };
  return { avg, label: "HIGH", note: "You picked unusual things. This match is doing real work." };
}

/* ------------------------------------------------------------------ */
/*  WHAT HAS ACTUALLY BEEN CHECKED                                     */
/* ------------------------------------------------------------------ */

/* Every tag in this file started as one person's unsourced first pass. These
   are the ones since checked against sources, keyed "belief:tradition". The
   count is deliberately visible in the UI: 904 explicit claims sit in the
   shelves above, so anything not listed here is still a first guess. */
const CHECKED = {
  "one-book:evan": "Biblicism, the first of Bebbington's four marks: the Bible as sole and final authority, with sola scriptura the operative doctrine.",
  "tradition:evan": "Biblicism stands in direct tension with tradition — the retrieval movement's emphasis on tradition is discussed precisely as a conflict with the evangelical quadrilateral.",
  "grace:evan": "Conversion is described as received by faith alone and given by God as the result of grace alone.",
  "fallen:evan": "Crucicentrism centres on substitutionary atonement for sinners, and conversionism on the necessity of new birth.",
  "universal:evan": "Activism means evangelism — organised missionary work and personal witness, with all Christians commissioned to evangelise.",
  "devotion:evan": "Conversion is framed as a crisis event in which the individual accepts Jesus as personal Saviour and Lord.",
  "deeds:evan": "Justification is described as happening in a moment through faith, which is why weighing actions is rejected — though activism still expects good works to follow.",
  "injustice:evan": "Activism covers social reform as well as mission, which is why this sits as partial rather than absent.",
  "clergy:cath": "Apostolic succession runs in an unbroken line of bishops, the magisterium is held infallible when teaching officially, and sins are forgiven through a priest.",
  "tradition:cath": "Sacred Tradition stands alongside Scripture as a source of divine revelation; doctrines including purgatory and Mary's perpetual virginity are taught most clearly through it.",
  "law-ritual:cath": "The seven sacraments are not symbols but efficacious signs that actually convey grace — doing them properly is the substance.",
  "grace:cath": "Sacraments are described as mystical channels of divine grace, but they work alongside works of mercy rather than replacing them. Partial is right.",
  "deeds:cath": "Purgatory as expiatory purification of the elect, plus the spiritual and corporal works of mercy, mean actions carry weight without being the whole account.",
  "ancestors:cath": "The communion of saints and intercessory prayer keep the dead in active relationship with the living, though saints are venerated rather than worshipped.",
  "otherworld:cath": "Purgatory is an intermediate state after death for purification, distinct from both heaven and the punishment of the damned.",
  "monastics:thera": "The Patimokkha runs to 227 rules for monks and 311 for nuns; the sangha is the institutional core of the tradition.",
  "tradition:thera": "The Pali Canon, preserved for over two millennia, is the most complete Buddhist canon surviving in a classical Indian language.",
  "ahimsa:thera": "The first precept forbids killing but explicitly not eating meat — 'the first precept does not say do not eat meat'. Partial is exactly right.",
  "food-rules:thera": "Monastics follow the threefold purity rule and are barred from only ten specific meats; lay vegetarianism is optional and not doctrinally mandated. But the Eight Precepts on observance days include not eating after noon.",
  "fasting:thera": "On Uposatha days laypeople take the Eight Precepts, one of which prohibits eating after noon. A discipline rather than a season, hence partial.",
  "teacher:zen": "Dharma transmission establishes a successor in an unbroken lineage of teachers and disciples — a spiritual bloodline traced to the Buddha.",
  "sitting:zen": "Zazen is the defining practice, with sesshin as intensive retreat under a teacher.",
  "forgetting:zen": "Zen points to the nature of mind as already awake; the work is recognition rather than acquisition.",
  "interconnected:zen": "Mahayana teaches that all things exist in interdependence and lack inherent existence.",
  "monastics:zen": "Ordination runs through tonsure and the Triple Platform Ordination, observing sramanera, bhiksu and bodhisattva precepts.",
  "one-book:zen": "Bodhidharma's formula is explicit: a special transmission outside the scriptures, not established by words and letters. It was untagged here, now a reject.",
  "food-rules:zen": "East Asian Mahayana institutionalised monastic vegetarianism after Emperor Wu's decree of 511, drawing on the Lankavatara Sutra rather than the Pali Canon. Added as partial, since laity are less bound.",
  "ahimsa:zen": "The bodhisattva ideal grounds the Mahayana argument against meat: one cannot aspire to liberate all beings while sustaining the market that kills them.",
  "grace:bhakti": "Across Sri Vaishnava schools, divine grace is what ultimately liberates; prapatti is total reliance on it. The Tenkalai school goes further than the Vadakalai on how little effort is required.",
  "devotion:bhakti": "Prapatti — single-pointed surrender to Vishnu — is the defining practice, with bhakti defined by Ramanuja as unbroken meditation maturing into love.",
  "god-personal:bhakti": "God and soul are held to be everlastingly distinct, with the soul's destiny to worship and enjoy Him.",
  "dissolve:bhakti": "Liberation is explicitly not annihilation but the fulfilment of the soul as a conscious, devoted participant in divine life. It was untagged here, now a reject.",
  "chanting:bhakti": "Japa and kirtana are key devotional practice, with sankirtana extending it to public group chanting.",
  "teacher:bhakti": "Initiation by the acharya is treated as essential, and in Gaudiya practice surrender runs through the preceptor.",
  "altar:bhakti": "Pushtimarg's seva centres on the Krishna murti at home — dressing, feeding and fanning the deity as a living companion.",
  "monastics:bhakti": "Described as generally nonascetic while still sustaining a strong monastic community. Partial captures it.",
  "law-ritual:bhakti": "Vaishnava traditions critique excessive ritualism as mechanical and insufficient, preferring surrender that bypasses elaborate karmic observance. Partial, and arguably generous.",
  "food-rules:bhakti": "Ahimsa underpins vegetarianism as daily practice, though it is not uniform across all Vaishnava communities.",
  "ahimsa:bhakti": "Non-violence is promoted as a foundational virtue extending compassion to all beings as manifestations of the divine.",
  "daily-prayer:islam": "Salat five times a day — dawn, midday, afternoon, sunset and nightfall — is the second pillar and obligatory.",
  "fasting:islam": "Sawm through Ramadan is the fourth pillar, obligatory on every able Muslim.",
  "pilgrimage:islam": "Hajj is the fifth pillar, a once-in-a-lifetime obligation on those physically and financially able.",
  "obligation-poor:islam": "Zakat is obligatory at roughly 2.5% of wealth annually and is explicitly distinguished from sadaqah, which is voluntary. This shelf's distinction between owed and generous is Islam's own.",
  "god-personal:islam": "Tawhid: God alone is Creator, Sustainer and Lawmaker, and no angel, prophet or saint shares in His divinity.",
  "gods-many:islam": "The shahada is framed as negating all false gods and affirming God's singular right to worship.",
  "one-book:islam": "Muhammad is held to be the final recipient of divine revelation, which is what makes the book final rather than merely authoritative.",
  "tradition:islam": "The pillars come from the Qur'an but are most fully defined through hadith and were interpreted by the ulama in the first three centuries. Partial confirmed.",
  "commands:islam": "God is named as the Lawmaker; the pillars are obligations with defined conditions rather than recommendations.",
  "deeds:islam": "Missed obligatory prayers and fasts must be made up, which treats the account as something that can run short.",
  "law-ritual:islam": "The pillars are defined with precise conditions, exemptions and make-up requirements — doing it properly is the substance, not a formality.",
  "daily-prayer:bahai": "Obligatory daily prayer is prescribed in the Kitáb-i-Aqdas and named, with the fast, as one of the greatest obligations of a Bahá'í. Notably it is forbidden to say it in congregation.",
  "fasting:bahai": "The Nineteen-Day Fast, sunrise to sunset through the month of Loftiness, instituted by the Báb and affirmed by Bahá'u'lláh.",
  "clergy:bahai": "The Kitáb-i-Aqdas abolishes priesthood; communities are led by elected Spiritual Assemblies. It was untagged here, now a reject.",
  "equality:bahai": "No clergy, elected bodies at every level, and equality of men and women stated as a foundational principle.",
  "evidence:bahai": "Harmony of science and religion is a named principle, and adherents are directed to employ reason and evidence rather than inherited dogma. Upgraded from partial to affirm.",
  "own-experience:bahai": "Independent investigation of truth requires each person to verify claims directly, explicitly without clerical mediation. Added as partial.",
  "one-book:bahai": "Progressive revelation holds Bahá'u'lláh's revelation to be the most recent but expressly not the last, so partial rather than affirm is right.",
  "many-roads:bahai": "The tradition accepts the divine origin of the founders of the major world religions as stages of one unfolding revelation.",
  "universal:bahai": "Oneness of humanity is central, and Houses of Worship are open to people of every religion.",
  "weekly:bahai": "The Nineteen Day Feast is the community gathering, every nineteen days rather than weekly, and attendance is a duty and privilege rather than an obligation. Partial confirmed.",
  "progress:bahai": "Revelation is described as adapted to humanity's evolving capacity, aimed at world peace through global governance.",
  "unknowable:bahai": "God is described as an unknowable essence, reached only through successive Manifestations.",
  "obligation-poor:bahai": "The elimination of the extremes of wealth and poverty is a stated social principle.",
  "virtue:conf": "The whole system is virtue-based: becoming a junzi through ren, li, yi, zhi and xin, extended outward from self to family to state.",
  "family-order:conf": "Filial piety (xiao) is described as a pillar of social norms across East Asia, in an explicitly hierarchical and relational ethics.",
  "law-ritual:conf": "Li, ritual propriety, is the instrument through which family, state and world align with Heaven's moral order — though Confucius insisted ritual without sincerity is empty.",
  "ancestors:conf": "The ancestral rite (jili) is an expression of filial piety, and the ceremony entails the belief that the deceased continue to exist.",
  "elders:conf": "Self-cultivation is framed as measuring oneself against the aesthetic, moral and social canons of tradition.",
  "heaven-hell:conf": "Confucius speaks reverently of Heaven and endorses ancestral rites but explicitly avoids speculation about spirits and death.",
  "lights-out:conf": "Same source: the tradition declines to settle what follows death, which is why this is partial rather than affirm.",
  "equality:conf": "Ren is exercised in an interdependent, hierarchical universe, and li regulates conduct as befits one's status. Reject stands — though Confucius did redefine junzi as achievable regardless of birth.",
  "injustice:conf": "Governance by de and the alignment of family, state and world are framed as the arena where things go right or wrong.",
  "gods-many:shinto": "Ancient Shinto was polytheistic, recognising a multitude of kami in seas, mountains, outstanding people and abstract ideas.",
  "spirits:shinto": "Kami inhabit uniquely shaped trees, mountains, rivers and rocks; a shrine is understood as the actual dwelling place of a kami.",
  "one-book:shinto": "Britannica: no founder, no official sacred scriptures in the strict sense, and no fixed dogma.",
  "seasons:shinto": "Matsuri follow the agricultural year — a spring festival praying for good harvest and an autumn festival giving thanks for it.",
  "a-people:shinto": "Worship is organised around ujigami, the tutelary deity of a clan or locality, often a deified ancestor of that clan.",
  "ancestors:shinto": "Ujigami are frequently the deified ancestors of the clan that venerates them.",
  "no-tell:shinto": "Explicitly contrasted with the charismatic, proselytising religions of the West.",
  "convert-in:shinto": "Membership follows clan and locality rather than profession of belief, which is why joining is not the operative category.",
  "local:shinto": "The ujigami of each local community, and the parish structure around each shrine, are the basic units.",
  "heaven-hell:shinto": "No concept of an afterlife; the purpose of worship is harmony with the kami in the present, not preparation for judgment.",
  "nothing-to-fix:shinto": "Worship is not salvation from sin but an ongoing expression of gratitude for life and the blessings of the kami.",
  "commands:shinto": "The absence of official scripture is described as reflecting the religion's lack of moral commandments. It was untagged here, now a reject.",
  "law-ritual:shinto": "With no central doctrine, worship proceeds through ritual and tradition rather than creed.",
  "spirits:animist": "Graham Harvey's working definition of animists: people who recognise that the world is full of persons, only some of whom are human, and that life is lived in relationship with them.",
  "interconnected:animist": "The new animism, following Hallowell and Bird-David, frames this as a relational ontology rather than a belief about souls in objects — personhood extends across the web rather than stopping at the human.",
  "local:animist": "The Internet Encyclopedia of Philosophy notes the intimate connection animists draw between communities and their specific local environment — this river, this mountain, not nature in general.",
  "a-people:animist": "The same tie to ancestral land and locality means these traditions belong to particular peoples; the category has been invoked in reasserting indigenous sovereignty over contested land.",
  "harm-none:pagan": "The Wiccan Rede — an it harm none, do what ye will — is the central ethical code, and locates moral structure in personal responsibility rather than religious authority.",
  "seasons:pagan": "The Wheel of the Year: eight sabbats on the solstices, equinoxes and cross-quarter days, aligned to solar and agricultural cycles.",
  "gods-many:pagan": "Theology ranges from goddess monotheism through duotheism to full polytheism, with deities drawn from pre-Christian Europe. Affirm, with real internal variety.",
  "local:pagan": "No central authority. Even the umbrella bodies are confederations of autonomous covens with sovereignty explicitly reserved to each.",
  "own-experience:pagan": "Moral structure rests with the individual rather than an authority, and eclectic solitary practice is now the most widely practised form.",
  "alone:pagan": "Covens and solitary practice both flourish — Gardnerian and Alexandrian lines are coven-based with three initiatory degrees, while eclectic Wicca is largely solitary. Partial is right.",
  "otherworld:pagan": "Samhain is held to be when the veil between worlds is thinnest, with the God passing to the underworld.",
  "ancestors:pagan": "Samhain is explicitly a time of honouring ancestors and the dead. Added as partial.",
  "no-gods:human": "The Amsterdam Declaration: humanism is not theistic and does not accept supernatural views of reality.",
  "lights-out:human": "Humanists UK: in the absence of an afterlife or any discernible purpose to the universe, meaning comes from seeking happiness in this life.",
  "evidence:human": "The Declaration commits to reason and free inquiry and to the scientific method for understanding how the universe works.",
  "reason-path:human": "Same source — reason and free inquiry through human capabilities are the stated method.",
  "reduce-suffering:human": "Morality is grounded in the ability of living things to suffer and flourish, motivated by the benefits of helping and not harming.",
  "commands:human": "Ethics needs no source outside of humanity, and explicitly no reference to divine purposes or supernatural beings.",
  "no-practice:human": "The 1952 Declaration calls humanism un-dogmatic, imposing no creed upon its adherents.",
  "injustice:human": "The Declaration frames humanism as building a more humane society, democratic and rights-based.",
  "progress:human": "It states that the problems facing humanity in this age can be solved. Confidence in improvement is explicit.",
  "compassion:human": "Morality is described as enabled by reason and compassion, extending to all sentient beings.",
  "clockmaker:deism": "Definitional: a creator establishes natural law and then withdraws, with no ongoing intervention.",
  "god-personal:deism": "Deism removes answered prayer, providence and the ongoing relationship while keeping the creator.",
  "no-gods:deism": "Deists firmly rejected atheism — they affirm a creator and a first cause. What they deny is its continued activity.",
  "one-book:deism": "Divinely revealed scripture is rejected outright; reason and the natural world are held to be the only revelation. It was untagged here, now a reject.",
  "teacher:deism": "Prophets and divine representatives are rejected, since a perfect creator would need no mid-course corrections.",
  "evidence:deism": "Belief is treated as a common-sense conclusion from the evidence of the senses and reason, not faith.",
  "reason-path:deism": "Human reason alone is held to supply everything needed for a correct moral and religious life.",
  "no-practice:deism": "Ceremony and ritual are rejected as the artificial pomp of organised religion; the creator needs no worship.",
  "weekly:deism": "Follows from the same rejection of organised worship — there are no established deistic congregations.",
  "alone:deism": "There is no central church, sacred text or universal creed, and no established deistic religion to belong to.",
  "many-roads:uu": "Pluralism is one of the six Shared Values adopted at General Assembly in June 2024: all are sacred beings, diverse in theology.",
  "interconnected:uu": "Interdependence is a named Shared Value — honouring the interdependent web of all existence. Upgraded from partial to affirm.",
  "injustice:uu": "Justice is a named Shared Value, framed as building diverse multicultural Beloved Communities.",
  "equality:uu": "Equity is one of the six named Shared Values, alongside a bylaw guarantee that no statement may be used as a creedal test over any member.",
  "compassion:uu": "The 2024 statement puts Love at the centre, with the other values arranged around it.",
  "own-experience:uu": "UUA bylaws protect individual freedom of belief and bar any statement being used as a creedal test.",
  "one-book:uu": "The same bar on creedal tests rules out a single binding scripture.",
  "spirits:islam": "Jinn run through the Quran and are a matter of scholarly consensus, so Islam affirms an inhabited unseen world — while rejecting the propitiation of place-spirits. Moved from reject to partial.",
  "equality:bhakti": "Bhakti saints proclaimed equality before God and many came from marginalised communities, but Ambedkar's critique that it never dismantled caste is the standard counterweight. Moved from reject to partial.",
  "heaven-hell:jud": "Gehinnom is capped at twelve months — Kaddish is said for eleven so as not to imply a full term. The judgment and the two destinations hold; the permanence does not. Partial.",
  "heaven-hell:zoro": "After frashokereti even the wicked are cleansed by the river of molten metal. A temporary hell, no everlasting one. Moved from affirm to partial.",
  "heaven-hell:main": "About 69% of mainline Protestants believe in hell, against roughly 90% of evangelicals (Pew). Partial.",
  "resurrection:jud": "One of Maimonides' thirteen principles and named in the daily Amidah. Upgraded to affirm.",
  "many-roads:jud": "The Talmud grants the righteous of all nations a share in the world to come. Added as partial.",
  "many-roads:main": "About 80% of mainline Protestants say many religions lead to eternal life (Pew 2008/2014). Affirms.",
  "many-roads:evan": "Evangelicals split roughly evenly on the same question, but their leadership does not — 96% of Lausanne participants called Christianity the one true faith. Rejects.",
  "outsiders-lost:evan": "Held by about half of US evangelicals and near-unanimously by evangelical leadership.",
  "outsiders-lost:main": "Rejected by the large majority of mainline Protestants (Pew).",
  "convert-in:jud": "Converts are accepted and fully Jewish; what Judaism rejects is the casualness. Moved from reject to partial.",
  "convert-in:zoro": "Iranian communities never formally barred converts; Parsi councils generally have. Genuinely split, so partial.",
  "monastics:zoro": "Zoroastrianism rejects asceticism and monasticism outright — active participation in life is central to its concept of free will.",
  "monastics:bahai": "The Kitáb-i-Aqdas explicitly prohibits monasticism, asceticism and mendicancy, and abolishes priesthood.",
  "monastics:tao": "Quanzhen is a celibate monastic order and remains the seat of the China Daoist Association. Upgraded to affirm.",
  "monastics:sikh": "Guru Nanak rejected renunciation for the householder's life; Kartarpur was built on honest work. Reject confirmed.",
  "clergy:tao": "Religious Daoism has a hierarchically ordered ordained priesthood, from the Celestial Masters onward. Added as partial.",
  "nothing-wrong:shinto": "Shinto has tsumi and kegare, and harae opens every ceremony. Pollution is contracted externally rather than inherent, so partial rather than affirm.",
  "no-gods:thera": "Devas are real beings in Buddhist cosmology — Peter Harvey calls it trans-polytheism. What is denied is a creator. Removed.",
  "no-gods:jain": "Jainism denies a creator but affirms devas and venerates liberated souls. Removed.",
  "no-gods:conf": "Confucianism reveres Tian and maintains ancestral rites. Removed.",
  "uncreated:thera": "Dependent origination rules out a primal unmoved mover; denying a creator is definitional. Upgraded to affirm.",
  "uncreated:zen": "Mahayana shares the denial of a creator deity. Added as affirm.",
  "fallen:cath": "Orthodoxy denies inherited guilt but affirms inherited corruption and the inability to fix it alone, which is what this shelf asks about. The merged entry survives.",
  "grace:zoro": "Salvation depends on the sum of one's thoughts, words and deeds, with no divine intervention able to alter it. Added as reject.",
  "god-personal:stoic": "Stoic theology is an amalgam of pantheism and theism — Cleanthes addressed Zeus as a personal ruler and the Stoics prayed. Moved from reject to partial.",
  "god-personal:vedanta": "Ishvara, saguna Brahman, is a genuine object of worship at the empirical level, and Shankara composed hymns to deities. Added as partial.",
  "devotion:stoic": "The Hymn to Zeus is a devotional text. Reject removed.",
  "devotion:vedanta": "Advaita treats bhakti as a valid path that purifies the mind for knowledge. Added as partial.",
  "cycles:stoic": "Ekpyrosis and the recurrence of identical worlds. Added as partial.",
  "dissolve:jain": "Jain moksha rejects merger outright: the purified jiva keeps eternal individuality at Siddhashila, in explicit contrast to Advaita. Moved from partial to reject.",
  "veil:jain": "Jain metaphysics is realist — jiva and ajiva are real substances in an uncreated universe. Karma obscures perception, it doesn't unmake the world. Moved to reject.",
  "pilgrimage:sikh": "Guru Nanak condemned pilgrimage as blind ritual. Moved from partial to reject.",
  "fasting:sikh": "Condemned alongside pilgrimage as outward observance without inner devotion. Added as reject.",
  "sabbath:islam": "Quran 62:10 sends worshippers back out to seek their livelihood once the prayer ends, and the tradition draws the contrast with the Jewish Sabbath itself. Moved to reject.",
  "sabbath:cath": "CCC 2185 and Canon 1247 make refraining from work a genuine obligation, not a custom. Affirm confirmed.",
  "weekly:islam": "Jumu'ah is an obligation on every adult, not a preference. Upgraded to affirm.",
  "daily-prayer:cath": "The Liturgy of the Hours binds clergy and religious; lay Catholics have no fixed-time obligation. Moved from affirm to partial.",
  "seasons:jud": "Pesach, Shavuot and Sukkot are harvest festivals by origin, and the calendar is intercalated to keep them in their agricultural seasons. Upgraded to affirm.",
};

const checkedFor = (faithId) =>
  Object.keys(CHECKED).filter((k) => k.split(":")[1] === faithId);

const isChecked = (itemId, faithId) =>
  Object.prototype.hasOwnProperty.call(CHECKED, `${itemId}:${faithId}`);

/* Every explicit position taken anywhere in the shelves. */
function claimCount() {
  return ALL_ITEMS.reduce((s, i) => s + i.y.length + i.p.length + i.n.length, 0);
}

/* Which belief already in the bag does this one pull against? */
function clashFor(id, bag) {
  for (const [a, b, note] of TENSIONS) {
    if (a === id && bag.includes(b)) return { other: b, note };
    if (b === id && bag.includes(a)) return { other: a, note };
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  THE QUESTIONS  (for people who'd rather be asked than browse)      */
/* ------------------------------------------------------------------ */

const QUIZ = [
  {
    q: "It's 3am and you are badly frightened. What do you do?",
    a: [
      { t: "Speak to someone I believe is listening", g: ["god-personal"] },
      { t: "Breathe, and watch the fear come apart", g: ["craving", "meditation-path"] },
      { t: "Remind myself it's chemistry and it passes", g: ["no-gods", "evidence"] },
      { t: "Ask someone who died to sit with me", g: ["ancestors", "spirits"] },
      { t: "Nothing. Fear at 3am is just the night", g: ["nothing-wrong"] },
    ],
  },
  {
    q: "A good person suffers badly, for no reason. Which answer could you live with?",
    a: [
      { t: "It belongs to a plan I can't see", g: ["god-personal", "one-arc"] },
      { t: "They're carrying something from before this life", g: ["rebirth", "cycles"] },
      { t: "This is what loving a fragile world costs", g: ["craving"] },
      { t: "Nothing explains it. Nobody is answering", g: ["no-gods", "lights-out"] },
      { t: "The arrangements are broken and that's on us", g: ["injustice", "reduce-suffering"] },
    ],
  },
  {
    q: "Someone hands you a book that claims to be the final word.",
    a: [
      { t: "I read it as the final word", g: ["one-book"] },
      { t: "I read it, plus 800 years of arguing about it", g: ["tradition"] },
      { t: "I test it against what I can check", g: ["evidence", "reason-path"] },
      { t: "I trust what it does to me while I read", g: ["own-experience"] },
      { t: "I ask who I'd have to become to understand it", g: ["teacher"] },
    ],
  },
  {
    q: "How much should this cost you in an ordinary week?",
    a: [
      { t: "Almost nothing. Live decently and stop there", g: ["no-practice"] },
      { t: "An hour, with the same people", g: ["weekly"] },
      { t: "Something small, every single day", g: ["daily-prayer", "sitting"] },
      { t: "It shapes what I eat, wear and buy", g: ["food-rules", "law-ritual"] },
      { t: "One day a week, walled off completely", g: ["sabbath"] },
    ],
  },
  {
    q: "Honestly — what are you most likely to worship?",
    a: [
      { t: "A God with a name, who can be addressed", g: ["god-personal", "devotion"] },
      { t: "The whole thing: stars, cells, weather", g: ["pantheism", "interconnected"] },
      { t: "Whatever's behind it, which has no name", g: ["god-impersonal", "unknowable"] },
      { t: "The local ones. This river, this house", g: ["spirits", "local"] },
      { t: "Nothing. Worship isn't a gear I have", g: ["no-gods", "alone"] },
    ],
  },
  {
    q: "You die. Best realistic case?",
    a: [
      { t: "I see the people I loved again", g: ["heaven-hell", "resurrection"] },
      { t: "I get another go at it", g: ["rebirth"] },
      { t: "The 'I' finally stops", g: ["dissolve"] },
      { t: "I stay near the family", g: ["ancestors"] },
      { t: "Nothing at all, and that's fine", g: ["lights-out"] },
    ],
  },
  {
    q: "Two people disagree about right and wrong. Who settles it?",
    a: [
      { t: "A commandment, from outside both of them", g: ["commands"] },
      { t: "Whichever choice leaves less suffering", g: ["reduce-suffering", "compassion"] },
      { t: "The elders, and what's always been done", g: ["elders", "family-order"] },
      { t: "Each of them, if nobody gets hurt", g: ["harm-none", "own-experience"] },
      { t: "Whoever becomes a better person by choosing", g: ["virtue"] },
    ],
  },
  {
    q: "Your religion has a building. What is it?",
    a: [
      { t: "A cathedral, with a hierarchy above it", g: ["clergy", "universal"] },
      { t: "A hall where everyone cooks and eats together", g: ["equality", "obligation-poor"] },
      { t: "A room with cushions and a teacher", g: ["sitting", "teacher"] },
      { t: "A shrine at the edge of the woods", g: ["spirits", "seasons"] },
      { t: "There's no building", g: ["alone", "no-practice"] },
    ],
  },
  {
    q: "Is history going anywhere?",
    a: [
      { t: "Toward an ending that was always coming", g: ["one-arc"] },
      { t: "Around, and around, and around", g: ["cycles"] },
      { t: "Somewhere better, if we push it", g: ["progress", "injustice"] },
      { t: "Nowhere. It's weather", g: ["nothing-wrong", "uncreated"] },
      { t: "Only my own life goes anywhere", g: ["alone"] },
    ],
  },
  {
    q: "The hardest thing you would actually accept:",
    a: [
      { t: "Harm nothing alive — insects included", g: ["ahimsa"] },
      { t: "Give away a fixed share of my income, always", g: ["obligation-poor"] },
      { t: "Go without food for a season, yearly", g: ["fasting"] },
      { t: "Travel somewhere far because it's holy", g: ["pilgrimage"] },
      { t: "None of it. That's too much to ask", g: ["no-practice", "harm-none"] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  RECEIPT → PNG  (hand-drawn on canvas so it can be saved & shared)  */
/* ------------------------------------------------------------------ */

function receiptImage({ bag, results, tensions, demand, demandWord, name, spec, margin }) {
  const PAPER = "#F3F1E7", INK = "#191C16", SHELF = "#C6D0C4", STAMP = "#B32B23", PINE = "#2C4A3C", TRACK = "#DCD8C8";
  const S = 2, W = 640, M = 46, CW = W - M * 2;
  const cv = document.createElement("canvas");
  cv.width = W * S;
  cv.height = 4200 * S;
  const c = cv.getContext("2d");
  c.scale(S, S);
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, 4200);
  c.textBaseline = "alphabetic";

  const MONO = (s, w = 400) => `${w} ${s}px "Sometype Mono", ui-monospace, monospace`;
  const DISP = (s) => `${s}px Anton, Impact, sans-serif`;
  let y = 0;

  const zig = (atY, down) => {
    c.fillStyle = SHELF;
    c.beginPath();
    for (let x = 0; x < W; x += 14) {
      c.moveTo(x, atY);
      c.lineTo(x + 7, atY + (down ? -11 : 11));
      c.lineTo(x + 14, atY);
      c.closePath();
    }
    c.fill();
    c.fillStyle = SHELF;
    c.fillRect(0, down ? atY : atY - 11, W, 11);
  };

  const put = (txt, o = {}) => {
    c.font = o.font || MONO(13);
    c.fillStyle = o.color || INK;
    c.textAlign = o.align || "left";
    c.globalAlpha = o.alpha ?? 1;
    const x = o.align === "center" ? W / 2 : o.align === "right" ? W - M : (o.x ?? M);
    c.fillText(txt, x, y);
    c.globalAlpha = 1;
    y += o.lh ?? 19;
  };
  const wrapPut = (txt, o = {}) => {
    const font = o.font || MONO(11.5);
    c.font = font;
    const max = o.max ?? CW;
    const out = [];
    let ln = "";
    txt.split(" ").forEach((w) => {
      const t = ln ? ln + " " + w : w;
      if (c.measureText(t).width > max && ln) { out.push(ln); ln = w; } else ln = t;
    });
    if (ln) out.push(ln);
    out.forEach((l) => put(l, { ...o, font, lh: o.lh ?? 16 }));
  };
  const dash = (gap = 12) => {
    y += 2;
    c.strokeStyle = INK; c.globalAlpha = 0.45; c.setLineDash([4, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke();
    c.setLineDash([]); c.globalAlpha = 1;
    y += gap;
  };
  const row = (l, r, o = {}) => {
    c.font = o.font || MONO(12.5);
    c.fillStyle = INK;
    c.textAlign = "left";
    c.globalAlpha = o.alpha ?? 1;
    c.fillText(l, o.x ?? M, y);
    c.textAlign = "right";
    c.fillText(r, W - M, y);
    c.globalAlpha = 1;
    y += o.lh ?? 18;
  };
  const fit = (txt, size, weightFont) => {
    let s = size;
    c.font = weightFont(s);
    while (c.measureText(txt).width > CW - 24 && s > 11) { s -= 1; c.font = weightFont(s); }
    return weightFont(s);
  };

  zig(11, false);
  y = 60;

  put("BELIEF MART", { font: DISP(21), align: "center", lh: 17 });
  put("THANK YOU FOR BUILDING", { font: MONO(9.5), align: "center", alpha: 0.55, lh: 26 });
  put(String(name || "").toUpperCase(), { font: fit(String(name || "").toUpperCase(), 30, DISP), align: "center", lh: 24 });
  dash();

  bag.forEach((id) => {
    const it = ITEM_BY_ID[id];
    c.font = MONO(11);
    c.fillStyle = INK;
    c.globalAlpha = 0.5;
    c.textAlign = "left";
    c.fillText("A" + it.aisle, M, y);
    c.globalAlpha = 1;
    row(it.t, "•".repeat(it.d), { x: M + 30, lh: 18 });
  });

  dash();
  row(`${bag.length} beliefs`, `ASKS OF YOU ${demand}`, { font: MONO(12.5, 700) });
  wrapPut(demandWord, { alpha: 0.65 });
  y += 12;

  const top = results[0];
  const boxH = 108;
  c.save();
  c.translate(W / 2, y + boxH / 2);
  c.rotate(-0.032);
  c.strokeStyle = STAMP;
  c.lineWidth = 3;
  c.strokeRect(-CW / 2, -boxH / 2, CW, boxH);
  c.fillStyle = STAMP;
  c.textAlign = "center";
  c.font = MONO(9.5);
  c.fillText("CLOSEST EXISTING MATCH", 0, -boxH / 2 + 22);
  c.font = DISP(40);
  c.fillText(top.pct + "%", 0, -boxH / 2 + 62);
  c.font = fit(top.name.toUpperCase(), 21, DISP);
  c.fillText(top.name.toUpperCase(), 0, -boxH / 2 + 86);
  c.restore();
  y += boxH + 22;

  wrapPut(`SPECIFICITY: ${spec.label} — ${spec.note}` + (margin < 8 ? ` Effectively a tie with ${results[1].name}.` : ""), { alpha: 0.75 });
  y += 10;
  if (!top.narrowed.length) {
    put("WHAT NARROWED IT DOWN", { font: MONO(11, 700), lh: 18 });
    wrapPut("Nothing did. Every belief in your bag is one that most traditions already hold.", { font: MONO(11.5) });
    y += 8;
  }
  if (top.narrowed.length) {
    put("WHAT NARROWED IT DOWN", { font: MONO(11, 700), lh: 18 });
    top.narrowed.forEach((id) =>
      wrapPut("\u00b7 " + ITEM_BY_ID[id].t + (RARITY[id] === "SPECIALTY" ? "  (few hold this)" : ""), { font: MONO(11.5) })
    );
    y += 8;
  }
  if (top.clash.length) {
    put("WHERE YOU PART WAYS", { font: MONO(11, 700), lh: 18 });
    top.clash.slice(0, 5).forEach((id) => wrapPut("· " + ITEM_BY_ID[id].t + " — it says no.", { font: MONO(11.5) }));
    y += 8;
  }
  if (top.missing.length) {
    put("LEFT ON THE SHELF", { font: MONO(11, 700), lh: 18 });
    top.missing.slice(0, 5).forEach((id) => wrapPut("· " + ITEM_BY_ID[id].t, { font: MONO(11.5) }));
    y += 8;
  }

  dash();
  put("ALSO IN THE NEIGHBORHOOD", { font: MONO(11, 700), lh: 20 });
  results.slice(1, 5).forEach((r) => {
    row(r.name, r.pct + "%", { font: MONO(11.5), lh: 15 });
    c.fillStyle = TRACK;
    c.fillRect(M, y - 4, CW, 8);
    c.fillStyle = PINE;
    c.fillRect(M, y - 4, (CW * r.pct) / 100, 8);
    y += 16;
    wrapPut(
      r.clash.length
        ? `Sticking point: ${ITEM_BY_ID[r.clash[0]].t.toLowerCase()}.`
        : `Adds: ${r.missing.slice(0, 2).map((m) => ITEM_BY_ID[m].t.toLowerCase()).join(", ") || "little you skipped"}.`,
      { font: MONO(10.5), alpha: 0.6, lh: 15 }
    );
    y += 6;
  });

  if (tensions.length) {
    dash();
    put(`TENSIONS IN YOUR BAG (${tensions.length})`, { font: MONO(11, 700), lh: 18 });
    tensions.slice(0, 6).forEach(([a, b, note]) => wrapPut("· " + note, { font: MONO(11.5) }));
    y += 4;
    wrapPut("Not a failing grade. Every tradition on this receipt carries contradictions it has argued about for centuries.", { alpha: 0.6 });
  }

  dash();
  wrapPut("Percentages compare your picks against a simplified sketch of each tradition. Real ones contain schools that disagree with each other more than they disagree with you.", { alpha: 0.6 });

  y += 16;
  let bx = M + 12;
  const seed = bag.length * 7 + demand;
  c.fillStyle = INK;
  for (let i = 0; i < 46 && bx < W - M - 12; i++) {
    const w = 1 + ((seed + i * 13) % 4);
    c.fillRect(bx, y, w, 46);
    bx += w + 3;
  }
  y += 62;
  put("NO REFUNDS · NO EXCHANGES", { font: MONO(10), align: "center", alpha: 0.6, lh: 26 });

  zig(y, true);
  const H = y + 11;

  const out = document.createElement("canvas");
  out.width = W * S;
  out.height = H * S;
  out.getContext("2d").drawImage(cv, 0, 0, W * S, H * S, 0, 0, W * S, H * S);
  return out.toDataURL("image/png");
}

/* ------------------------------------------------------------------ */
/*  SHELF HELPERS                                                      */
/* ------------------------------------------------------------------ */

/* Rough families, used only to hint at where you're drifting before the
   bag is big enough to name anything honestly. */
const FAMILY = {
  cath: "Abrahamic", evan: "Abrahamic", main: "Abrahamic", islam: "Abrahamic", jud: "Abrahamic",
  bahai: "Abrahamic", zoro: "Abrahamic & Iranian",
  vedanta: "Dharmic", bhakti: "Dharmic", thera: "Dharmic", zen: "Dharmic",
  sikh: "Dharmic", jain: "Dharmic",
  tao: "East Asian", conf: "East Asian", shinto: "East Asian",
  pagan: "earth and ancestors", animist: "earth and ancestors",
  uu: "reasoned and secular", human: "reasoned and secular",
  stoic: "reasoned and secular", deism: "reasoned and secular",
};

/* What to whisper in the bottom bar while someone is still shopping.
   Deliberately vague early on — naming a match off three picks would be
   a lie, and it spoils the checkout. */
function leaning(bag, results) {
  if (bag.length < 4) return { level: "none", text: "keep going — too early to read" };
  const top = results[0];
  if (!top || top.pct <= 0) return { level: "none", text: "nothing matches this yet" };
  if (bag.length < 8) return { level: "vague", text: `drifting ${FAMILY[top.id] || "somewhere"}` };
  return { level: "named", text: `leaning ${top.name} · ${top.pct}%` };
}

/* People search for the thing, not our phrasing of it — "money", "death",
   "reincarnation", "kosher". Titles alone miss almost all of that. */
const KEYWORDS = {
  "god-personal": "god prayer lord allah father theism monotheism",
  "god-impersonal": "brahman tao ground of being abstract impersonal",
  "gods-many": "polytheism pantheon deities gods goddesses",
  pantheism: "nature universe spinoza cosmos immanent",
  "no-gods": "atheism atheist secular none nothing godless",
  clockmaker: "deism watchmaker absent distant creator",
  spirits: "animism kami ghosts nature genius loci haunted",
  unknowable: "mystery ineffable apophatic hidden",
  fallen: "sin original sin evil guilt depravity",
  "good-ignorant": "innocent ignorance potential",
  craving: "desire attachment suffering dukkha wanting",
  forgetting: "ego illusion self identity maya",
  injustice: "politics justice society oppression inequality",
  "nothing-wrong": "acceptance fine contentment",
  "heaven-hell": "heaven death afterlife judgment paradise hell damnation",
  rebirth: "reincarnation samsara karma death transmigration",
  dissolve: "nirvana nibbana moksha death ego annihilation",
  ancestors: "death dead family ghosts veneration",
  "lights-out": "death mortality annihilation nothing atheism",
  resurrection: "death judgment day end times body messiah",
  otherworld: "death soul spirit realm summerland",
  grace: "faith salvation forgiveness mercy justification",
  deeds: "works merit karma judgment scales",
  "law-ritual": "halakha sharia commandments ritual observance rules",
  "meditation-path": "meditation insight vipassana enlightenment practice",
  devotion: "bhakti love worship surrender",
  "reason-path": "philosophy logic thinking rationality",
  "nothing-to-fix": "acceptance salvation unnecessary",
  "one-book": "bible quran torah scripture guru granth revelation",
  tradition: "commentary talmud interpretation midrash hermeneutics",
  teacher: "guru rabbi roshi lineage master initiation",
  "own-experience": "personal intuition private mystical",
  evidence: "science reason proof empiricism skepticism",
  elders: "ancestors custom oral tradition",
  clergy: "priest imam church hierarchy ordination bishop",
  "daily-prayer": "salat namaz prayer devotion liturgy hours",
  weekly: "church synagogue mosque sunday service congregation",
  sitting: "meditation zazen mindfulness practice",
  fasting: "fast ramadan lent yom kippur hunger abstinence",
  pilgrimage: "hajj travel camino shrine journey",
  "food-rules": "kosher halal vegetarian vegan diet food eating",
  sabbath: "shabbat sunday rest work day off",
  chanting: "mantra kirtan music song japa recitation",
  altar: "shrine offerings home puja incense",
  seasons: "solstice festival holiday calendar equinox harvest",
  "no-practice": "nothing easy casual unobservant",
  commands: "commandments rules morality divine command law",
  ahimsa: "nonviolence vegetarian animals harm insects pacifism",
  compassion: "kindness mercy love empathy metta",
  "obligation-poor": "money charity tithe zakat tzedakah alms giving poverty income",
  "family-order": "filial piety parents duty hierarchy respect",
  "harm-none": "freedom liberty wiccan rede consent",
  "reduce-suffering": "utilitarian consequences outcomes harm",
  virtue: "character excellence ethics habit",
  "one-arc": "apocalypse end times creation linear eschatology",
  cycles: "yuga eternal return kalpa time",
  uncreated: "eternal beginningless steady",
  interconnected: "oneness nonduality ecology web indra",
  veil: "maya illusion appearance simulation",
  progress: "optimism history improvement utopia",
  universal: "mission evangelism outreach everyone catholic",
  "a-people": "ethnic tribe nation chosen people covenant",
  alone: "solo individual private unaffiliated",
  local: "small community village congregational",
  monastics: "monks nuns monastery celibacy sangha order",
  equality: "caste hierarchy equal women democracy",
  "outsiders-lost": "exclusivism damnation hell others salvation outside",
  "many-roads": "pluralism tolerance interfaith perennialism",
  "we-have-it-whole": "inclusivism fulfilment supersession",
  "not-our-business": "tolerance privacy indifference",
  "convert-in": "conversion converts joining membership baptism",
  "no-tell": "proselytizing missionary evangelism recruiting",
  intermarry: "marriage wedding family endogamy assimilation",
  "argue-well": "debate disagreement dissent machloket dispute",
};

function matchesQuery(item, q) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = `${item.t} ${item.s} ${item.an || ""} ${item.id.replace(/-/g, " ")} ${KEYWORDS[item.id] || ""}`.toLowerCase();
  return s.split(/\s+/).every((word) => hay.includes(word));
}

function untouchedAisles(bag) {
  return AISLES.filter((a) => !a.items.some((i) => bag.includes(i.id)));
}

function demandOf(ids) {
  return ids.reduce((s, id) => s + (ITEM_BY_ID[id]?.d || 0), 0);
}

/* ===== LOGIC:END ===== */

/* ------------------------------------------------------------------ */
/*  UI                                                                 */
/* ------------------------------------------------------------------ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Instrument+Sans:wght@400;500;600&family=Sometype+Mono:wght@400;500;700&display=swap');

.bm { --shelf:#C6D0C4; --paper:#F3F1E7; --ink:#191C16; --stamp:#B32B23;
      --pine:#2C4A3C; --sun:#E0AC3C; --line:#B6B1A0;
      background:var(--shelf); color:var(--ink); min-height:100%;
      font-family:'Instrument Sans',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
.bm *{box-sizing:border-box;}
.bm button{font-family:inherit; cursor:pointer;}
.bm button:focus-visible, .bm [tabindex]:focus-visible{outline:3px solid var(--stamp); outline-offset:2px;}
.bm-display{font-family:'Anton',Impact,sans-serif; font-weight:400; letter-spacing:.01em; text-transform:uppercase;}
.bm-mono{font-family:'Sometype Mono',ui-monospace,monospace;}

.bm-top{position:sticky; top:0; z-index:20; background:var(--pine); color:var(--paper);
        padding:10px 14px 0; border-bottom:2px solid var(--ink);}
.bm-sign{display:flex; align-items:baseline; gap:8px; padding-bottom:8px;}
.bm-sign h1{font-size:26px; margin:0; line-height:.9;}
.bm-sign span{font-size:9px; letter-spacing:.18em; opacity:.75;}
.bm-aisles{display:flex; gap:6px; overflow-x:auto; padding-bottom:9px; scrollbar-width:none;}
.bm-aisles::-webkit-scrollbar{display:none;}
.bm-chip{flex:0 0 auto; background:none; border:1px solid rgba(243,241,231,.4); color:var(--paper);
         border-radius:999px; padding:5px 11px; font-size:11px; letter-spacing:.04em; white-space:nowrap;}
.bm-chip[data-on="1"]{background:var(--sun); color:var(--ink); border-color:var(--sun); font-weight:600;}

.bm-body{padding:18px 14px 132px; max-width:900px; margin:0 auto;}
.bm-aisle{scroll-margin-top:172px; margin-bottom:26px;}
.bm-aisle-head{display:flex; align-items:center; gap:10px; margin-bottom:10px;}
.bm-aisle-num{font-size:11px; letter-spacing:.14em; background:var(--ink); color:var(--paper); padding:3px 7px;}
.bm-aisle-head h2{font-size:19px; margin:0;}
.bm-rule{flex:1; height:1px; background:var(--ink); opacity:.35;}

.bm-grid{display:grid; grid-template-columns:1fr; gap:9px;}
@media(min-width:620px){ .bm-grid{grid-template-columns:1fr 1fr;} }

.bm-card{background:var(--paper); border:1.5px solid var(--ink); padding:12px 12px 10px;
         display:flex; flex-direction:column; gap:7px; position:relative; transition:transform .12s ease;}
.bm-card[data-in="1"]{background:#FBF9F0; box-shadow:4px 4px 0 var(--pine);}
.bm-card h3{margin:0; font-size:15px; font-weight:600; line-height:1.25;}
.bm-card p{margin:0; font-size:13px; line-height:1.4; opacity:.72;}
.bm-cardfoot{display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:auto; padding-top:4px;}
.bm-ask{font-size:9.5px; letter-spacing:.1em; opacity:.6; display:flex; align-items:center; gap:5px;}
.bm-dots{display:flex; gap:2px;}
.bm-dot{width:6px; height:6px; border:1px solid var(--ink); border-radius:50%;}
.bm-dot[data-f="1"]{background:var(--ink);}
.bm-add{border:1.5px solid var(--ink); background:var(--paper); color:var(--ink);
        padding:6px 12px; font-size:11.5px; letter-spacing:.06em; font-weight:600; text-transform:uppercase;}
.bm-add:hover{background:var(--sun);}
.bm-add[data-in="1"]{background:var(--pine); color:var(--paper); border-color:var(--pine);}

.bm-bar{position:fixed; left:0; right:0; bottom:0; z-index:30; background:var(--ink); color:var(--paper);
        display:flex; align-items:center; gap:10px; padding:11px 14px;}
.bm-count{font-size:12px; letter-spacing:.04em; flex:1; text-align:left; background:none; border:none;
          color:var(--paper); padding:0; text-decoration:underline; text-underline-offset:3px;}
.bm-checkout{background:var(--sun); color:var(--ink); border:none; padding:11px 18px;
             font-size:14px; letter-spacing:.03em;}
.bm-checkout:disabled{opacity:.35; cursor:not-allowed;}

.bm-sheet{position:fixed; inset:0; z-index:40; background:rgba(25,28,22,.55); display:flex; align-items:flex-end;}
.bm-sheet-in{background:var(--paper); width:100%; max-height:74vh; overflow:auto; border-top:2px solid var(--ink);}
@media(min-width:620px){ .bm-sheet{align-items:center; justify-content:center;}
  .bm-sheet-in{max-width:560px; border:2px solid var(--ink);} }
.bm-sheet-head{position:sticky; top:0; background:var(--paper); border-bottom:1px solid var(--line);
               padding:13px 15px; display:flex; justify-content:space-between; align-items:center;}
.bm-bagrow{display:flex; gap:10px; align-items:center; padding:9px 15px; border-bottom:1px dotted var(--line); font-size:13px;}
.bm-x{margin-left:auto; background:none; border:none; font-size:16px; line-height:1; color:var(--stamp); padding:2px 4px;}

.bm-receipt-wrap{max-width:460px; margin:0 auto; padding:16px 12px 90px;}
.bm-zig{height:9px; background-image:
  linear-gradient(135deg, var(--paper) 50%, transparent 50%),
  linear-gradient(-135deg, var(--paper) 50%, transparent 50%);
  background-size:12px 12px; background-repeat:repeat-x;}
.bm-zig[data-flip="1"]{transform:rotate(180deg);}
.bm-receipt{background:var(--paper); padding:20px 20px 24px; font-family:'Sometype Mono',ui-monospace,monospace;
            font-size:12px; line-height:1.55;}
.bm-receipt h2{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:22px;
               margin:0; text-align:center; letter-spacing:.02em;}
.bm-c{text-align:center;}
.bm-hr{border-top:1px dashed var(--ink); opacity:.5; margin:11px 0;}
.bm-li{display:flex; gap:8px; align-items:baseline;}
.bm-li span:first-child{opacity:.5; flex:0 0 26px;}
.bm-li span:last-child{margin-left:auto; opacity:.6;}
.bm-stamp{border:2.5px solid var(--stamp); color:var(--stamp); padding:9px 12px; transform:rotate(-2.2deg);
          margin:14px 0; text-align:center;}
.bm-stamp .n{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:19px; line-height:1.05;}
.bm-stamp .p{font-size:30px; font-family:'Anton',Impact,sans-serif;}
.bm-meter{height:9px; background:#DCD8C8; position:relative; margin-top:3px;}
.bm-meter i{position:absolute; inset:0 auto 0 0; background:var(--pine); display:block;}
.bm-run{margin-bottom:9px;}
.bm-run-top{display:flex; justify-content:space-between; gap:8px; font-size:11.5px;}
.bm-diff{margin-top:5px;}
.bm-diff li{margin-bottom:3px;}
.bm-note{font-size:11px; opacity:.65; line-height:1.5;}
.bm-barcode{display:flex; gap:1.5px; justify-content:center; align-items:flex-end; height:42px; margin-top:16px;}
.bm-barcode i{background:var(--ink); display:block; height:100%;}
.bm-back{background:var(--paper); border:1.5px solid var(--ink); padding:10px 16px; font-size:12px;
         letter-spacing:.05em; text-transform:uppercase; font-weight:600;}
.bm-empty{background:var(--paper); border:1.5px dashed var(--ink); padding:26px 18px; text-align:center;}

.bm-modes{display:flex; gap:0; margin-bottom:9px;}
.bm-mode{flex:1; background:none; border:1px solid rgba(243,241,231,.45); color:var(--paper);
         padding:7px 6px; font-size:11px; letter-spacing:.09em; text-transform:uppercase;}
.bm-mode + .bm-mode{border-left:none;}
.bm-mode[data-on="1"]{background:var(--paper); color:var(--pine); font-weight:700; border-color:var(--paper);}

.bm-filter{display:flex; align-items:center; gap:8px; padding:0 0 9px; font-size:10.5px; letter-spacing:.06em;}
.bm-switch{background:none; border:1px solid rgba(243,241,231,.45); color:var(--paper);
           border-radius:999px; padding:4px 10px; font-size:10.5px; letter-spacing:.06em;}
.bm-switch[data-on="1"]{background:var(--stamp); border-color:var(--stamp); font-weight:600;}
.bm-hidden-note{background:var(--paper); border:1px dashed var(--ink); padding:9px 11px;
                font-size:11.5px; margin-bottom:12px; display:flex; gap:9px; align-items:center;}

.bm-quiz{max-width:560px; margin:0 auto; padding:22px 14px 120px;}
.bm-prog{display:flex; gap:3px; margin-bottom:20px;}
.bm-prog i{flex:1; height:4px; background:rgba(25,28,22,.18); display:block;}
.bm-prog i[data-on="1"]{background:var(--pine);}
.bm-q{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:24px;
      line-height:1.08; margin:0 0 16px;}
.bm-opt{display:block; width:100%; text-align:left; background:var(--paper); border:1.5px solid var(--ink);
        padding:13px 14px; font-size:14.5px; line-height:1.3; margin-bottom:8px;}
.bm-opt:hover{background:#FBF9F0; box-shadow:4px 4px 0 var(--pine); transform:translate(-1px,-1px);}
.bm-opt[data-on="1"]{background:var(--pine); color:var(--paper); border-color:var(--pine);}
.bm-quiznav{display:flex; gap:9px; margin-top:14px; align-items:center;}
.bm-step{font-size:11px; letter-spacing:.1em; opacity:.6; margin-left:auto;}

.bm-modal{position:fixed; inset:0; z-index:60; background:rgba(25,28,22,.75); overflow:auto; padding:18px 12px;}
.bm-modal-in{max-width:420px; margin:0 auto;}
.bm-modal img{width:100%; display:block; border:1px solid rgba(0,0,0,.2);}
.bm-modal-bar{display:flex; gap:8px; margin:12px 0; flex-wrap:wrap; justify-content:center;}

.bm-tag{position:absolute; top:-1px; right:-1px; font-size:8.5px; letter-spacing:.12em;
        padding:3px 6px; font-family:'Sometype Mono',ui-monospace,monospace; font-weight:700;}
.bm-tag[data-k="SPECIALTY"]{background:var(--stamp); color:var(--paper);}
.bm-tag[data-k="COMMON STOCK"]{background:#D9D5C5; color:var(--ink);}

.bm-banner{background:var(--pine); color:var(--paper); padding:10px 12px; margin-bottom:14px;
           font-size:12px; display:flex; gap:10px; align-items:center; flex-wrap:wrap;}
.bm-banner button{background:var(--paper); color:var(--pine); border:none; padding:6px 10px;
                  font-size:11px; letter-spacing:.05em; text-transform:uppercase; font-weight:700;}

.bm-namebox{text-align:center; margin:2px 0 8px;}
.bm-nameinput{width:100%; text-align:center; background:transparent; border:none;
              border-bottom:1px dashed var(--line); font-family:'Anton',Impact,sans-serif;
              text-transform:uppercase; font-size:21px; color:var(--ink); padding:3px 0; letter-spacing:.02em;}
.bm-nameinput:focus{outline:none; border-bottom-color:var(--stamp);}
.bm-tiny{background:none; border:none; font-family:'Sometype Mono',ui-monospace,monospace;
         font-size:10px; letter-spacing:.1em; text-decoration:underline; text-underline-offset:3px;
         color:var(--ink); opacity:.6; padding:2px 4px;}

.bm-code{width:100%; font-family:'Sometype Mono',ui-monospace,monospace; font-size:11px;
         background:var(--paper); border:1.5px solid var(--ink); padding:9px 10px; color:var(--ink);}
.bm-share{max-width:460px; margin:14px auto 0; display:flex; flex-direction:column; gap:8px;}
.bm-share-row{display:flex; gap:8px;}

.bm-cmp{max-width:560px; margin:0 auto; padding:20px 14px 60px;}
.bm-cmp-head{display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px;}
.bm-cmp-card{background:var(--paper); border:1.5px solid var(--ink); padding:11px;}
.bm-cmp-card .n{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:15px; line-height:1.1;}
.bm-cmp-sec{background:var(--paper); border:1.5px solid var(--ink); padding:12px; margin-bottom:10px;}
.bm-cmp-sec h4{margin:0 0 7px; font-family:'Sometype Mono',ui-monospace,monospace;
               font-size:10.5px; letter-spacing:.12em; font-weight:700;}
.bm-cmp-sec li{font-size:13px; margin-bottom:3px;}

.bm-search{display:flex; gap:6px; padding-bottom:9px; align-items:center;}
.bm-searchbox{flex:1; position:relative; display:flex; align-items:center;}
.bm-searchbox input{width:100%; background:rgba(243,241,231,.12); border:1px solid rgba(243,241,231,.4);
  color:var(--paper); padding:6px 26px 6px 10px; font-size:12px; font-family:inherit; border-radius:999px;}
.bm-searchbox input::placeholder{color:rgba(243,241,231,.55);}
.bm-searchbox button{position:absolute; right:4px; background:none; border:none; color:var(--paper);
  font-size:14px; line-height:1; padding:2px 5px; opacity:.75;}

.bm-lean{position:fixed; left:0; right:0; bottom:52px; z-index:29; background:var(--pine); color:var(--paper);
  font-family:'Sometype Mono',ui-monospace,monospace; font-size:10.5px; letter-spacing:.09em;
  padding:5px 14px; border-top:1px solid rgba(243,241,231,.2); text-transform:uppercase;}
.bm-lean[data-l="named"]{background:var(--sun); color:var(--ink); font-weight:700;}

.bm-toast{position:fixed; left:12px; right:12px; bottom:96px; z-index:45; background:var(--paper);
  border:1.5px solid var(--ink); box-shadow:4px 4px 0 var(--pine); padding:10px 12px;
  display:flex; gap:10px; align-items:center; font-size:12.5px;}
.bm-toast button{margin-left:auto; background:var(--ink); color:var(--paper); border:none;
  padding:6px 11px; font-size:11px; letter-spacing:.08em; text-transform:uppercase; font-weight:700;}

.bm-saved{border-top:2px solid var(--ink); margin-top:6px;}
.bm-saved h4{margin:0; padding:11px 15px 6px; font-family:'Sometype Mono',ui-monospace,monospace;
  font-size:10.5px; letter-spacing:.12em;}
.bm-saved-row{display:flex; gap:8px; align-items:center; padding:8px 15px; border-bottom:1px dotted var(--line);}
.bm-saved-row .nm{font-weight:600; font-size:13px;}
.bm-saved-row .mt{font-family:'Sometype Mono',ui-monospace,monospace; font-size:10px; opacity:.6;}
.bm-mini{background:var(--paper); border:1.5px solid var(--ink); padding:5px 9px; font-size:10.5px;
  letter-spacing:.05em; text-transform:uppercase; font-weight:700;}

.bm-dir{display:grid; grid-template-columns:1fr; gap:8px;}
@media(min-width:620px){ .bm-dir{grid-template-columns:1fr 1fr;} }
.bm-dircard{background:var(--paper); border:1.5px solid var(--ink); padding:11px 12px; text-align:left; width:100%;}
.bm-dircard .n{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:16px; line-height:1.1;}
.bm-dircard .l{font-size:12px; opacity:.7; margin-top:2px;}
.bm-dircard .m{display:flex; justify-content:space-between; font-family:'Sometype Mono',ui-monospace,monospace;
  font-size:10px; letter-spacing:.08em; margin-top:7px; opacity:.75;}

.bm-faith{max-width:620px; margin:0 auto; padding:18px 14px 60px;}
.bm-faith h2{font-family:'Anton',Impact,sans-serif; text-transform:uppercase; font-size:27px; line-height:1; margin:0;}
.bm-stats{display:flex; gap:14px; flex-wrap:wrap; font-family:'Sometype Mono',ui-monospace,monospace;
  font-size:10.5px; letter-spacing:.08em; margin:10px 0 16px; opacity:.8;}
.bm-panel{background:var(--paper); border:1.5px solid var(--ink); padding:12px; margin-bottom:10px;}
.bm-panel h3{margin:0 0 8px; font-family:'Sometype Mono',ui-monospace,monospace; font-size:10.5px;
  letter-spacing:.12em; font-weight:700;}
.bm-pill{display:inline-block; border:1px solid var(--ink); padding:3px 8px; font-size:12px; margin:0 4px 4px 0;}
.bm-pill[data-k="no"]{border-color:var(--stamp); color:var(--stamp);}
.bm-pill[data-k="mine"]{background:var(--pine); color:var(--paper); border-color:var(--pine);}

.bm-nudge{position:fixed; inset:0; z-index:50; background:rgba(25,28,22,.6); display:flex;
  align-items:center; justify-content:center; padding:18px;}
.bm-nudge-in{background:var(--paper); border:2px solid var(--ink); padding:16px; max-width:400px; width:100%;}
.bm-jump{display:flex; flex-wrap:wrap; gap:6px; margin:10px 0 14px;}

.bm-loading{padding:40px 16px; text-align:center; font-family:'Sometype Mono',ui-monospace,monospace;
  font-size:11.5px; letter-spacing:.1em; opacity:.6;}

@media(prefers-reduced-motion:no-preference){
  .bm-print{animation:bmPrint .45s cubic-bezier(.2,.8,.3,1);}
  @keyframes bmPrint{from{transform:translateY(-14px); opacity:0;} to{transform:none; opacity:1;}}
  .bm-card{transition:transform .12s ease, box-shadow .12s ease;}
  .bm-card[data-in="1"]{transform:translate(-1px,-1px);}
}
`;

function Dots({ n }) {
  return (
    <span className="bm-dots">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="bm-dot" data-f={i <= n ? "1" : "0"} />
      ))}
    </span>
  );
}

/* Persistence. Falls back to a session-only experience if storage is absent. */
const store = (typeof window !== "undefined" && window.storage) || null;

export default function BeliefMart() {
  const [bag, setBag] = useState([]);
  const [view, setView] = useState("shop");
  const [mode, setMode] = useState("browse");
  const [sheet, setSheet] = useState(false);
  const [active, setActive] = useState(1);
  const [hideClash, setHideClash] = useState(false);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState({});
  const [img, setImg] = useState(null);
  const [imgBusy, setImgBusy] = useState(false);
  const [customName, setCustomName] = useState("");
  const [nameSeed, setNameSeed] = useState(0);
  const [carrying, setCarrying] = useState(null);
  const [codeIn, setCodeIn] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [other, setOther] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState([]);
  const [storeMsg, setStoreMsg] = useState("");
  const [query, setQuery] = useState("");
  const [undo, setUndo] = useState(null);
  const [nudge, setNudge] = useState(false);
  const [nudged, setNudged] = useState(false);
  const [faithId, setFaithId] = useState(null);
  const [faithFrom, setFaithFrom] = useState("directory");
  const refs = useRef({});
  const undoTimer = useRef(null);

  /* ---- persistence ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!store) { setLoaded(true); return; }
      try {
        const r = await store.get("bm:current");
        if (alive && r && r.value) {
          const v = JSON.parse(r.value);
          if (Array.isArray(v.bag)) setBag(v.bag.filter((id) => ITEM_BY_ID[id]));
          setCustomName(typeof v.customName === "string" ? v.customName : "");
          setNameSeed(Number(v.nameSeed) || 0);
          setCarrying(v.carrying && FAITH_BY_ID[v.carrying] ? v.carrying : null);
        }
      } catch (e) { /* nothing saved yet */ }
      try {
        const r = await store.get("bm:saved");
        if (alive && r && r.value) {
          const arr = JSON.parse(r.value);
          if (Array.isArray(arr)) setSaved(arr.filter((b) => b && Array.isArray(b.bag)));
        }
      } catch (e) { /* no saved builds yet */ }
      if (alive) setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!loaded || !store) return;
    const t = setTimeout(() => {
      (async () => {
        try {
          await store.set("bm:current", JSON.stringify({ bag, customName, nameSeed, carrying }));
        } catch (e) { /* a failed autosave shouldn't interrupt anyone */ }
      })();
    }, 500);
    return () => clearTimeout(t);
  }, [bag, customName, nameSeed, carrying, loaded]);

  const persistSaved = async (next) => {
    setSaved(next);
    if (!store) { setStoreMsg("Saved for this session only — storage is unavailable here."); return; }
    try {
      await store.set("bm:saved", JSON.stringify(next));
    } catch (e) {
      setStoreMsg("That didn't save. Storage may be full.");
    }
  };

  /* ---- the aisle chips should follow the shelves, not just taps ---- */
  useEffect(() => {
    if (mode !== "browse" || view !== "shop" || searching) return;
    if (typeof IntersectionObserver === "undefined") return;
    const els = Object.values(refs.current).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen.length) {
          const n = Number(seen[0].target.dataset.aisle);
          if (n) setActive(n);
        }
      },
      { rootMargin: "-180px 0px -65% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [mode, view, searching, hideClash, bag.length]);

  /* ---- undo ---- */
  const snapshot = (label) => {
    setUndo({ bag, customName, carrying, label });
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 8000);
  };
  const doUndo = () => {
    if (!undo) return;
    setBag(undo.bag);
    setCustomName(undo.customName);
    setCarrying(undo.carrying);
    setUndo(null);
    clearTimeout(undoTimer.current);
  };

  const toggle = (id) => {
    if (bag.includes(id)) snapshot(`Removed “${ITEM_BY_ID[id].t}”`);
    setCarrying(null);
    setBag((b) => (b.includes(id) ? b.filter((x) => x !== id) : [...b, id]));
  };

  const autoName = useMemo(() => buildName(bag, nameSeed), [bag, nameSeed]);
  const shownName = customName.trim() || autoName;
  const shareCode = useMemo(() => encodeBag(bag, shownName), [bag, shownName]);

  const loadCart = (fid) => {
    snapshot(`Loaded ${FAITH_BY_ID[fid].name}'s cart`);
    setBag(cartFor(fid));
    setCarrying(fid);
    setCustomName("");
    setNameSeed(0);
    setView("shop");
    setMode("browse");
    setImg(null);
    window.scrollTo(0, 0);
  };

  const runCompare = () => {
    const got = decodeBag(codeIn);
    if (!got) { setCodeMsg("That code didn't scan. Check for a missing character."); return; }
    setCodeMsg("");
    setOther(got);
    setView("compare");
    window.scrollTo(0, 0);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCodeMsg("Code copied.");
    } catch (e) {
      setCodeMsg("Copy didn't work — select the code above by hand.");
    }
  };

  const results = useMemo(() => scoreFaiths(bag), [bag]);
  const tensions = useMemo(() => findTensions(bag), [bag]);
  const demand = bag.reduce((s, id) => s + (ITEM_BY_ID[id]?.d || 0), 0);
  const spec = useMemo(() => specificity(bag), [bag]);
  const lean = useMemo(() => leaning(bag, results), [bag, results]);
  const untouched = useMemo(() => untouchedAisles(bag), [bag]);
  const searching = query.trim().length > 0;

  const saveBuild = () => {
    const entry = { id: `b${Date.now()}`, name: shownName, bag: [...bag], ts: Date.now() };
    persistSaved([entry, ...saved.filter((b) => b.name !== entry.name)].slice(0, 12));
    setStoreMsg(`Saved “${entry.name}”.`);
  };
  const loadBuild = (b) => {
    snapshot(`Loaded “${b.name}”`);
    setBag(b.bag.filter((id) => ITEM_BY_ID[id]));
    setCustomName(b.name);
    setCarrying(null);
    setSheet(false);
    setView("shop");
    setMode("browse");
    window.scrollTo(0, 0);
  };
  const deleteBuild = (id) => persistSaved(saved.filter((b) => b.id !== id));

  const tryCheckout = () => {
    if (!nudged && bag.length >= 3 && untouched.length >= 3) { setNudge(true); setNudged(true); return; }
    setView("receipt");
  };
  const openFaith = (id) => { setFaithFrom(view === "receipt" ? "receipt" : "directory"); setFaithId(id); setView("faith"); window.scrollTo(0, 0); };
  const margin = results.length > 1 ? results[0].pct - results[1].pct : 99;
  const demandWord =
    demand < 12 ? "Light. You could carry this in a pocket."
    : demand < 28 ? "Moderate. It will show up in your week."
    : demand < 45 ? "Heavy. This reorganizes your calendar."
    : "Total. This is not a hobby, it's a life.";

  /* which shelf items pull against something already in the bag */
  const clashing = useMemo(() => {
    const m = {};
    ALL_ITEMS.forEach((it) => {
      if (bag.includes(it.id)) return;
      const c = clashFor(it.id, bag);
      if (c) m[it.id] = c;
    });
    return m;
  }, [bag]);
  const hiddenCount = Object.keys(clashing).length;

  const answerQuiz = (idx) => {
    const picks = QUIZ[qi].a[idx].g;
    setAnswers((a) => ({ ...a, [qi]: idx }));
    setBag((b) => Array.from(new Set([...b, ...picks])));
    if (qi < QUIZ.length - 1) setTimeout(() => setQi(qi + 1), 160);
    else setTimeout(() => setView("receipt"), 200);
  };

  const makeImage = async () => {
    setImgBusy(true);
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      setImg(receiptImage({ bag, results, tensions, demand, demandWord, name: shownName, spec, margin }));
    } catch (e) {
      setImg("error");
    }
    setImgBusy(false);
  };

  useEffect(() => {
    if (view === "receipt") window.scrollTo(0, 0);
  }, [view]);

  const goAisle = (n) => {
    setActive(n);
    refs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------------- receipt ---------------- */
  if (view === "receipt" && bag.length === 0) {
    return (
      <div className="bm">
        <style>{CSS}</style>
        <div className="bm-receipt-wrap">
          <div className="bm-empty">
            <div className="bm-display" style={{ fontSize: 17 }}>Nothing to ring up</div>
            <div className="bm-note bm-mono" style={{ marginTop: 6 }}>
              You skipped every question. Pick a few beliefs and come back.
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="bm-back" onClick={() => { setView("shop"); setMode("browse"); }}>
                Go to the shelves
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "receipt") {
    const top = results[0];
    const runners = results.slice(1, 5);
    const bars = Array.from({ length: 34 }, (_, i) => 1 + ((bag.length * 7 + i * 13) % 4));

    return (
      <div className="bm">
        <style>{CSS}</style>
        <div className="bm-receipt-wrap bm-print">
          <div className="bm-zig" />
          <div className="bm-receipt">
            <h2>Belief Mart</h2>
            <div className="bm-c" style={{ fontSize: 10, letterSpacing: ".14em", opacity: 0.6 }}>
              THANK YOU FOR BUILDING
            </div>
            <div className="bm-namebox">
              <input
                className="bm-nameinput"
                value={customName}
                placeholder={autoName}
                aria-label="Name your religion"
                onChange={(e) => setCustomName(e.target.value)}
              />
              <div style={{ marginTop: 3 }}>
                {customName.trim() ? (
                  <button className="bm-tiny" onClick={() => setCustomName("")}>USE THE GENERATED NAME</button>
                ) : (
                  <button className="bm-tiny" onClick={() => setNameSeed((s) => s + 1)}>
                    TRY ANOTHER NAME
                  </button>
                )}
              </div>
            </div>
            <div className="bm-hr" />

            {bag.map((id) => {
              const it = ITEM_BY_ID[id];
              return (
                <div className="bm-li" key={id}>
                  <span>A{it.aisle}</span>
                  <span>{it.t}</span>
                  <span>{"•".repeat(it.d)}</span>
                </div>
              );
            })}

            <div className="bm-hr" />
            <div className="bm-li">
              <span></span>
              <span>{bag.length} beliefs</span>
              <span>ASKS OF YOU {demand}</span>
            </div>
            <div className="bm-note" style={{ marginTop: 4 }}>{demandWord}</div>

            <div className="bm-stamp">
              <div style={{ fontSize: 9, letterSpacing: ".18em" }}>CLOSEST EXISTING MATCH</div>
              <div className="p">{top.pct}%</div>
              <button
                className="n"
                style={{ background: "none", border: "none", color: "inherit", font: "inherit", padding: 0, textDecoration: "underline", textUnderlineOffset: 3 }}
                onClick={() => openFaith(top.id)}
              >
                {top.name}
              </button>
              <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: 2 }}>{top.line}</div>
            </div>

            <div className="bm-note" style={{ marginTop: -4, marginBottom: 12 }}>
              <strong>SPECIFICITY: {spec.label}</strong> — {spec.note}
              {margin < 8 && ` Effectively a tie with ${results[1].name}.`}
            </div>

            <div className="bm-note" style={{ marginBottom: 12 }}>
              <strong>COVERAGE:</strong> it has a position on {top.spoken} of your {bag.length}{" "}
              {bag.length === 1 ? "pick" : "picks"}.
              {top.coverage < 0.5 &&
                " It is silent on most of your bag, so it may be topping this list by never disagreeing rather than by matching you."}
            </div>

            {top.narrowed.length > 0 && (
              <div className="bm-diff">
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em" }}>
                  WHAT NARROWED IT DOWN
                </div>
                <div className="bm-note" style={{ marginTop: 3 }}>
                  Your picks that most traditions don't share:
                </div>
                <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                  {top.narrowed.map((id) => (
                    <li key={id}>
                      {ITEM_BY_ID[id].t}
                      {RARITY[id] === "SPECIALTY" && " — few hold this"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {top.narrowed.length === 0 && bag.length > 0 && (
              <div className="bm-diff">
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em" }}>
                  WHAT NARROWED IT DOWN
                </div>
                <div className="bm-note" style={{ marginTop: 3 }}>
                  Nothing did. Every belief in your bag is one that most traditions
                  already hold, so the match above is a shrug with a number on it.
                </div>
              </div>
            )}

            {top.clash.length > 0 && (
              <div className="bm-diff" style={{ marginTop: 11 }}>
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em" }}>
                  WHERE YOU PART WAYS
                </div>
                <ul style={{ margin: "5px 0 0", paddingLeft: 16 }}>
                  {top.clash.slice(0, 5).map((id) => (
                    <li key={id}>{ITEM_BY_ID[id].t} — it says no.</li>
                  ))}
                </ul>
              </div>
            )}

            {top.missing.length > 0 && (
              <div className="bm-diff" style={{ marginTop: 11 }}>
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em" }}>
                  LEFT ON THE SHELF
                </div>
                <div className="bm-note" style={{ marginTop: 3 }}>
                  Central to it, missing from your bag:
                </div>
                <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                  {top.missing.slice(0, 5).map((id) => (
                    <li key={id}>{ITEM_BY_ID[id].t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <button className="bm-tiny" onClick={() => loadCart(top.id)}>
                SEE WHAT {top.name.toUpperCase()} PUT IN ITS CART
              </button>
            </div>

            <div className="bm-hr" />
            <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em", marginBottom: 7 }}>
              ALSO IN THE NEIGHBORHOOD
            </div>
            {runners.map((r) => (
              <div className="bm-run" key={r.id}>
                <div className="bm-run-top">
                  <button className="bm-tiny" style={{ opacity: 1, letterSpacing: 0, fontSize: 11.5 }} onClick={() => openFaith(r.id)}>
                    {r.name}
                  </button>
                  <span>
                    {r.pct}%
                    {r.coverage < 0.5 && <span style={{ opacity: 0.55 }}> · quiet</span>}
                  </span>
                </div>
                <div className="bm-meter"><i style={{ width: `${r.pct}%` }} /></div>
                <div className="bm-note" style={{ marginTop: 2 }}>
                  {r.clash.length
                    ? `Sticking point: ${ITEM_BY_ID[r.clash[0]].t.toLowerCase()}.`
                    : `Adds: ${r.missing.slice(0, 2).map((m) => ITEM_BY_ID[m].t.toLowerCase()).join(", ") || "little you skipped"}.`}
                  {" "}
                  <button className="bm-tiny" onClick={() => loadCart(r.id)}>LOAD ITS CART</button>
                </div>
              </div>
            ))}

            {tensions.length > 0 && (
              <>
                <div className="bm-hr" />
                <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: ".1em" }}>
                  TENSIONS IN YOUR BAG ({tensions.length})
                </div>
                <ul style={{ margin: "5px 0 0", paddingLeft: 16 }}>
                  {tensions.slice(0, 6).map(([a, b, note]) => (
                    <li key={a + b} style={{ marginBottom: 3 }}>{note}</li>
                  ))}
                </ul>
                <div className="bm-note" style={{ marginTop: 6 }}>
                  Not a failing grade. Every tradition on this receipt carries
                  contradictions it has argued about for centuries.
                </div>
              </>
            )}

            <div className="bm-hr" />
            <div className="bm-note">
              Percentages compare your picks against a simplified sketch of each
              tradition. Real ones contain schools that disagree with each other
              more than they disagree with you.
            </div>

            <div className="bm-barcode">
              {bars.map((w, i) => <i key={i} style={{ width: w }} />)}
            </div>
            <div className="bm-c bm-note" style={{ marginTop: 6, letterSpacing: ".12em" }}>
              NO REFUNDS · NO EXCHANGES
            </div>
          </div>
          <div className="bm-zig" data-flip="1" />

          <div style={{ display: "flex", gap: 9, marginTop: 18, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="bm-back" onClick={saveBuild}>Save this build</button>
            <button className="bm-back" onClick={makeImage} disabled={imgBusy}>
              {imgBusy ? "Printing…" : "Save as image"}
            </button>
            <button className="bm-back" onClick={() => { setView("shop"); setMode("browse"); }}>
              Back to the shelves
            </button>
            <button
              className="bm-back"
              onClick={() => {
                snapshot("Emptied the bag");
                setBag([]); setAnswers({}); setQi(0); setCustomName("");
                setCarrying(null); setView("shop"); setMode("browse");
              }}
            >
              Empty the bag
            </button>
          </div>

          <div className="bm-share">
            <div className="bm-mono" style={{ fontSize: 10.5, letterSpacing: ".1em", opacity: 0.7 }}>
              SHARE CODE — SEND IT AND COMPARE RECEIPTS
            </div>
            <input className="bm-code" readOnly value={shareCode} onFocus={(e) => e.target.select()} aria-label="Your share code" />
            <div className="bm-share-row">
              <button className="bm-back" onClick={copyCode}>Copy code</button>
            </div>
            {storeMsg && (
              <div className="bm-mono" style={{ fontSize: 11, opacity: 0.75 }}>{storeMsg}</div>
            )}
            <div className="bm-mono" style={{ fontSize: 10.5, letterSpacing: ".1em", opacity: 0.7, marginTop: 6 }}>
              GOT SOMEONE ELSE'S CODE?
            </div>
            <div className="bm-share-row">
              <input
                className="bm-code"
                value={codeIn}
                placeholder="paste it here"
                onChange={(e) => setCodeIn(e.target.value)}
                aria-label="Paste a share code"
              />
              <button className="bm-back" onClick={runCompare} disabled={!codeIn.trim()}>Compare</button>
            </div>
            {codeMsg && <div className="bm-mono" style={{ fontSize: 11, opacity: 0.75 }}>{codeMsg}</div>}
          </div>
        </div>

        {img && (
          <div className="bm-modal" onClick={() => setImg(null)}>
            <div className="bm-modal-in" onClick={(e) => e.stopPropagation()}>
              {img === "error" ? (
                <div className="bm-empty">
                  <div className="bm-mono" style={{ fontSize: 12 }}>
                    The image didn't print. Take a screenshot of the receipt instead.
                  </div>
                </div>
              ) : (
                <>
                  <img src={img} alt="Your Belief Mart receipt" />
                  <div className="bm-modal-bar">
                    <a className="bm-back" href={img} download="belief-mart-receipt.png"
                       style={{ textDecoration: "none", display: "inline-block" }}>
                      Download PNG
                    </a>
                    <button className="bm-back" onClick={() => setImg(null)}>Close</button>
                  </div>
                  <div className="bm-mono" style={{ fontSize: 11, color: "#F3F1E7", textAlign: "center", opacity: 0.8 }}>
                    On a phone, press and hold the receipt to save or share it.
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- compare ---------------- */
  if (view === "compare" && other) {
    const mine = new Set(bag);
    const theirs = new Set(other.bag);
    const shared = bag.filter((id) => theirs.has(id));
    const onlyMine = bag.filter((id) => !theirs.has(id));
    const onlyTheirs = other.bag.filter((id) => !mine.has(id));
    const union = Array.from(new Set([...bag, ...other.bag]));
    const wSum = (ids) => ids.reduce((s, id) => s + WEIGHT[id], 0);
    const overlap = union.length ? Math.round((wSum(shared) / wSum(union)) * 100) : 0;
    const theirResults = scoreFaiths(other.bag);
    const fights = TENSIONS.filter(
      ([a, b]) =>
        (mine.has(a) && theirs.has(b) && !mine.has(b) && !theirs.has(a)) ||
        (mine.has(b) && theirs.has(a) && !mine.has(a) && !theirs.has(b))
    );

    return (
      <div className="bm">
        <style>{CSS}</style>
        <div className="bm-cmp">
          <div className="bm-display" style={{ fontSize: 25, marginBottom: 4 }}>
            {overlap}% the same
          </div>
          <div className="bm-note bm-mono" style={{ marginBottom: 16 }}>
            Weighted by how rare each belief is — agreeing on something unusual counts for more.
          </div>

          <div className="bm-cmp-head">
            <div className="bm-cmp-card">
              <div className="bm-mono" style={{ fontSize: 9.5, letterSpacing: ".12em", opacity: 0.6 }}>YOURS</div>
              <div className="n">{shownName}</div>
              <div className="bm-note" style={{ marginTop: 5 }}>
                closest: {results[0].name} ({results[0].pct}%)
              </div>
            </div>
            <div className="bm-cmp-card">
              <div className="bm-mono" style={{ fontSize: 9.5, letterSpacing: ".12em", opacity: 0.6 }}>THEIRS</div>
              <div className="n">{other.name || "Unnamed"}</div>
              <div className="bm-note" style={{ marginTop: 5 }}>
                closest: {theirResults[0].name} ({theirResults[0].pct}%)
              </div>
            </div>
          </div>

          <div className="bm-cmp-sec">
            <h4>BOTH OF YOU ({shared.length})</h4>
            {shared.length === 0 ? (
              <div className="bm-note">Nothing at all. That's its own kind of achievement.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {shared
                  .slice()
                  .sort((a, b) => WEIGHT[b] - WEIGHT[a])
                  .map((id) => (
                    <li key={id}>
                      {ITEM_BY_ID[id].t}
                      {RARITY[id] === "SPECIALTY" && (
                        <span className="bm-mono" style={{ fontSize: 10, opacity: 0.6 }}> · rare</span>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {fights.length > 0 && (
            <div className="bm-cmp-sec">
              <h4>WHAT YOU'D ARGUE ABOUT ({fights.length})</h4>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {fights.slice(0, 8).map(([a, b, note]) => (
                  <li key={a + b}>{note}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="bm-cmp-sec">
            <h4>ONLY YOU ({onlyMine.length})</h4>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {onlyMine.map((id) => <li key={id}>{ITEM_BY_ID[id].t}</li>)}
            </ul>
          </div>

          <div className="bm-cmp-sec">
            <h4>ONLY THEM ({onlyTheirs.length})</h4>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {onlyTheirs.map((id) => <li key={id}>{ITEM_BY_ID[id].t}</li>)}
            </ul>
          </div>

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
            <button className="bm-back" onClick={() => setView("receipt")}>Back to my receipt</button>
            <button
              className="bm-back"
              onClick={() => {
                snapshot("Loaded their bag");
                setBag(other.bag);
                setCustomName(other.name || "");
                setCarrying(null);
                setOther(null);
                setView("shop");
                setMode("browse");
                window.scrollTo(0, 0);
              }}
            >
              Try theirs on
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- one tradition, on its own terms ---------------- */
  if (view === "faith" && faithId && FAITH_BY_ID[faithId]) {
    const f = FAITH_BY_ID[faithId];
    const cart = cartFor(f.id);
    const rejects = ALL_ITEMS.filter((i) => i.n.includes(f.id));
    const partial = ALL_ITEMS.filter((i) => i.p.includes(f.id));
    const mine = results.find((r) => r.id === f.id);
    const byAisle = AISLES.map((a) => ({ a, items: a.items.filter((i) => cart.includes(i.id)) })).filter((x) => x.items.length);

    return (
      <div className="bm">
        <style>{CSS}</style>
        <div className="bm-faith">
          <button
            className="bm-back"
            onClick={() => (faithFrom === "receipt" ? setView("receipt") : (setView("shop"), setMode("directory")))}
          >
            ← {faithFrom === "receipt" ? "Back to my receipt" : "All traditions"}
          </button>
          <h2 style={{ marginTop: 14 }}>{f.name}</h2>
          <div style={{ fontSize: 13.5, opacity: 0.75, marginTop: 4 }}>{f.line}</div>
          <div className="bm-stats">
            <span>AFFIRMS {cart.length}</span>
            <span>REJECTS {rejects.length}</span>
            <span>ASKS OF YOU {demandOf(cart)}</span>
            <span style={{ color: "var(--pine)" }}>
              ✓ {checkedFor(f.id).length} OF {cart.length + rejects.length + partial.length} CHECKED
            </span>
          </div>
          {checkedFor(f.id).length > 0 && (
            <div className="bm-panel">
              <h3>CHECKED AGAINST SOURCES ({checkedFor(f.id).length})</h3>
              {checkedFor(f.id).map((k) => (
                <div key={k} style={{ fontSize: 12.5, lineHeight: 1.45, marginBottom: 8 }}>
                  <strong>{ITEM_BY_ID[k.split(":")[0]].t}</strong> — {CHECKED[k]}
                </div>
              ))}
            </div>
          )}

          {bag.length > 0 && mine && (
            <div className="bm-panel">
              <h3>YOU AND IT — {mine.pct}%</h3>
              <div className="bm-meter"><i style={{ width: `${mine.pct}%` }} /></div>
              <div className="bm-note" style={{ marginTop: 6 }}>
                It has a position on {mine.spoken} of your {bag.length}{" "}
                {bag.length === 1 ? "pick" : "picks"}
                {mine.coverage < 0.5 && ", and nothing to say about the rest"}.
              </div>
              <div style={{ marginTop: 9, fontSize: 13 }}>
                {mine.clash.length > 0 ? (
                  <>It rejects {mine.clash.length} of your picks: {mine.clash.slice(0, 3).map((id) => ITEM_BY_ID[id].t.toLowerCase()).join("; ")}
                  {mine.clash.length > 3 && `, and ${mine.clash.length - 3} more`}.</>
                ) : (
                  <>It rejects nothing in your bag.</>
                )}
              </div>
              {mine.missing.length > 0 && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  You're missing its core: {mine.missing.map((id) => ITEM_BY_ID[id].t.toLowerCase()).join("; ")}.
                </div>
              )}
            </div>
          )}

          {f.caveat && (
            <div className="bm-panel" style={{ borderStyle: "dashed" }}>
              <h3>ABOUT THIS ENTRY</h3>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{f.caveat}</div>
            </div>
          )}

          {byAisle.map(({ a, items }) => (
            <div className="bm-panel" key={a.n}>
              <h3>AISLE {a.n} — {a.name.toUpperCase()}</h3>
              {items.map((i) => (
                <span className="bm-pill" key={i.id} data-k={bag.includes(i.id) ? "mine" : "yes"}>{i.t}{isChecked(i.id, f.id) && " ✓"}</span>
              ))}
            </div>
          ))}

          {partial.length > 0 && (
            <div className="bm-panel">
              <h3>PARTLY, OR DEPENDS WHO YOU ASK ({partial.length})</h3>
              <div className="bm-note" style={{ marginBottom: 7 }}>
                Either its schools disagree about these, or it holds part of the claim and not the rest.
              </div>
              {partial.map((i) => <span className="bm-pill" key={i.id}>{i.t}{isChecked(i.id, f.id) && " ✓"}</span>)}
            </div>
          )}

          {rejects.length > 0 && (
            <div className="bm-panel">
              <h3>IT SAYS NO TO ({rejects.length})</h3>
              {rejects.map((i) => (
                <span className="bm-pill" key={i.id} data-k="no">{i.t}{isChecked(i.id, f.id) && " ✓"}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 12 }}>
            <button className="bm-back" onClick={() => loadCart(f.id)}>Load its cart</button>
            <button className="bm-back" onClick={() => { setView("shop"); setMode("browse"); }}>Back to the shelves</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- the directory ---------------- */
  if (mode === "directory" && view === "shop") {
    const listed = bag.length ? results : FAITHS.map((f) => ({ ...f, pct: null }));
    return (
      <div className="bm">
        <style>{CSS}</style>
        <header className="bm-top">
          <div className="bm-sign">
            <h1 className="bm-display">Belief Mart</h1>
            <span className="bm-mono">22 TRADITIONS</span>
          </div>
          <div className="bm-modes">
            <button className="bm-mode" onClick={() => setMode("browse")}>Aisles</button>
            <button className="bm-mode" onClick={() => setMode("quiz")}>Questions</button>
            <button className="bm-mode" data-on="1">Traditions</button>
          </div>
        </header>
        <main className="bm-body">
          <div className="bm-note bm-mono" style={{ marginBottom: 12 }}>
            {bag.length ? "Sorted by how close each one is to your bag." : "Pick some beliefs and this list reorders itself around you."}
          </div>
          <div className="bm-panel" style={{ marginBottom: 14 }}>
            <h3>WHAT THESE TAGS ARE, AND AREN'T</h3>
            <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              Every tradition here contains schools that disagree with each other, sometimes
              more sharply than they disagree with you. Where a tradition is genuinely split,
              it's marked <em>depends who you ask</em> rather than forced to a yes or no.
              Some entries are still coarser than they should be: "animist traditions" is a
              whole family rather than one religion, Hinduism is split only two ways, and
              Catholic and Orthodox share an entry despite parting company on inherited guilt, and Daoism's philosophical and religious strands are folded together the way Daoists themselves have generally treated them.
              Treat a percentage as a conversation starter, not a verdict.
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 9, paddingTop: 9, borderTop: "1px dashed var(--line)" }}>
              These shelves take <strong>{claimCount()}</strong> explicit positions on who
              believes what. <strong>{Object.keys(CHECKED).length}</strong> of them have been
              checked against sources; a ✓ marks those on each tradition's page. The rest are
              one person's first pass, and the checked ones turned up errors at a rate that
              should tell you something about the unchecked ones.
            </div>
          </div>
          <div className="bm-dir">
            {listed.map((f) => (
              <button className="bm-dircard" key={f.id} onClick={() => openFaith(f.id)}>
                <div className="n">{f.name}</div>
                <div className="l">{f.line}</div>
                {f.caveat && (
                  <div className="bm-mono" style={{ fontSize: 9.5, letterSpacing: ".08em", marginTop: 5, color: "var(--stamp)" }}>
                    ⚑ READ THE CAVEAT
                  </div>
                )}
                {f.pct != null && <div className="bm-meter" style={{ marginTop: 8 }}><i style={{ width: `${f.pct}%` }} /></div>}
                <div className="m">
                  <span>{cartFor(f.id).length} BELIEFS · ASKS {demandOf(cartFor(f.id))}</span>
                  {f.pct != null && <span>{f.pct}%</span>}
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- questions ---------------- */
  if (mode === "quiz" && view === "shop") {
    const q = QUIZ[qi];
    const chosen = answers[qi];
    return (
      <div className="bm">
        <style>{CSS}</style>
        <header className="bm-top">
          <div className="bm-sign">
            <h1 className="bm-display">Belief Mart</h1>
            <span className="bm-mono">TEN QUESTIONS</span>
          </div>
          <div className="bm-modes">
            <button className="bm-mode" onClick={() => setMode("browse")}>Aisles</button>
            <button className="bm-mode" data-on="1">Questions</button>
            <button className="bm-mode" onClick={() => setMode("directory")}>Traditions</button>
          </div>
        </header>

        <div className="bm-quiz">
          <div className="bm-prog">
            {QUIZ.map((_, i) => <i key={i} data-on={i <= qi ? "1" : "0"} />)}
          </div>
          <h2 className="bm-q">{q.q}</h2>
          {q.a.map((opt, i) => (
            <button
              key={i}
              className="bm-opt"
              data-on={chosen === i ? "1" : "0"}
              onClick={() => answerQuiz(i)}
            >
              {opt.t}
            </button>
          ))}
          <div className="bm-quiznav">
            {qi > 0 && (
              <button className="bm-back" onClick={() => setQi(qi - 1)}>Back</button>
            )}
            <button
              className="bm-back"
              onClick={() => (qi < QUIZ.length - 1 ? setQi(qi + 1) : setView("receipt"))}
            >
              {qi < QUIZ.length - 1 ? "No strong feeling" : "Finish"}
            </button>
            <span className="bm-step bm-mono">{qi + 1} / {QUIZ.length}</span>
          </div>
          <div className="bm-note bm-mono" style={{ marginTop: 18 }}>
            Answers drop beliefs straight into your bag. You can go and edit them on
            the shelves afterwards — {bag.length} in there so far.
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- shop ---------------- */
  return (
    <div className="bm">
      <style>{CSS}</style>

      <header className="bm-top">
        <div className="bm-sign">
          <h1 className="bm-display">Belief Mart</h1>
          <span className="bm-mono">AISLES 1–10 · OPEN LATE</span>
        </div>
        <div className="bm-modes">
          <button className="bm-mode" data-on="1">Aisles</button>
          <button className="bm-mode" onClick={() => setMode("quiz")}>Questions</button>
          <button className="bm-mode" onClick={() => setMode("directory")}>Traditions</button>
        </div>
        <div className="bm-search">
          <span className="bm-searchbox">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 74 beliefs"
              aria-label="Search beliefs"
            />
            {searching && (
              <button onClick={() => setQuery("")} aria-label="Clear search">×</button>
            )}
          </span>
          <button
            className="bm-switch"
            data-on={hideClash ? "1" : "0"}
            aria-pressed={hideClash}
            onClick={() => setHideClash((v) => !v)}
          >
            {hideClash ? "CLASHES HIDDEN" : "HIDE CLASHES"}
          </button>
        </div>
        {!searching && <nav className="bm-aisles">
          {AISLES.map((a) => (
            <button
              key={a.n}
              className="bm-chip bm-mono"
              data-on={active === a.n ? "1" : "0"}
              onClick={() => goAisle(a.n)}
            >
              {a.n} · {a.name}
            </button>
          ))}
        </nav>}
      </header>

      <main className="bm-body">
        {carrying && (
          <div className="bm-banner">
            <span>
              You're carrying <strong>{FAITH_BY_ID[carrying].name}</strong>'s cart — {bag.length} beliefs
              it affirms outright. Change anything and it becomes yours.
            </span>
            <button onClick={() => setView("receipt")}>See the receipt</button>
          </div>
        )}

        {hideClash && hiddenCount > 0 && (
          <div className="bm-hidden-note bm-mono">
            <span>
              {hiddenCount} {hiddenCount === 1 ? "belief is" : "beliefs are"} off the shelves —
              they pull against what you're already carrying.
            </span>
            <button className="bm-back" style={{ marginLeft: "auto" }} onClick={() => setHideClash(false)}>
              Show all
            </button>
          </div>
        )}

        {AISLES.map((a) => {
          const shown = a.items
            .filter((it) => matchesQuery(it, query))
            .filter((it) => !hideClash || bag.includes(it.id) || !clashing[it.id]);
          if (shown.length === 0) return null;
          return (
          <section key={a.n} className="bm-aisle" data-aisle={a.n} ref={(el) => (refs.current[a.n] = el)}>
            <div className="bm-aisle-head">
              <span className="bm-aisle-num bm-mono">AISLE {a.n}</span>
              <h2 className="bm-display">{a.name}</h2>
              <span className="bm-rule" />
            </div>
            <div className="bm-grid">
              {shown.map((it) => {
                const inBag = bag.includes(it.id);
                const clash = clashing[it.id];
                return (
                  <article key={it.id} className="bm-card" data-in={inBag ? "1" : "0"}>
                    {RARITY[it.id] && <span className="bm-tag" data-k={RARITY[it.id]}>{RARITY[it.id]}</span>}
                    <h3 style={{ paddingRight: RARITY[it.id] ? 76 : 0 }}>{it.t}</h3>
                    <p>{it.s}</p>
                    {clash && !hideClash && (
                      <p className="bm-mono" style={{ fontSize: 10.5, color: "var(--stamp)", opacity: 1 }}>
                        PULLS AGAINST “{ITEM_BY_ID[clash.other].t}”
                      </p>
                    )}
                    <div className="bm-cardfoot">
                      <span className="bm-ask bm-mono">ASKS <Dots n={it.d} /></span>
                      <button
                        className="bm-add"
                        data-in={inBag ? "1" : "0"}
                        aria-pressed={inBag}
                        onClick={() => toggle(it.id)}
                      >
                        {inBag ? "In bag ✓" : "Add to bag"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
          );
        })}

        {searching && AISLES.every((a) => !a.items.some((it) => matchesQuery(it, query))) && (
          <div className="bm-empty">
            <div className="bm-display" style={{ fontSize: 17 }}>Nothing by that name</div>
            <div className="bm-note bm-mono" style={{ marginTop: 6 }}>
              We stock 74 beliefs and none of them mention “{query.trim()}”. Try a plainer word —
              death, food, prayer, god.
            </div>
          </div>
        )}

        {!loaded && <div className="bm-loading">RESTORING YOUR BAG…</div>}

        {loaded && !searching && bag.length === 0 && (
          <div className="bm-empty">
            <div className="bm-display" style={{ fontSize: 17 }}>Your bag is empty</div>
            <div className="bm-note bm-mono" style={{ marginTop: 6 }}>
              Nothing is true yet. Take anything you like — you can carry beliefs
              from nine different aisles out of here.
            </div>
          </div>
        )}
      </main>

      {bag.length > 0 && (
        <div className="bm-lean" data-l={lean.level} aria-live="polite">{lean.text}</div>
      )}

      <div className="bm-bar">
        <button className="bm-count bm-mono" onClick={() => setSheet(true)}>
          {bag.length === 0 ? "BAG EMPTY" : `${bag.length} IN BAG · ASKS OF YOU ${demand}`}
        </button>
        <button
          className="bm-checkout bm-display"
          disabled={bag.length < 3}
          onClick={tryCheckout}
        >
          {bag.length < 3 ? `Pick ${3 - bag.length} more` : "Check out"}
        </button>
      </div>

      {undo && (
        <div className="bm-toast" role="status">
          <span>{undo.label}</span>
          <button onClick={doUndo}>Undo</button>
        </div>
      )}

      {nudge && (
        <div className="bm-nudge" onClick={() => setNudge(false)}>
          <div className="bm-nudge-in" onClick={(e) => e.stopPropagation()}>
            <div className="bm-display" style={{ fontSize: 19, lineHeight: 1.05 }}>
              You skipped {untouched.length} {untouched.length === 1 ? "aisle" : "aisles"}
            </div>
            <div className="bm-note" style={{ marginTop: 7 }}>
              Nothing in your bag says anything about {untouched.slice(0, 3).map((a) => a.name.toLowerCase()).join(", ")}
              {untouched.length > 3 && `, or ${untouched.length - 3} more`}. You can check out
              regardless — a religion with nothing to say about death is a real position.
            </div>
            <div className="bm-jump">
              {untouched.map((a) => (
                <button
                  key={a.n}
                  className="bm-mini"
                  onClick={() => { setNudge(false); goAisle(a.n); }}
                >
                  Aisle {a.n}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="bm-back" onClick={() => { setNudge(false); setView("receipt"); }}>
                Check out anyway
              </button>
              <button className="bm-back" onClick={() => setNudge(false)}>Keep shopping</button>
            </div>
          </div>
        </div>
      )}

      {sheet && (
        <div className="bm-sheet" onClick={() => setSheet(false)}>
          <div className="bm-sheet-in" onClick={(e) => e.stopPropagation()}>
            <div className="bm-sheet-head">
              <strong className="bm-display" style={{ fontSize: 16 }}>Your bag</strong>
              <div style={{ display: "flex", gap: 6 }}>
                {bag.length > 0 && <button className="bm-mini" onClick={saveBuild}>Save build</button>}
                <button className="bm-back" onClick={() => setSheet(false)}>Close</button>
              </div>
            </div>
            {storeMsg && (
              <div className="bm-mono" style={{ fontSize: 11, padding: "8px 15px", opacity: 0.7 }}>{storeMsg}</div>
            )}
            {bag.length === 0 ? (
              <div style={{ padding: "22px 15px" }} className="bm-note bm-mono">
                Nothing in here yet. Add a belief from any aisle.
              </div>
            ) : (
              bag.map((id) => {
                const it = ITEM_BY_ID[id];
                return (
                  <div className="bm-bagrow" key={id}>
                    <span className="bm-mono" style={{ opacity: 0.5, fontSize: 11 }}>A{it.aisle}</span>
                    <span>{it.t}</span>
                    <button className="bm-x" aria-label={`Remove ${it.t}`} onClick={() => toggle(id)}>×</button>
                  </div>
                );
              })
            )}

            <div className="bm-saved">
              <h4>SAVED BUILDS {saved.length > 0 && `(${saved.length})`}</h4>
              {saved.length === 0 ? (
                <div className="bm-note bm-mono" style={{ padding: "0 15px 14px" }}>
                  Nothing saved yet. "Save build" keeps a copy you can come back to —
                  useful for holding what you believe now next to what you were raised in.
                </div>
              ) : (
                saved.map((b) => {
                  const r = scoreFaiths(b.bag)[0];
                  return (
                    <div className="bm-saved-row" key={b.id}>
                      <div style={{ minWidth: 0 }}>
                        <div className="nm">{b.name}</div>
                        <div className="mt">
                          {b.bag.length} BELIEFS · {r ? `${r.pct}% ${r.name.toUpperCase()}` : "—"}
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button className="bm-mini" onClick={() => loadBuild(b)}>Load</button>
                        <button className="bm-x" aria-label={`Delete ${b.name}`} onClick={() => deleteBuild(b.id)}>×</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
