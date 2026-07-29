# Belief Mart — verification handoff

You are picking up a data-accuracy project. The app works; the data underneath it is the
problem. Your job is to check claims against sources, correct what's wrong, and record what
you found so the work accumulates instead of evaporating.

Read this whole file before touching anything. The pitfalls section will save you an hour.

---

## 1. What the thing is

`belief-mart.jsx` is a single-file React artifact: a shop where you put beliefs in a basket
and it tells you which religious tradition you most resemble. 74 beliefs across 10 aisles,
scored against 22 traditions.

The scoring is only as good as the tags underneath it, and the tags were written in one pass
by a model working from memory, without sources. That's the problem you're here to fix.

---

## 2. Files

| file | what it is |
|---|---|
| `belief-mart.jsx` | the whole app — data, scoring, UI, in that order |
| `belief-mart.test.mjs` | 127 tests, no dependencies, `node belief-mart.test.mjs` |

The app must stay a single file to render as an artifact. Don't split it.

---

## 3. The data model

### Beliefs and tags

Each belief lives in an aisle and carries three arrays of tradition ids:

```js
{ id: "dissolve", t: "You merge, and the 'you' ends", s: "The drop doesn't survive the ocean.",
  d: 2, y: ["vedanta","thera","zen","sikh"], p: ["tao","stoic"], n: ["islam","evan","jain"] }
```

- `y` — the tradition affirms it
- `p` — partial: **either** its schools genuinely disagree **or** it holds part of the claim
  and denies the rest. This bucket does two jobs; the UI says so.
- `n` — the tradition rejects it
- absent from all three — no position. **This is a claim too**, and it's where most of the
  errors have been.
- `d` — how much the belief demands of you, 1–5. Not a truth claim, don't verify it.

### Weights

`WEIGHT[id]` is derived, not authored: rarer beliefs count for more. Don't hand-edit it.
It shifts automatically when you change tags, which is fine.

### The derived tradition

`main` (Mainline Protestantism) is **not hand-tagged**. It inherits every `evan` tag except
the ones listed in `MAINLINE_OVERRIDES`. If you want to change what mainline holds, edit the
override map, not the belief arrays. If you verify a mainline claim that comes from
inheritance rather than an override, say so in the note — its checks are partly borrowed.

### The provenance registry

```js
const CHECKED = {
  "dissolve:jain": "Jain moksha rejects merger outright: the purified jiva keeps eternal
                    individuality at Siddhashila, in explicit contrast to Advaita. Moved from
                    partial to reject.",
};
```

Key is `beliefId:traditionId`. The value records **what the source said**, not that you
looked. Tests enforce a 40-character minimum precisely to stop notes like "Equity is a named
value" — that one was rejected by the suite and had to be rewritten.

### The LOGIC markers

Everything between `/* ===== LOGIC:START */` and `/* ===== LOGIC:END */` is pure JS with no
React or DOM dependency. The test file lifts that section out and imports it. **Keep new data
and scoring rules inside the markers** or the tests will silently stop covering them.

---

## 4. Where things stand

- **912** explicit claims (293 affirm, 283 partial, 328 reject) plus ~700 implicit "no position"
- **164** checked — 18%
- **37 of those 164 needed a tag changed or added — a 23% correction rate**

Coverage by tradition, worst first. Work down this list.

| id | tradition | checked | |
|---|---|---|---|
| tao | Daoism | 2/42 | 5% |
| main | Mainline Protestantism | 3/61 | 5% |
| vedanta | Advaita Vedanta | 2/34 | 6% |
| sikh | Sikhism | 3/40 | 8% |
| jud | Rabbinic Judaism | 5/56 | 9% |
| zoro | Zoroastrianism | 4/40 | 10% |
| jain | Jainism | 3/25 | 12% |
| thera | Theravada Buddhism | 7/49 | 14% |
| stoic | Stoicism | 3/20 | 15% |
| cath | Catholic & Orthodox | 10/63 | 16% |
| evan | Evangelical Protestantism | 10/62 | 16% |
| human | Secular Humanism | 10/56 | 18% |
| animist | Animist traditions | 4/22 | 18% |
| uu | Unitarian Universalism | 7/38 | 18% |
| islam | Sunni Islam | 14/65 | 22% |
| pagan | Modern Paganism & Wicca | 8/34 | 24% |
| zen | Zen & Mahayana | 9/36 | 25% |
| conf | Confucianism | 10/38 | 26% |
| bahai | Bahá'í Faith | 14/44 | 32% |
| bhakti | Devotional Hinduism | 12/36 | 33% |
| shinto | Shinto | 14/35 | 40% |
| deism | Deism | 10/16 | 63% |

---

## 5. The method that works

**Search by tradition, not by claim.** One good search on "Bahá'í obligatory prayer, fast,
no clergy, progressive revelation" resolved 13 claims. Going claim by claim averaged 2 per
search. Roughly a 3× difference, so batch by tradition and aisle.

A batch looks like:

1. Pick the least-covered tradition.
2. Search for its authoritative self-description — institutional texts, encyclopedias,
   scholarly overviews. Prefer primary sources and academic reference works over devotional
   summaries and SEO content.
3. Walk every belief that tags that tradition, plus scan for beliefs where it is **untagged
   but obviously has a position**. That second part is where the errors are.
4. Apply tag changes and registry entries in one patch.
5. Run the tests. Then sanity-check that the tradition's own cart still scores it 100%.

---

## 6. What counts as a finding

Record a `CHECKED` entry when you have actually read a source that bears on the claim —
whether or not the tag changes. A confirmation is worth recording; it stops the claim being
re-checked forever.

