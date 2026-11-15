# Next sprint: coaching & curriculum roadmap

Reviewed on 2026-11-15 as a BJJ coach. The coaching copy across all 25 starter concepts, 8 positions, and 37 techniques has been deepened with biomechanical cues, ordered position priorities, and solo/partner drills (and propagated to existing libraries via Dexie version 9). Below are the next three coaching initiatives, in priority order.

Sizes: **S** is an hour or two, **M** is a day, **L** is several days.

## 1. Expand white-to-blue-belt starter curriculum (M) — Done 2026-11-15

Done 2026-11-15: 28 concepts and 57 techniques. Videos were chosen from their titles and descriptions and checked to exist and be embeddable; nobody watched them or read transcripts. Three things differ from the list below: the half guard sweep is the scissor version only; the side control kimura is taught through north-south; and the turtle sit-out ends on top of their turtle (`turtle`, `top`), not in side control. The sit-out video is a short clip from a small channel and is the weakest of the set.

Every new starter concept and technique below connects to the existing 8 starter positions so existing libraries are offered them automatically on the Concepts and Blue belt pages (`core/starter.ts`).

- [x] **New starter concepts (3)**, each with an inline SVG pose scene in `ui/graphics/ConceptSvg.tsx`, position links in `core/seed.ts`, and at least two verified YouTube bookmarks:
  - **`breakfalls` — Breakfalls (ukemi):** Tucking the chin, slapping the mat at 45° to spread impact across the back/lat, and never posting a straight arm on the floor during a takedown or sweep. Linked to `standing`.
  - **`crossface` — Crossface and shoulder-line control:** Driving your shoulder under their jaw to turn their head away so their spine cannot bridge or turn toward you. Linked to `half-guard`, `side-control`, and `mount`.
  - **`wedges` — Wedges vs. levers:** Blocking a hip or shoulder close to the torso (a wedge) to stop movement, vs. controlling the end of a limb (the knee, ankle, or wrist lever) to rotate or open it. Linked to `open-guard`, `half-guard`, `side-control`, and `back-control`.
- [x] **New starter techniques across existing positions (10)**, each with `role`, `endRole`, ordered biomechanical steps, common mistakes, a drill, and verified YouTube bookmarks:
  - **Closed Guard:**
    - `cross-collar-guard` — Cross collar choke from closed guard (`submission`, `bottom`).
    - `omoplata-guard` — Omoplata shoulder lock / sweep from closed guard (`submission`, `bottom`).
  - **Half Guard:**
    - `knee-shield-sweep` — Knee shield (scissor/push) sweep from half guard (`sweep`, `bottom` → `side-control` `top`).
    - `half-guard-to-mount` — Pass half guard directly to mount by flattening shoulders and walking the trapped foot up (`pass`, `top` → `mount` `top`).
  - **Side Control:**
    - `kimura-side-control` — Kimura from top side control / north-south step-over (`submission`, `top`).
    - `side-control-to-back` — Gift-wrap from side control to back control when they turn onto their side (`transition`, `top` → `back-control` `top`).
  - **Mount:**
    - `americana-mount` — Americana from mount (`submission`, `top`).
    - `ezekiel-mount` — Ezekiel choke from mount (`submission`, `top`).
  - **Back Control:**
    - `sliding-collar-choke` — Sliding lapel / bow-and-arrow choke from back control (`submission`, `top`).
  - **Turtle:**
    - `turtle-sit-out` — Sit-out and turn-in reversal from bottom turtle (`escape`, `bottom` → `side-control` `top`).

## 2. Connect techniques in the UI: counters, defences, and follow-up chains (M) — Done 2026-11-15

Done 2026-11-15 as a pure lookup by starter id (`core/chains.ts`), with no new stored fields, so a technique the user added has no links. `TechniqueLinks` shows them on the technique page and on the review answer.

In live rolling, techniques do not exist in isolation: every attack has a primary defence, and every defensive reaction opens a follow-up attack.

- [x] **Pair attacks with their defences in `core/`:**
  - Add a pure lookup or optional model fields (`counters?: string[]`, `chainsWith?: { id: string; when: string }[]`) with defaults from starter pairings in `core/seed.ts`.
  - Starter attack ↔ defence pairs:
    - `armbar-guard` ↔ `armbar-defence`
    - `triangle-choke` ↔ `triangle-defence`
    - `guillotine-guard` ↔ `guillotine-defence`
    - `kimura-guard` ↔ `kimura-defence`
    - `americana` ↔ `americana-defence`
    - `rear-naked-choke` ↔ `rear-naked-choke-defence`
    - `double-leg` / `single-leg` ↔ `sprawl`
