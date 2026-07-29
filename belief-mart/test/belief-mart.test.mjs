/**
 * Tests for the Belief Mart logic layer.
 *
 *   npm test
 *
 * The artifact has to stay a single self-contained .jsx to render, so the
 * scoring logic can't live in its own importable module. Instead it's fenced
 * off inside src/BeliefMart.jsx between LOGIC:START and LOGIC:END markers, and
 * this file lifts that section out and imports it. If someone moves scoring
 * code outside the markers, the extraction check below fails loudly rather
 * than silently testing less than it claims to.
 *
 * NOT covered here: React rendering, the canvas receipt, clipboard, scroll
 * behaviour. Those need a browser runner (vitest + jsdom, or Playwright).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/* ---------- tiny harness ---------- */
let pass = 0, fail = 0, group = "";
const g = (name) => { group = name; console.log(`\n${name}`); };
const ok = (cond, msg, detail) => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); }
  else { fail++; console.log(`  \x1b[31m✗\x1b[0m ${msg}${detail ? `\n      ${detail}` : ""}`); }
};
const eq = (a, b, msg) => ok(a === b, msg, `expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
const near = (a, lo, hi, msg) => ok(a >= lo && a <= hi, msg, `${a} outside [${lo}, ${hi}]`);

/* ---------- load the logic section ---------- */
const SRC = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "src", "BeliefMart.jsx");
const raw = fs.readFileSync(SRC, "utf8");
const start = raw.indexOf("/* ===== LOGIC:START");
const end = raw.indexOf("/* ===== LOGIC:END");
if (start < 0 || end < 0) {
  console.error("Could not find LOGIC:START / LOGIC:END markers in src/BeliefMart.jsx");
  process.exit(1);
}
const EXPORTS = [
  "FAITHS", "FAITH_BY_ID", "AISLES", "ALL_ITEMS", "ITEM_BY_ID", "ITEM_INDEX",
  "WEIGHT", "RARITY", "TENSIONS", "QUIZ", "scoreFaiths", "findTensions",
  "clashFor", "specificity", "cartFor", "buildName", "nameVariants",
  "encodeBag", "decodeBag", "FAMILY", "leaning", "matchesQuery",
  "untouchedAisles", "demandOf", "MAINLINE_OVERRIDES", "CHECKED", "checkedFor", "isChecked", "claimCount",
];
const section = raw.slice(start, end);
const tmp = path.join(os.tmpdir(), `belief-logic-${Date.now()}.mjs`);
fs.writeFileSync(tmp, `${section}\nexport { ${EXPORTS.join(", ")} };\n`);
const L = await import(`file://${tmp}`);
fs.unlinkSync(tmp);

const {
  FAITHS, FAITH_BY_ID, AISLES, ALL_ITEMS, ITEM_BY_ID, WEIGHT, RARITY, TENSIONS, QUIZ,
  scoreFaiths, findTensions, clashFor, specificity, cartFor, buildName,
  encodeBag, decodeBag, FAMILY, leaning, matchesQuery, untouchedAisles, demandOf,
  MAINLINE_OVERRIDES, CHECKED, checkedFor, isChecked, claimCount,
} = L;

const FIDS = new Set(FAITHS.map((f) => f.id));
const IIDS = new Set(ALL_ITEMS.map((i) => i.id));

/* deterministic PRNG so failures reproduce */
let seed = 20260729;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const sample = (arr, n) => [...arr].sort(() => rnd() - 0.5).slice(0, n);

/* ---------- 1. structural integrity ---------- */
g("Data integrity");
eq(ALL_ITEMS.length, IIDS.size, "no duplicate belief ids");
eq(FAITHS.length, FIDS.size, "no duplicate tradition ids");
ok(ALL_ITEMS.every((i) => i.t && i.s), "every belief has a title and a blurb");
ok(ALL_ITEMS.every((i) => Number.isInteger(i.d) && i.d >= 1 && i.d <= 5), "demand ratings are 1–5");
ok(
  ALL_ITEMS.every((i) => Array.isArray(i.y) && Array.isArray(i.p) && Array.isArray(i.n)),
  "every belief has y/p/n arrays"
);
{
  const bad = ALL_ITEMS.flatMap((i) => [...i.y, ...i.p, ...i.n].filter((t) => !FIDS.has(t)).map((t) => `${i.id}:${t}`));
  ok(bad.length === 0, "every tradition tag refers to a real tradition", bad.join(", "));
}
{
  const bad = ALL_ITEMS.filter((i) => {
    const seen = new Set();
    return [...i.y, ...i.p, ...i.n].some((t) => (seen.has(t) ? true : (seen.add(t), false)));
  }).map((i) => i.id);
  ok(bad.length === 0, "no tradition is tagged twice on one belief", bad.join(", "));
}
{
  const bad = FAITHS.flatMap((f) => f.core.filter((c) => !IIDS.has(c)).map((c) => `${f.id}:${c}`));
  ok(bad.length === 0, "every core belief id exists", bad.join(", "));
}
ok(AISLES.every((a) => a.items.length >= 4), "every aisle has at least 4 beliefs");
eq(new Set(AISLES.map((a) => a.n)).size, AISLES.length, "aisle numbers are unique");

g("Tension pairs");
{
  const bad = TENSIONS.filter(([a, b]) => !IIDS.has(a) || !IIDS.has(b)).map(([a, b]) => `${a}/${b}`);
  ok(bad.length === 0, "every tension refers to real beliefs", bad.join(", "));
}
ok(TENSIONS.every(([a, b]) => a !== b), "no belief conflicts with itself");
ok(TENSIONS.every(([, , note]) => typeof note === "string" && note.length > 8), "every tension has a written note");
{
  const seen = new Set();
  const dupes = TENSIONS.filter(([a, b]) => {
    const k = [a, b].sort().join("|");
    return seen.has(k) ? true : (seen.add(k), false);
  }).map(([a, b]) => `${a}/${b}`);
  ok(dupes.length === 0, "no duplicate tension pairs", dupes.join(", "));
}
ok(findTensions([]).length === 0, "empty bag has no tensions");
{
  const [a, b] = TENSIONS[0];
  eq(findTensions([a, b]).length, 1, "a known clashing pair is detected");
  eq(findTensions([b, a]).length, 1, "detection is order-independent");
  eq(findTensions([a]).length, 0, "half a pair is not a tension");
  eq(clashFor(b, [a])?.other, a, "clashFor points back at the offending belief");
  eq(clashFor(b, []), null, "clashFor is null against an empty bag");
}

/* ---------- 2. weighting ---------- */
g("Rarity weighting");
ok(ALL_ITEMS.every((i) => WEIGHT[i.id] >= 0.5 && WEIGHT[i.id] <= 2.4), "all weights sit inside the clamp");
{
  const support = (i) => i.y.length + i.p.length * 0.5;
  const sorted = [...ALL_ITEMS].sort((a, b) => support(a) - support(b));
  ok(WEIGHT[sorted[0].id] > WEIGHT[sorted[sorted.length - 1].id], "rarer beliefs outweigh common ones");
}
{
  const spec = ALL_ITEMS.filter((i) => RARITY[i.id] === "SPECIALTY").length;
  const common = ALL_ITEMS.filter((i) => RARITY[i.id] === "COMMON STOCK").length;
  near(spec, 8, 35, `specialty count is a useful minority (${spec})`);
  near(common, 3, 20, `common-stock count is a useful minority (${common})`);
  ok(spec + common < ALL_ITEMS.length * 0.6, "most beliefs carry no sticker");
}

/* ---------- 3. scoring ---------- */
g("Scoring");
{
  const r = scoreFaiths([]);
  eq(r.length, FAITHS.length, "empty bag still returns every tradition");
  ok(r.every((x) => x.pct === 0), "empty bag scores zero everywhere");
}
{
  let misses = [];
  FAITHS.forEach((f) => {
    const r = scoreFaiths(cartFor(f.id));
    if (r[0].id !== f.id) misses.push(`${f.id}→${r[0].id}`);
  });
  ok(misses.length === 0, "loading a tradition's own cart ranks it first", misses.join(", "));
}
{
  const offs = FAITHS.map((f) => scoreFaiths(cartFor(f.id))[0].pct).filter((p) => p !== 100);
  ok(offs.length === 0, "a tradition's own cart scores it 100%", `got ${offs.join(", ")}`);
}
ok(FAITHS.every((f) => cartFor(f.id).length >= 5), "every tradition's cart has at least 5 beliefs");
ok(FAITHS.every((f) => cartFor(f.id).every((id) => IIDS.has(id))), "carts only contain real beliefs");
{
  let bad = [];
  for (let n = 0; n < 200; n++) {
    const bag = sample(ALL_ITEMS.map((i) => i.id), 1 + Math.floor(rnd() * 25));
    const r = scoreFaiths(bag);
    if (r.some((x) => x.pct < 0 || x.pct > 100)) bad.push("range");
    if (r.some((x) => x.agree.some((a) => x.clash.includes(a)))) bad.push("agree/clash overlap");
    if (r.some((x) => [...x.agree, ...x.clash].some((id) => !bag.includes(id)))) bad.push("phantom belief");
    if (r.some((x) => x.narrowed.some((id) => !x.agree.includes(id)))) bad.push("narrowed outside agree");
    if (r.some((x) => x.narrowed.some((id) => WEIGHT[id] < 1.4))) bad.push("narrowed too common");
    if (r.some((x) => x.missing.some((id) => bag.includes(id)))) bad.push("missing item is in bag");
    if (r.slice(1).some((x, i) => x.raw > r[i].raw)) bad.push("not sorted");
  }
  ok(bad.length === 0, "200 random bags hold every scoring invariant", [...new Set(bad)].join(", "));
}
{
  const bag = ["rebirth", "meditation-path", "craving"];
  const a = scoreFaiths(bag).map((r) => r.id).join();
  const b = scoreFaiths([...bag].reverse()).map((r) => r.id).join();
  eq(a, b, "scoring does not depend on pick order");
}
{
  const r = scoreFaiths(["ahimsa"]);
  eq(r[0].id, "jain", "a single distinctive belief points somewhere sensible");
}

g("Specificity");
eq(specificity([]).label, "NONE", "empty bag reports no specificity");
{
  const rare = ALL_ITEMS.filter((i) => WEIGHT[i.id] >= 2).slice(0, 6).map((i) => i.id);
  const common = ALL_ITEMS.filter((i) => WEIGHT[i.id] <= 1.25).slice(0, 6).map((i) => i.id);
  eq(specificity(rare).label, "HIGH", "a bag of rare beliefs reads HIGH");
  eq(specificity(common).label, "LOW", "a bag of common beliefs reads LOW");
  ok(specificity(rare).avg > specificity(common).avg, "average weight tracks the label");
  ok(specificity(common).note.length > 20, "the LOW verdict explains itself");
}

/* ---------- 4. share codes ---------- */
g("Share codes");
{
  let bad = 0;
  for (let n = 0; n < 300; n++) {
    const bag = sample(ALL_ITEMS.map((i) => i.id), Math.floor(rnd() * ALL_ITEMS.length));
    const back = decodeBag(encodeBag(bag, "x"));
    const same = bag.length === 0
      ? back === null
      : JSON.stringify([...bag].sort()) === JSON.stringify([...back.bag].sort());
    if (!same) bad++;
  }
  eq(bad, 0, "300 random bags survive an encode/decode round trip");
}
{
  const all = ALL_ITEMS.map((i) => i.id);
  const code = encodeBag(all, "The Everything");
  eq(decodeBag(code).bag.length, all.length, "a full cart round trips");
  ok(code.length < 80, `codes stay short even when full (${code.length} chars)`);
}
eq(decodeBag(encodeBag(["ahimsa"], "Église of the Ø")).name, "Église of the Ø", "non-ASCII names survive");
{
  const junk = ["", "   ", "%%%not a code", "ab", "!!!!", "~~~", "null", "AAAA~", "<script>"];
  const leaks = junk.filter((j) => decodeBag(j) !== null);
  ok(leaks.length === 0, "malformed codes return null instead of throwing", leaks.join(" | "));
}
ok(decodeBag(encodeBag(["ahimsa"])).name === null, "a code without a name decodes cleanly");
{
  const code = encodeBag(["ahimsa", "rebirth"], "A");
  eq(JSON.stringify(decodeBag(code)), JSON.stringify(decodeBag(` ${code} `)), "surrounding whitespace is tolerated");
}

/* ---------- 5. naming ---------- */
g("Naming");
ok(buildName([], 0).length > 0, "an empty bag still gets a name");
{
  const bag = cartFor("jud");
  eq(buildName(bag, 0), buildName(bag, 0), "names are deterministic");
  const names = new Set([0, 1, 2, 3, 4].map((i) => buildName(bag, i)));
  ok(names.size > 1, `rerolling produces alternatives (${names.size} of 5 distinct)`);
  ok([...names].every((n) => n.length < 46), "names stay short enough to print");
}
{
  const bad = FAITHS.map((f) => buildName(cartFor(f.id), 0)).filter((n) => /undefined|NaN/.test(n));
  ok(bad.length === 0, "no tradition's cart produces a broken name", bad.join(", "));
}

/* ---------- 6. quiz ---------- */
g("Quiz");
ok(QUIZ.length >= 5, "there are enough questions to be worth it");
ok(QUIZ.every((q) => q.a.length >= 2), "every question offers a real choice");
{
  const bad = QUIZ.flatMap((q, qi) => q.a.flatMap((a) => a.g.filter((id) => !IIDS.has(id)).map((id) => `q${qi + 1}:${id}`)));
  ok(bad.length === 0, "every answer maps to a real belief", bad.join(", "));
}
ok(QUIZ.every((q) => q.a.every((a) => a.g.length >= 1)), "no answer is a dead end");
{
  const reach = new Set(QUIZ.flatMap((q) => q.a.flatMap((a) => a.g)));
  ok(reach.size >= 30, `the quiz can reach a decent slice of the shelves (${reach.size}/${ALL_ITEMS.length})`);
}
{
  /* every path through the quiz should produce a scoreable bag */
  let bad = [];
  for (let n = 0; n < 120; n++) {
    const bag = [...new Set(QUIZ.flatMap((q) => q.a[Math.floor(rnd() * q.a.length)].g))];
    const r = scoreFaiths(bag);
    if (!r[0] || Number.isNaN(r[0].pct)) bad.push(n);
  }
  ok(bad.length === 0, "120 random quiz run-throughs all produce a valid receipt");
}

/* ---------- 6b. the derived tradition ---------- */
g("Mainline Protestantism (derived from evangelical tags)");
{
  const keys = Object.keys(MAINLINE_OVERRIDES);
  const bogus = keys.filter((k) => !IIDS.has(k));
  ok(bogus.length === 0, "every override key names a real belief", bogus.join(", "));
  ok(
    Object.values(MAINLINE_OVERRIDES).every((v) => ["y", "p", "n", null].includes(v)),
    "every override is a legal position"
  );
  const e = new Set(cartFor("evan"));
  const m = new Set(cartFor("main"));
  ok(e.size > 5 && m.size > 5, "both Protestantisms have a real cart");
  const diff = [...new Set([...e, ...m])].filter((id) => e.has(id) !== m.has(id));
  ok(diff.length >= 6, `the two differ on enough to be worth splitting (${diff.length} beliefs)`);
  ok(m.has("many-roads") && !e.has("many-roads"), "only mainline affirms many roads to eternal life");
  ok(e.has("outsiders-lost") && !m.has("outsiders-lost"), "only evangelicalism affirms that outsiders are lost");
  eq(scoreFaiths(cartFor("main"))[0].id, "main", "the mainline cart ranks mainline first");
  eq(scoreFaiths(cartFor("evan"))[0].id, "evan", "the evangelical cart ranks evangelical first");
  const cross = scoreFaiths(cartFor("main")).find((r) => r.id === "evan").pct;
  ok(cross < 90, `they don't collapse back into each other (evangelical scores ${cross}% on the mainline cart)`);
  const dupes = ALL_ITEMS.filter((i) => [...i.y, ...i.p, ...i.n].filter((t) => t === "main").length > 1);
  ok(dupes.length === 0, "the derivation never tags mainline twice", dupes.map((i) => i.id).join(", "));
  const untagged = ALL_ITEMS.filter((i) => ![...i.y, ...i.p, ...i.n].includes("main") && [...i.y, ...i.p, ...i.n].includes("evan"));
  const expected = untagged.filter((i) => MAINLINE_OVERRIDES[i.id] !== null);
  ok(expected.length === 0, "mainline only goes silent where an override says so", expected.map((i) => i.id).join(", "));
}

g("Provenance");
{
  const keys = Object.keys(CHECKED);
  const badItem = keys.filter((k) => !IIDS.has(k.split(":")[0]));
  const badFaith = keys.filter((k) => !FIDS.has(k.split(":")[1]));
  ok(badItem.length === 0, "every checked claim names a real belief", badItem.join(", "));
  ok(badFaith.length === 0, "every checked claim names a real tradition", badFaith.join(", "));
  ok(keys.every((k) => k.split(":").length === 2), "every key is belief:tradition");
  ok(keys.every((k) => CHECKED[k].length > 40), "every note records what was found, not just that it was");
  ok(new Set(keys).size === keys.length, "no duplicate entries");
  /* a claim is only 'checked' if the tradition actually takes a position there,
     or the check concluded it should take none */
  const orphaned = keys.filter((k) => {
    const [item, faith] = k.split(":");
    const i = ITEM_BY_ID[item];
    const tagged = [...i.y, ...i.p, ...i.n].includes(faith);
    return !tagged && !/removed|no position|silent/i.test(CHECKED[k]);
  });
  ok(orphaned.length === 0, "checked claims match the tags they describe", orphaned.join(", "));
  eq(checkedFor("jain").length, keys.filter((k) => k.endsWith(":jain")).length, "checkedFor filters by tradition");
  ok(isChecked("dissolve", "jain"), "a known checked claim reports as checked");
  ok(!isChecked("dissolve", "cath"), "an unchecked claim reports as unchecked");
  ok(claimCount() > 800, `the shelves take ${claimCount()} explicit positions`);
  ok(true, `verified ${keys.length} of ${claimCount()} (${Math.round((100 * keys.length) / claimCount())}%) — the rest is a first pass`);
  {
    const perFaith = FAITHS.map((f) => ({ id: f.id, n: checkedFor(f.id).length })).sort((a, b) => a.n - b.n);
    ok(true, `unchecked traditions: ${perFaith.filter((x) => x.n === 0).map((x) => x.id).join(", ") || "none"}`);
  }
}

g("Coverage");
{
  const bag = ["ahimsa", "rebirth", "food-rules", "monastics", "fasting", "deeds"];
  const r = scoreFaiths(bag);
  ok(r.every((x) => x.coverage >= 0 && x.coverage <= 1), "coverage is a fraction");
  ok(r.every((x) => x.spoken <= bag.length), "a tradition can't speak to more picks than exist");
  ok(r.every((x) => (x.spoken === 0) === (x.coverage === 0)), "spoken and coverage agree about silence");
  eq(scoreFaiths(cartFor("jain")).find((x) => x.id === "jain").coverage, 1, "a tradition covers its own cart entirely");
  {
    const quiet = scoreFaiths(cartFor("islam")).find((x) => x.id === "deism");
    ok(quiet.coverage < 0.6, `the quietest entry is visibly quiet on someone else's cart (${Math.round(quiet.coverage * 100)}%)`);
  }
  /* the artefact this exists to expose: silence is not penalised, so a thin
     tradition can rank well without agreeing with much */
  {
    let seedy = 11;
    const rr = () => ((seedy = (seedy * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    let quietWins = 0;
    for (let i = 0; i < 400; i++) {
      const b = [...ALL_ITEMS].sort(() => rr() - 0.5).slice(0, 4 + Math.floor(rr() * 12)).map((x) => x.id);
      const top = scoreFaiths(b)[0];
      if (top.coverage < 0.5) quietWins++;
    }
    ok(true, `top match is silent on most of the bag in ${Math.round((100 * quietWins) / 400)}% of random bags — which is why coverage is shown`);
  }
}

g("Caveats");
{
  const withC = FAITHS.filter((f) => f.caveat);
  ok(withC.length >= 5, `the known-compromise entries carry a caveat (${withC.length} of ${FAITHS.length})`);
  ok(withC.every((f) => typeof f.caveat === "string" && f.caveat.length > 60), "every caveat actually says something");
  ["animist", "tao", "cath", "evan", "main", "stoic"].forEach((id) =>
    ok(!!FAITH_BY_ID[id].caveat, `${id} carries a caveat`)
  );
  ok(withC.every((f) => !/\bTODO\b|\bTBD\b/.test(f.caveat)), "no placeholder caveats shipped");
}

/* ---------- 7. shelf helpers ---------- */
g("Live leaning readout");
{
  const missing = FAITHS.filter((f) => !FAMILY[f.id]).map((f) => f.id);
  ok(missing.length === 0, "every tradition belongs to a family", missing.join(", "));
}
{
  const tiny = ["ahimsa", "rebirth"];
  eq(leaning(tiny, scoreFaiths(tiny)).level, "none", "two picks is too few to read");
  eq(leaning([], scoreFaiths([])).level, "none", "an empty bag reads as nothing");
  const mid = cartFor("jain").slice(0, 5);
  eq(leaning(mid, scoreFaiths(mid)).level, "vague", "five picks only hints at a family");
  const big = cartFor("jain").slice(0, 10);
  eq(leaning(big, scoreFaiths(big)).level, "named", "ten picks earns a named match");
  ok(leaning(big, scoreFaiths(big)).text.includes("Jainism"), "the named readout says who");
  ok(
    [...Array(12)].every((_, i) => {
      const bag = sample(ALL_ITEMS.map((x) => x.id), i + 1);
      const t = leaning(bag, scoreFaiths(bag)).text;
      return typeof t === "string" && t.length > 0 && !/undefined|NaN/.test(t);
    }),
    "the readout is never broken at any bag size"
  );
}

g("Search");
{
  const found = ALL_ITEMS.filter((i) => matchesQuery(i, "death"));
  ok(found.length > 0, `plain words find beliefs (${found.length} for "death")`);
  eq(ALL_ITEMS.filter((i) => matchesQuery(i, "")).length, ALL_ITEMS.length, "an empty query hides nothing");
  eq(ALL_ITEMS.filter((i) => matchesQuery(i, "   ")).length, ALL_ITEMS.length, "whitespace hides nothing");
  ok(matchesQuery(ITEM_BY_ID["ahimsa"], "HARM"), "search ignores case");
  ok(matchesQuery(ITEM_BY_ID["ahimsa"], "insect"), "search reaches into the blurb");
  eq(ALL_ITEMS.filter((i) => matchesQuery(i, "zzzzz")).length, 0, "nonsense finds nothing");
  /* the words a real person would actually type */
  const REAL = [
    "god", "death", "money", "prayer", "food", "sin", "reincarnation", "heaven",
    "meditation", "karma", "kosher", "science", "women", "marriage", "hell",
    "nature", "family", "charity", "animals", "atheism", "ritual", "soul",
    "suffering", "music", "priest", "fasting", "justice", "tolerance",
  ];
  const dead = REAL.filter((q) => !ALL_ITEMS.some((i) => matchesQuery(i, q)));
  ok(dead.length === 0, `all ${REAL.length} everyday search words return something`, `nothing for: ${dead.join(", ")}`);
  ok(ALL_ITEMS.filter((i) => matchesQuery(i, "death")).length >= 5, "a broad word returns a broad set");
  ok(ALL_ITEMS.filter((i) => matchesQuery(i, "kosher")).length <= 3, "a precise word stays precise");
  ok(matchesQuery(ITEM_BY_ID["obligation-poor"], "money"), "concept words reach the right shelf");
  ok(matchesQuery(ITEM_BY_ID["rebirth"], "reincarnation"), "the word people know beats our phrasing");
  ok(ALL_ITEMS.filter((i) => matchesQuery(i, "food rules")).length >= 1, "multi-word queries work");
  ok(ALL_ITEMS.filter((i) => matchesQuery(i, "kosher zzz")).length === 0, "every word must match");
  {
    const noKeys = ALL_ITEMS.filter((i) => !matchesQuery(i, i.t.split(" ")[0]));
    ok(noKeys.length === 0, "every belief is findable by its own first word");
  }
}

g("Skipped-aisle nudge");
eq(untouchedAisles([]).length, AISLES.length, "an empty bag has skipped every aisle");
eq(untouchedAisles(ALL_ITEMS.map((i) => i.id)).length, 0, "a full bag has skipped none");
{
  const one = AISLES[0].items[0].id;
  const out = untouchedAisles([one]);
  ok(!out.some((a) => a.n === AISLES[0].n), "an aisle you've picked from is not flagged");
  eq(out.length, AISLES.length - 1, "every other aisle is still flagged");
}
{
  const thin = FAITHS.map((f) => ({ id: f.id, skipped: untouchedAisles(cartFor(f.id)).length }))
    .filter((x) => x.skipped > 0);
  ok(true, `traditions that skip an aisle entirely: ${thin.map((t) => `${t.id}(${t.skipped})`).join(", ") || "none"}`);
}

g("Demand totals");
eq(demandOf([]), 0, "an empty bag asks nothing of you");
eq(demandOf(["ahimsa"]), ITEM_BY_ID["ahimsa"].d, "one belief costs its own rating");
ok(demandOf(["ahimsa", "fasting"]) === ITEM_BY_ID["ahimsa"].d + ITEM_BY_ID["fasting"].d, "demand adds up");
eq(demandOf(["not-a-real-id"]), 0, "unknown ids cost nothing rather than crashing");
{
  const totals = FAITHS.map((f) => demandOf(cartFor(f.id)));
  ok(totals.every((t) => t > 0), "every tradition asks something of you");
  ok(Math.max(...totals) > Math.min(...totals) * 1.5, "traditions differ meaningfully in what they demand");
}

/* ---------- summary ---------- */
console.log(`\n${fail === 0 ? "\x1b[32m" : "\x1b[31m"}${pass} passed, ${fail} failed\x1b[0m\n`);
process.exit(fail === 0 ? 0 : 1);
