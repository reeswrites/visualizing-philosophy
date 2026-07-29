import { useState } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Spectral:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;450;500;600&display=swap');

.fw-root {
  --paper:  #E4E7EA;
  --panel:  #F2F4F6;
  --ink:    #131C24;
  --muted:  #64727E;
  --faint:  #97A3AD;
  --rule:   #C2CAD2;
  --stamp:  #8E2F3C;
  --stampbg:#F6EAEC;
  --void:   #DDE2E6;
  background: var(--paper);
  color: var(--ink);
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  min-height: 100%;
  padding: 28px 20px 56px;
}
.fw-wrap { max-width: 1080px; margin: 0 auto; }

.fw-eyebrow {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10.5px; letter-spacing: .18em; text-transform: uppercase;
  color: var(--stamp); font-weight: 600;
}
.fw-title {
  font-family: 'Spectral', Georgia, serif;
  font-weight: 600; font-size: clamp(30px, 6vw, 50px);
  line-height: 1.02; letter-spacing: -.02em; margin: 10px 0 0;
}
.fw-standfirst {
  font-family: 'Spectral', Georgia, serif;
  font-size: clamp(15px, 2.2vw, 18px); line-height: 1.5;
  color: var(--muted); max-width: 60ch; margin: 12px 0 0;
}
.fw-rule { height: 1px; background: var(--rule); margin: 26px 0; border: 0; }

.fw-cols { display: grid; grid-template-columns: 1fr; gap: 30px; }
@media (min-width: 900px) { .fw-cols { grid-template-columns: 1.08fr .92fr; gap: 38px; } }

.fw-lab {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--muted); font-weight: 600; margin-bottom: 12px;
}