Do **not** record an entry when you merely feel confident. The registry's value is that
everything in it has been looked at.

---

## 7. Editing safely

Use this pattern. It has caught real mistakes.

```python
python3 - <<'PY'
p='belief-mart.jsx'
s=open(p).read()
a = 'y: ["vedanta", "thera", "zen", "sikh"], p: ["tao", "stoic", "jain"],'
b = 'y: ["vedanta", "thera", "zen", "sikh"], p: ["tao", "stoic"],'
assert s.count(a) == 1, a[:60]        # <-- the important line
s = s.replace(a, b, 1)
open(p,'w').write(s)
PY
```

**Always assert the match count.** A silent no-op replace is the failure mode here: I once
"fixed" the family map and the replacement matched nothing, so the change never happened and
nothing complained until a test caught it two steps later.

### Pitfalls that have already bitten

- **Don't include `main` in a source anchor.** Mainline tags are appended at runtime by the
  derivation loop, so they are not in the file text. Anchors containing `"main"` will fail.
- **Anchor on enough context to be unique.** Tag arrays repeat across beliefs.
- **The `p` bucket is ambiguous by design.** Before moving something to `p`, decide whether
  you mean "schools disagree" or "half the claim is true", and say which in the note.
- **Don't over-correct.** I moved Judaism's heaven-and-hell tag to a flat rejection, then had
  to walk it back to partial when Zoroastrianism turned out to have the identical structure.
  Check whether a neighbouring tradition needs the same treatment before you commit.

---

## 8. Guardrails

- **Never change a tag without a source you actually read.** An unsourced "correction" is
  just a second guess wearing a lab coat.
- **Never write to `CHECKED` from an automated pass.** If you use sub-agents (see §10), their
  output is a lead, not a finding.
- **Don't touch `d` (demand) values.** They're editorial, not factual.
- **Don't tune the scoring to make results look better.** There is a measured artefact —
  silence is unpenalised, so quiet traditions over-rank — and it is deliberately *disclosed*
  via the coverage figure rather than fixed, because the silence is partly missing tagging
  rather than genuine reticence. Don't "fix" it by adding a silence penalty; that would
  launder a data gap into a signal.
- **`caveat` fields** on traditions are for entries that are structurally compromised
  (a whole family under one name, a contested category, a merged pair). Add one when you find
  a new such case.

---

## 9. Tests

```
node belief-mart.test.mjs      # 127 tests, exits non-zero on failure
```

They cover data integrity, tension pairs, weighting, 200 fuzzed bags against seven scoring
invariants, share codes, naming, the quiz, the derived mainline entry, coverage, and
provenance. They will catch: dangling ids, duplicate tags, broken registry keys, notes that
are too thin, and any tradition whose own cart stops scoring it first.

Two you should watch specifically:

- `every tradition's own cart ranks it first` — if this breaks, a tag change has made a
  tradition inconsistent with itself.
- `checked claims match the tags they describe` — a registry entry describing a tag that no
  longer exists.

Also useful: the suite prints the running verification percentage and which traditions have
zero checks. Those lines are the project dashboard.

---

## 10. If you use sub-agents

Worth doing, with one rule: **the sub-agent must not be told what the current tag says.** If
it knows, it will agree. Give it the tradition and the belief, ask it to derive a verdict cold
from `affirms / partly / rejects / none` with a source, then compare afterwards.

And be clear about what that buys you. A model checking a model is not verification — it
shares the same training data and the same blind spots, so **agreement is nearly worthless as
evidence**. The signal is *disagreement*: a claim where an independent pass lands elsewhere is
worth a human's attention. Treat sub-agent output as a triage queue that feeds human checking,
never as something that writes to `CHECKED`.

Two agents with deliberately different prompts disagreeing with *each other* is a stronger
signal than either disagreeing with the shelf.

---

## 11. Where the errors actually are

This is the most useful thing I learned, so use it to aim.

**The error rate is not uniform. It tracks how well-documented a tradition is in English.**

- Evangelical Protestantism: 10 checks, **0** corrections.
- Catholic & Orthodox: 10 checks, **1** correction.
- Everything else averages around 25%.

The wrong tags clustered in Jain liberation, Zoroastrian eschatology, Shinto purity, bhakti
metaphysics, and Bahá'í institutions — traditions further from the centre of English-language
training data. So the 748 unchecked claims are probably *worse* than 23% wrong on average,
because the well-covered traditions are now disproportionately done.

**And the failure mode shifted over time.** Early corrections were wrong tags. Later ones were
almost all *omissions* — a position the tradition states loudly, left blank:

- Bahá'í abolishes priesthood in its book of laws. Untagged on clergy.
- Zen's founding formula is "a special transmission outside the scriptures". Untagged on scripture.
- Deism denies revealed scripture as its central move. Untagged on scripture.
- Shinto is repeatedly described as having no moral commandments. Untagged on divine command.
- Vaishnavism holds God and soul everlastingly distinct. Untagged on merging — which meant
  devotional Hinduism and Advaita were not distinguished on the question that most divides them.

So: **when you check a tradition, don't just audit its existing tags. Walk all 74 beliefs and
ask what's missing.** That is where the remaining damage is.

---

## 12. Definition of done for a batch

- [ ] Every tag change has a source you read
- [ ] Every claim examined has a `CHECKED` entry, including confirmations
- [ ] Notes say what the source states, not that you checked
- [ ] `node belief-mart.test.mjs` passes
- [ ] The tradition's own cart still scores it 100% and ranks it first
- [ ] You scanned for omissions, not just audited existing tags
