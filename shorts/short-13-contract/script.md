# No Paper, No Contract? — short-13 (legal myths #1)

Fully-synthetic vertical short (1080×1920 @30, 43s). Adds `lib/legal.tsx` (IconBadge, Checklist,
ChatMessage, MythLine), the kit for the **legal-myths series**. Jurisdiction: **India**.

General legal information, not legal advice. Every claim on screen maps to a statute below.

## The fact check

- **Indian Contract Act 1872, s.10:** "All agreements are contracts if they are made by the free
  consent of parties competent to contract, for a lawful consideration and with a lawful object,
  and are not hereby expressly declared to be void." Writing is only required where another
  law demands it (s.10, last paragraph). The checklist shows exactly those five ingredients.
- **Transfer of Property Act 1882, s.54:** a sale of tangible immovable property of value
  ₹100 or upwards "can be made only by a registered instrument". That is the exception beat.
- **Twist (valid ≠ provable):** an oral contract is enforceable, but the party relying on it
  must prove its terms. A contemporaneous message is electronic evidence (now governed by the
  Bharatiya Sakshya Adhiniyam 2023, in force 1 July 2024). The VO deliberately names no
  evidence-law section numbers, so it stays correct across the IEA→BSA transition.
- The ₹50,000 bike deal is movable property (goods): no registration needed.

## Beat sheet

| # | Beat | t (s) | On screen | VO |
|---|------|-------|-----------|-----|
| 1 | HOOK | 0.0–3.4 | Frame 0 fully composed: "NO PAPER? STILL A CONTRACT", handshake badge, LEGALLY BINDING stamp. Punch-in settles 1.06→1 | This handshake is a contract. No paper needed. |
| 2 | SETUP | 3.4–13.0 | FileX badge + "Not in writing = not a contract?" (struck through on "contract") → bike, ₹50,000, handshake | Most people think if it's not in writing, it's not a contract. / You sell your bike for fifty thousand. Just a handshake. |
| 3 | QUIZ | 13.0–17.0 | PauseCard "can the buyer walk away?" | Pause. Can the buyer walk away? |
| 4 | REVEAL | 17.0–30.5 | §10 chip, five-box checklist ticking on each spoken ingredient, BINDING stamp on "binds" | Under Section ten… / Free consent. Competent parties. Lawful consideration. Lawful object. / Tick those boxes, and a spoken deal binds both sides. |
| 5 | EXCEPTION | 30.5–34.0 | Land badge + "Registered deed required — TPA §54" | The exception? Selling land needs a registered deed. |
| 6 | TWIST | 34.0–40.4 | VALID ≠ PROVABLE, a confirmation message slides in, PROOF stamp on "paper" | But valid isn't provable. One WhatsApp confirming the deal — that's your paper. |
| 7 | LOOP | 40.4–43.0 | Dissolve back into the hook; last frame == frame 0 | — |

No engagement-CTA outro. The loop is the ending.

## Production notes

- **Cues come from VO words, not hard-coded frames** (`cue()` in the composition). The
  estimated `vo.gen.ts` drives them now; once `gen_voice.py` writes real word times, every
  tick and stamp re-syncs with no edits. `scripts/stress-short13.mjs` checks that every cue
  still lands inside its scene under slow and fast voice timings.
- Captions sit at y1340, above the y1420 Shorts-UI line. All cards keep 170px clear on the
  right for the action rail.
- The chat bubble is a generic messenger look, not any app's branding.

## Seeds for the series

- Zero FIR: any police station must register it, whatever the jurisdiction.
- "Women can't be arrested after sunset": the real rule and its exception.
- "A will must be registered": it doesn't have to be.