- [x] **Show reaction-based follow-up chains on `TransitionDetail` and review answers:**
  - Closed guard posture dilemma: `hip-bump-sweep` ("when they sit back") ↔ `kimura-guard` ("when they post a hand to stop the bump") ↔ `guillotine-guard` ("when they pull the arm back with head low").
  - Closed guard angle dilemma: `armbar-guard` ↔ `triangle-choke` ("when they yank one arm free") ↔ `pendulum-sweep` ("when they stack into you").
  - Mount escape dilemma: `upa-escape` ("when they reach for your collar or post close") ↔ `elbow-knee-escape` ("when they base wide to stop the bridge").
  - Side control escape dilemma: `side-control-escape` ("when space opens at the hip") ↔ `side-control-escape-knees` ("when they block your bottom knee").

## 3. Structured class-sized lessons (L) — Done 2026-11-15

Done 2026-11-15: `core/lessons.ts`, a Lessons page behind Learn, the current lesson on Today, and `?lesson=` on Review. New cards now arrive lesson by lesson (`lessonOrder`), then by the survive-first rule for anything outside the lessons. Lessons 6, 7 and 8 also carry the newer concepts (wedges, crossface, breakfalls); lesson 4 is titled "Attacking from the closed guard". The ten techniques added in item 1 were then placed: two each into lessons 4, 7 and the last, and four into a ninth lesson, "Attacking from the pins", which sits eighth and takes `position-before-submission` from the last lesson.

Give beginners a guided, week-by-week curriculum that groups concepts, a position, and 2–3 connected techniques into a single class-sized lesson.

- [x] **Pure lesson definitions in `core/lessons.ts` (with unit tests):**
  - Each `Lesson` names a title, summary, 1–2 `conceptIds`, 1 `positionId`, 2–4 `transitionIds`, and a 15-minute partner practice script combining their drills.
  - Suggested 8-lesson foundation track:
    1. *Surviving Underneath* (`safety`, `breathing`, `frames`, `elbows-in` · `side-control` · `side-control-escape`, `americana-defence`)
    2. *Escaping the Mount* (`bridge`, `hip-escape`, `positional-hierarchy` · `mount` · `upa-escape`, `elbow-knee-escape`)
    3. *Inside the Closed Guard* (`posture`, `base`, `grips` · `closed-guard` · `break-closed-guard`, `scissor-sweep`, `hip-bump-sweep`)
    4. *The Closed Guard Submission Triad* (`angles`, `two-on-one`, `action-reaction` · `closed-guard` · `armbar-guard`, `triangle-choke`, `kimura-guard`, `guillotine-guard`)
    5. *Defending Inside the Guard* (`defend-early`, `posture` · `closed-guard` · `armbar-defence`, `triangle-defence`, `guillotine-defence`, `kimura-defence`)
    6. *Open Guard & Passing* (`distance`, `inside-position`, `hip-control` · `open-guard` · `toreando-pass`, `double-under-pass`, `butterfly-sweep`, `tripod-sweep`, `guard-retention`)
    7. *The Half Guard & Side Control Pin* (`underhooks`, `head-position`, `pressure`, `face-your-opponent` · `half-guard` & `side-control` · `knee-slice`, `half-to-full-guard`, `half-guard-underhook-sweep`, `side-to-mount`, `americana`)
    8. *Back Control, Turtle & Standing Safely* (`position-before-submission`, `training-partner`, `roll-to-learn` · `back-control`, `turtle`, `standing` · `rear-naked-choke`, `back-escape`, `rear-naked-choke-defence`, `turtle-to-back`, `turtle-recover-guard`, `pull-guard`, `double-leg`, `sprawl`)
- [x] **Lesson progress & study deck:**
  - Compute each lesson's progress automatically from the review states of its items (no new storage table needed).
  - Allow starting a Review session filtered to a single lesson's cards.

---

# Completed sprint history (2026-11-14 – 2026-11-15)

The items below were found on 2026-11-14 while reviewing the app as a BJJ coach and completed on 2026-11-15.