/* propositions */
.fw-prop {
  border-top: 1px solid var(--rule);
  padding: 15px 0 16px;
  transition: opacity .18s ease;
}
.fw-prop:last-of-type { border-bottom: 1px solid var(--rule); }
.fw-prop.idle { opacity: .42; }
.fw-prophead { display: flex; align-items: baseline; gap: 11px; }
.fw-sym {
  font-family: 'IBM Plex Mono', monospace; font-weight: 600;
  font-size: 13px; color: var(--stamp); width: 14px; flex: none;
}
.fw-text {
  font-family: 'Spectral', Georgia, serif; font-size: 17px;
  line-height: 1.36; margin: 0; flex: 1;
}
.fw-knob {
  font-size: 12.5px; line-height: 1.5; color: var(--muted);
  margin: 7px 0 0 25px; max-width: 52ch;
}
.fw-knob b { color: var(--ink); font-weight: 500; }
.fw-idlenote {
  font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
  letter-spacing: .04em; color: var(--muted); margin: 7px 0 0 25px;
}
.fw-seg { display: flex; gap: 0; margin: 11px 0 0 25px; }
.fw-seg button {
  font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
  letter-spacing: .1em; text-transform: uppercase; font-weight: 500;
  padding: 6px 13px; background: transparent; cursor: pointer;
  border: 1px solid var(--rule); color: var(--muted);
  transition: background .14s ease, color .14s ease;
}
.fw-seg button + button { border-left: 0; }
.fw-seg button:hover:not(.on) { background: #E9ECEF; color: var(--ink); }
.fw-seg button.on { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.fw-seg button:focus-visible { outline: 2px solid var(--stamp); outline-offset: 2px; z-index: 1; }

/* verdict */
.fw-verdict { background: var(--panel); border: 1px solid var(--rule); padding: 20px; }
.fw-status {
  font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  letter-spacing: .16em; text-transform: uppercase; font-weight: 600;
}
.fw-name {
  font-family: 'IBM Plex Mono', monospace; font-weight: 500;
  font-size: clamp(19px, 3.4vw, 25px); line-height: 1.14;
  letter-spacing: -.015em; margin: 9px 0 0;
}
.fw-who {
  font-family: 'Spectral', Georgia, serif; font-style: italic;
  font-size: 14px; color: var(--muted); margin: 7px 0 0;
}
.fw-gloss {
  font-family: 'Spectral', Georgia, serif; font-size: 16px;
  line-height: 1.5; margin: 13px 0 0;
}
.fw-coord {
  font-family: 'IBM Plex Mono', monospace; font-size: 11px;
  color: var(--muted); margin: 15px 0 0; padding-top: 12px;
  border-top: 1px solid var(--rule); letter-spacing: .04em;
}

/* grid */
.fw-block { margin-top: 22px; }
.fw-blockhead {
  font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  letter-spacing: .14em; text-transform: uppercase; color: var(--muted);
  display: flex; justify-content: space-between; gap: 10px;
  border-bottom: 1px solid var(--rule); padding-bottom: 7px; margin-bottom: 9px;
}
.fw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
@media (min-width: 560px) { .fw-grid { grid-template-columns: repeat(4, 1fr); } }
.fw-cell {
  text-align: left; padding: 9px 9px 10px; cursor: pointer;
  border: 1px solid var(--rule); background: var(--panel);
  min-height: 74px; display: flex; flex-direction: column; gap: 5px;
  transition: transform .12s ease, box-shadow .12s ease;
}
.fw-cell:hover { transform: translateY(-1px); box-shadow: 0 2px 0 var(--rule); }
.fw-cell:focus-visible { outline: 2px solid var(--stamp); outline-offset: 1px; }
.fw-bits {
  font-family: 'IBM Plex Mono', monospace; font-size: 9.5px;
  letter-spacing: .08em; color: var(--faint);
}
.fw-cellname {
  font-family: 'IBM Plex Sans', sans-serif; font-size: 11.5px;
  line-height: 1.25; font-weight: 500;
}
.fw-cell.named { border-left: 3px solid var(--stamp); }
.fw-cell.named .fw-cellname { color: var(--stamp); }
.fw-cell.empty { background: var(--void); border-style: dashed; }
.fw-cell.empty .fw-cellname { color: var(--muted); font-weight: 400; font-style: italic; }
.fw-cell.contra {
  background: repeating-linear-gradient(-45deg, #D3D9DE 0 5px, var(--panel) 5px 10px);
}
.fw-cell.contra .fw-cellname { color: var(--muted); font-weight: 400; }
.fw-cell.here { outline: 2px solid var(--ink); outline-offset: 1px; }

.fw-legend {
  display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px;
  font-family: 'IBM Plex Mono', monospace; font-size: 10px;
  letter-spacing: .05em; color: var(--muted);
}
.fw-swatch { display: inline-block; width: 9px; height: 9px; margin-right: 5px; border: 1px solid var(--rule); }

/* residue */
.fw-residue { margin-top: 40px; border-top: 2px solid var(--ink); padding-top: 18px; }
.fw-reslist { display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 14px; }
@media (min-width: 760px) { .fw-reslist { grid-template-columns: 1fr 1fr; } }
.fw-res h4 {
  font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
  letter-spacing: .1em; text-transform: uppercase; margin: 0 0 5px; font-weight: 600;
}
.fw-res p { font-size: 13.5px; line-height: 1.55; color: var(--muted); margin: 0; }

@media (prefers-reduced-motion: reduce) { .fw-root * { transition: none !important; } }
`;

const PROPS = [
  {
    id: "D", key: "d", text: "The past plus the laws of nature fix exactly one future.",
    knob: <>The physics knob. Turning it off doesn't settle anything on its own — it only swaps which of the two arguments below is live.</>,
  },
  {
    id: "P", key: "p", text: "Acting freely requires being able to do otherwise.",
    knob: <>Frankfurt's knob. A counterfactual intervener who would have forced your hand but never had to seems to leave you responsible with no alternatives available. Turn it off and leeway stops being the currency; <b>sourcehood</b> takes over.</>,
  },
  {
    id: "C", key: "c", text: "If determinism is true, no one can do otherwise.",
    knob: <>Van Inwagen's Consequence Argument: you can't change the past or the laws, so you can't change what they entail. The classical denial reads "could have" conditionally — <b>would have, had I chosen</b>.</>,
    idleWhen: (s) => !s.d, idleNote: "Idle — antecedent false. With determinism off, this argument has nothing to bite on.",
  },
  {
    id: "L", key: "l", text: "An undetermined choice is a matter of luck, so not free either.",
    knob: <>The rollback knob: replay the moment a thousand times and the outcome scatters. Kane answers with self-forming actions; agent-causalists answer by putting the agent, not an event, at the origin.</>,
    idleWhen: (s) => s.d, idleNote: "Idle — antecedent false. With determinism on, there are no undetermined choices to be lucky about.",
  },
  {
    id: "F", key: "f", text: "At least some of us sometimes act freely.",
    knob: <>The limb almost nobody wants to cut, which is exactly why the other four get so much pressure. Cutting it is a position, not a failure.</>,
  },
];

const CELLS = {
  // determinism true — live: P, C, F
  D1P1C1F1: { kind: "contra", name: "Contradiction" },
  D1P1C1F0: { kind: "named", name: "Hard determinism", who: "d'Holbach, Priestley, Spinoza",
    gloss: "The world is fixed, freedom needs open alternatives, and determinism closes them. So there is no freedom, and no one deserves anything." },
  D1P1C0F1: { kind: "named", name: "Classical compatibilism", who: "Hobbes, Hume, Ayer, Moore",
    gloss: "“Could have done otherwise” means “would have, had I chosen otherwise.” Read that way, determinism takes nothing away. The Consequence Argument trades on two senses of “can.”" },
  D1P1C0F0: { kind: "empty", name: "Unoccupied",
    gloss: "Consistent, and nobody lives here. You demand alternatives, you think determinism leaves them intact — and you deny freedom anyway. Nothing in the cluster gives you a reason to." },
  D1P0C1F1: { kind: "named", name: "Semicompatibilism", who: "Frankfurt, Fischer & Ravizza, Watson",
    gloss: "Concede the Consequence Argument in full. Alternatives were never what mattered; what matters is that the act issued from a reasons-responsive mechanism the agent owns." },
  D1P0C1F0: { kind: "named", name: "Source skepticism", who: "Pereboom, Caruso",
    gloss: "Leeway isn't the issue and the Consequence Argument is sound — but the denial actually rests on manipulation cases, which is a proposition this map doesn't carry. The cell is occupied from outside." },
  D1P0C0F1: { kind: "named", name: "Compatibilism, overdetermined", who: "rarely staked out in print",
    gloss: "Both routes to incompatibilism refused: alternatives aren't required, and they'd survive determinism anyway. Coherent, but you've mounted two defenses where either would hold the line." },
  D1P0C0F0: { kind: "empty", name: "Unoccupied",
    gloss: "You've rejected every argument against freedom in the cluster and denied freedom regardless. Consistent, unmotivated." },

  // determinism false — live: P, L, F
  D0P1L1F1: { kind: "contra", name: "Contradiction" },
  D0P1L1F0: { kind: "named", name: "Hard incompatibilism", who: "Pereboom, Caruso, G. Strawson",
    gloss: "Indeterminism buys nothing. A choice that isn't settled by what came before isn't authored by you either — it's noise with your name on it. Freedom fails whichever way the physics falls." },
  D0P1L0F1: { kind: "named", name: "Libertarianism", who: "Kane, Chisholm, O'Connor, Ginet",
    gloss: "Alternatives are genuinely open and the luck objection is answerable — by self-forming actions, by agent causation, or by denying that undetermined ever meant uncontrolled." },
  D0P1L0F0: { kind: "empty", name: "Unoccupied",
    gloss: "Indeterminism holds, alternatives are available, luck is no threat — and still no freedom. Nothing left to deny it with." },
  D0P0L1F1: { kind: "contra", name: "Contradiction" },
  D0P0L1F0: { kind: "named", name: "Hard incompatibilism, source form", who: "Pereboom",
    gloss: "The same denial, reached without leaning on leeway at any point. Included because it shows the skeptical conclusion doesn't need the alternatives premise." },
  D0P0L0F1: { kind: "named", name: "Source compatibilism, indeterministic world", who: "Fischer",
    gloss: "The account of responsibility never depended on determinism being true, so it doesn't flinch when determinism turns out false. A quiet cell that matters: it shows the view isn't a hostage to physics." },
  D0P0L0F0: { kind: "empty", name: "Unoccupied",
    gloss: "Consistent, unmotivated." },
};

const b = (v) => (v ? 1 : 0);
const keyOf = (s) => (s.d ? `D1P${b(s.p)}C${b(s.c)}F${b(s.f)}` : `D0P${b(s.p)}L${b(s.l)}F${b(s.f)}`);

const BLOCKS = [
  { on: true, head: "If determinism is true", note: "live: P · C · F",
    keys: ["D1P1C1F1", "D1P1C1F0", "D1P1C0F1", "D1P1C0F0", "D1P0C1F1", "D1P0C1F0", "D1P0C0F1", "D1P0C0F0"] },
  { on: false, head: "If determinism is false", note: "live: P · L · F",
    keys: ["D0P1L1F1", "D0P1L1F0", "D0P1L0F1", "D0P1L0F0", "D0P0L1F1", "D0P0L1F0", "D0P0L0F1", "D0P0L0F0"] },
];

const bitsLabel = (k) =>
  k.startsWith("D1")
    ? `P${k[3]} C${k[5]} F${k[7]}`
    : `P${k[3]} L${k[5]} F${k[7]}`;

export default function FreeWillMap() {
  const [s, setS] = useState({ d: true, p: true, c: true, f: false, l: true });

  const here = keyOf(s);
  const cell = CELLS[here];
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }));

  const jumpTo = (k) => {
    const on = k.startsWith("D1");
    setS((prev) =>
      on
        ? { ...prev, d: true, p: k[3] === "1", c: k[5] === "1", f: k[7] === "1" }
        : { ...prev, d: false, p: k[3] === "1", l: k[5] === "1", f: k[7] === "1" }
    );
  };

  const statusText =
    cell.kind === "contra" ? "Jointly inconsistent"
    : cell.kind === "empty" ? "Consistent · unoccupied"
    : "Consistent · occupied";

  return (
    <div className="fw-root">
      <style>{CSS}</style>
      <div className="fw-wrap">
        <div className="fw-eyebrow">Aporetic cluster — 01</div>
        <h1 className="fw-title">Free will</h1>
        <p className="fw-standfirst">
          Five propositions, each plausible on its own, which cannot all be held at once.
          Every named position in the debate is a decision about which one to give up.
          Turn the knobs and read off where you land.
        </p>

        <hr className="fw-rule" />

        <div className="fw-cols">
          <div>
            <div className="fw-lab">The propositions</div>
            {PROPS.map((P) => {
              const idle = P.idleWhen ? P.idleWhen(s) : false;
              const val = s[P.key];
              return (
                <div key={P.id} className={`fw-prop${idle ? " idle" : ""}`}>
                  <div className="fw-prophead">
                    <span className="fw-sym">{P.id}</span>
                    <p className="fw-text">{P.text}</p>
                  </div>
                  {idle ? (
                    <div className="fw-idlenote">{P.idleNote}</div>
                  ) : (
                    <div className="fw-knob">{P.knob}</div>
                  )}
                  <div className="fw-seg" role="group" aria-label={P.text}>
                    <button
                      className={val ? "on" : ""}
                      aria-pressed={val}
                      onClick={() => set(P.key, true)}
                    >
                      Accept
                    </button>
                    <button
                      className={!val ? "on" : ""}
                      aria-pressed={!val}
                      onClick={() => set(P.key, false)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <div className="fw-lab">Where that puts you</div>
            <div className="fw-verdict">
              <div
                className="fw-status"
                style={{ color: cell.kind === "named" ? "var(--stamp)" : "var(--muted)" }}
              >
                {statusText}
              </div>
              <h2 className="fw-name">{cell.name}</h2>
              {cell.who && <p className="fw-who">{cell.who}</p>}
              <p className="fw-gloss">
                {cell.kind === "contra"
                  ? "These commitments can't be held together. Determinism plus the leeway requirement plus the argument that determinism removes leeway entails that no one acts freely — and you've also asserted that someone does. Give something up."
                  : cell.gloss}
              </p>
              <div className="fw-coord">
                {here.startsWith("D1") ? "D1" : "D0"} · {bitsLabel(here)}
                {"  —  "}
                {s.d ? "L idle" : "C idle"}
              </div>
            </div>

            <div className="fw-lab" style={{ marginTop: 30 }}>
              The space — 16 cells
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, color: "var(--muted)", margin: "0 0 4px", maxWidth: "48ch" }}>
              Five binary propositions suggest 32 positions. Half collapse, because
              each of the two middle arguments goes idle when its antecedent fails.
              Of the 16 that remain, three are contradictions and four are empty.
              Click any cell to move there.
            </p>

            {BLOCKS.map((blk) => (
              <div className="fw-block" key={blk.head}>
                <div className="fw-blockhead">
                  <span>{blk.head}</span>
                  <span>{blk.note}</span>
                </div>
                <div className="fw-grid">
                  {blk.keys.map((k) => {
                    const c = CELLS[k];
                    return (
                      <button
                        key={k}
                        className={`fw-cell ${c.kind}${k === here ? " here" : ""}`}
                        onClick={() => jumpTo(k)}
                        aria-current={k === here}
                      >
                        <span className="fw-bits">{bitsLabel(k)}</span>
                        <span className="fw-cellname">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="fw-legend">
              <span><i className="fw-swatch" style={{ background: "var(--panel)", borderLeft: "3px solid var(--stamp)" }} />Occupied</span>
              <span><i className="fw-swatch" style={{ background: "var(--void)", borderStyle: "dashed" }} />Empty</span>
              <span><i className="fw-swatch" style={{ background: "repeating-linear-gradient(-45deg,#D3D9DE 0 3px,#F2F4F6 3px 6px)" }} />Inconsistent</span>
            </div>
          </div>
        </div>

        <div className="fw-residue">
          <div className="fw-eyebrow">What this map drops</div>
          <p style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: 16, lineHeight: 1.5, margin: "10px 0 0", maxWidth: "62ch" }}>
            A compression that doesn't declare its residue is passing off a parse as a
            transcription. Here is what got lost making this fit on a screen.
          </p>
          <div className="fw-reslist">
            <div className="fw-res">
              <h4>Freedom and responsibility, collapsed</h4>
              <p>
                Proposition F runs them together. Fischer's whole point is that they
                come apart — responsibility survives determinism even if leeway freedom
                doesn't. That's what the "semi" is doing in semicompatibilism, and this
                map can't show it.
              </p>
            </div>
            <div className="fw-res">
              <h4>Sourcehood has no proposition</h4>
              <p>
                Pereboom's manipulation arguments target where an action comes from, not
                whether alternatives were open. Two cells above are occupied by views that
                strictly need a sixth premise the map doesn't carry.
              </p>
            </div>
            <div className="fw-res">
              <h4>Meta-level positions have no cells at all</h4>
              <p>
                Vargas's revisionism and Smilansky's illusionism aren't claims about these
                five propositions — they're claims about whether the concept is worth
                keeping given how the propositions fall. A cluster map has no coordinate
                for them.
              </p>
            </div>
            <div className="fw-res">
              <h4>One reading of "can", asserted not argued</h4>
              <p>
                P and C are written as though everyone means the same thing by the ability
                to do otherwise. Much of the real dispute is over that reading. Forcing a
                shared vocabulary is what let the map be drawn, and it quietly did some of
                the arguing.
              </p>
            </div>
            <div className="fw-res">
              <h4>Binary, no qualifiers</h4>
              <p>
                Accept or reject, nothing in between. No credences, no "on some readings",
                no Toulmin-style rebuttal conditions. Most working philosophers sit
                somewhere the toggles can't express.
              </p>
            </div>
            <div className="fw-res">
              <h4>Empty is doing two jobs</h4>
              <p>
                Four cells are marked unoccupied, but "unmotivated by anything in the
                cluster" and "nobody happened to go there" are different findings. The map
                shows the sparsity without diagnosing it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