## 1. Fix study rough edges (S) — Done 2026-11-15

- [x] **Blue belt "Study techniques" studies the wrong deck.** The button goes to `reviewPath('transition')`, which is every technique, not the test list (`ui/pages/BlueBelt.tsx`). Needs a deck, or a filter, for `isOnBlueBeltTest` in `buildQueue` (`core/study.ts`), with a test.
- [x] **Home never points at weak cards.** "Next up" is the first item never reviewed (`ui/pages/Home.tsx:87-89`). Nothing surfaces cards with lapses or low ease, and step 3 links to the map instead of the next technique. Add a pure "what to study next" function in `core/` with a test.
- [x] **"Session complete" counts the wrong deck.** The "more waiting" count always uses the `all` deck, whatever deck was studied (`ui/pages/Review.tsx:55`).
- [x] **"Keep going" does not keep going.** It returns to the options screen instead of starting another round (`Review.tsx`).
- [x] **The safety concept is linked to no position.** "Tap early, tap often" is the only concept no position lists. Link it where submissions happen (closed guard, mount, back control, side control).
- [x] **Tighten the tripod sweep step.** Done 2026-11-15 from written instructions (the video was not watched): the hip foot goes on the same side as the gripped ankle, the other foot hooks the far leg, and the push goes back, not up.
- [x] **Skim the new starter videos.** Done 2026-11-15 by reading each video's YouTube transcript (auto-captions) against the written steps.
- [x] **Deepen and sharpen all starter concepts, positions, and techniques.** Done 2026-11-15: clearer biomechanical cues, ordered position goals, 5–6 step breakdowns, common mistakes, and drills across all 25 concepts, 8 positions, and 37 techniques, with `refreshStarterCopy` in `core/starter.ts` and a Dexie `version(9)` upgrade for existing libraries.

## 2. "What do I do here?" cards (M) — Done 2026-11-15

- [x] **Add who performs a technique.** Done 2026-11-15 as `Transition.role`, read through `performerRole` (`core/roles.ts`); backup schema is now 4.
- [x] **Fix the ambiguous destinations this exposes.** Done 2026-11-15 as `Transition.endRole`, read through `endRole` (`core/roles.ts`): technique lists and pages say which side you end up on ("→ Closed Guard, passing"). Backup schema 8.
- [x] **Situation cards.** Done 2026-11-15: one card per side of each position that has techniques ("Mount, underneath: what are your options?"), in their own Situations deck and at the end of Everything.
- [x] **Coverage on the position page.** Done 2026-11-15: "From here" is split by side (`positionOptions`) and an empty side says so.

## 3. Training log (L) — Done 2026-11-15

- [x] **Log a class.** Done 2026-11-15. Date, minutes on the mat, what was taught, what worked and what failed in rolling, and one thing to focus on next time, with techniques linked.
- [x] **New table.** Done 2026-11-15 as `trainingLog` (Dexie version 5, backup schema 5).
- [x] **A Log screen**, plus the latest "focus for next time" on Home. Done 2026-11-15.
- [x] **Use the log in study.** Done 2026-11-15: an entry can name the situations you got stuck in (`stuckIds`); those cards and their techniques, then the techniques you practised, come first among new cards for the last three classes (`studyFirst`).

## 4. Smaller content ideas (S each) — Done 2026-11-15

- [x] **More curriculum.** Done 2026-11-15 for what fits the eight starter positions: single-leg takedown, kimura defence, americana defence and a turtle breakdown.
- [x] **Drills on techniques.** Done 2026-11-15: `Transition.drill`, read through `techniqueDrill`, with a drill written for all starter techniques (backup schema 6).
- [x] **Training etiquette and safety.** Done 2026-11-15 as two starter concepts, "Be a good training partner" and "Roll to learn, not to win", each with a video and a drawing.
- [x] **Search.** Done 2026-11-15: one box on Home, Concepts, and Positions finds concepts, positions and techniques by name or text (`core/search.ts`).

## 5. Follow-up & review fixes — Done 2026-11-15

- [x] **Drill for today (`pickDrill` in `core/todaysDrill.ts`).**
- [x] **Progress per position (`positionProgress`).**
- [x] **Natural situation names ("Mount, underneath").**
- [x] **Sticking points threshold (2 lapses).**
- [x] **Phone layout improvements and independent review fixes.**
