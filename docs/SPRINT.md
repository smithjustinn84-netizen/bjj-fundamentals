# Next sprint: coaching gaps

Found on 2026-11-14 while reviewing the app as a BJJ coach would. The curriculum holes (13 starter techniques) are already done; these are what is left, in the order I would do them.

Sizes: **S** is an hour or two, **M** is a day, **L** is several days.

## 1. Fix study rough edges (S)

Small, independent fixes. Each can ship alone. The first five were done on 2026-11-15: a "Blue belt test" deck, a "Sticking points" section and next technique on Home, and the safety concept linked to closed guard, side control, mount and back control (new libraries only; an existing library keeps its own links).

- [x] **Blue belt "Study techniques" studies the wrong deck.** The button goes to `reviewPath('transition')`, which is every technique, not the test list (`ui/pages/BlueBelt.tsx`). Needs a deck, or a filter, for `isOnBlueBeltTest` in `buildQueue` (`core/study.ts`), with a test.
- [x] **Home never points at weak cards.** "Next up" is the first item never reviewed (`ui/pages/Home.tsx:87-89`). Nothing surfaces cards with lapses or low ease, and step 3 links to the map instead of the next technique. Add a pure "what to study next" function in `core/` with a test.
- [x] **"Session complete" counts the wrong deck.** The "more waiting" count always uses the `all` deck, whatever deck was studied (`ui/pages/Review.tsx:55`).
- [x] **"Keep going" does not keep going.** It returns to the options screen instead of starting another round (`Review.tsx`).
- [x] **The safety concept is linked to no position.** "Tap early, tap often" is the only concept no position lists. Link it where submissions happen (closed guard, mount, back control, side control).
- [ ] **Tighten the tripod sweep step.** The step is loose about which foot goes on the hip; confirm against how it is taught and fix the wording in `core/seed.ts`.
- [ ] **Skim the new starter videos.** 19 were added on 2026-11-14 and 15 (17 techniques, 2 concepts). Their ids were checked as real and embeddable, but matched by title only. Swap any that teach a different variation from the written steps.

## 2. "What do I do here?" cards (M)

Today every card asks you to recite one thing. Rolling asks a different question: *I am stuck here, what are my options?*

- [x] **Add who performs a technique.** Done 2026-11-15 as `Transition.role`, read through `performerRole` (`core/roles.ts`); backup schema is now 4. A technique has only `fromId` and `toId`; nothing says whether the person doing it is top or bottom. Add a role field to `Transition` (follow the "Add a field to an item" recipe in `AGENTS.md`: model, `SCHEMAS`, default for old rows through one function, bump `BACKUP_SCHEMA_VERSION`).
- [x] **Fix the ambiguous destinations this exposes.** Done 2026-11-15 as `Transition.endRole`, read through `endRole` (`core/roles.ts`): technique lists and pages say which side you end up on ("→ Closed Guard, passing"). Backup schema 8.
- [x] **Situation cards.** Done 2026-11-15: one card per side of each position that has techniques ("Mount, Bottom side: what are your options?"), in their own Situations deck and at the end of Everything. Cards use `CARD_KINDS` (item kinds plus `situation`); backup schema is 7. The position card went back to asking only for goals.
- [x] **Coverage on the position page.** Done 2026-11-15: "From here" is split by side (`positionOptions`) and an empty side says so. It flags a side with nothing at all, not a missing escape specifically. Per role, show what you have and flag what is missing ("no escape from here yet"). The calculation is a pure function in `core/` with a test.

## 3. Training log (L)

The app tracks flashcard reviews but not mat time, and mat time is what makes the cards mean something.

- [x] **Log a class.** Done 2026-11-15. Date, minutes on the mat, what was taught, what worked and what failed in rolling, and one thing to focus on next time, with techniques linked.
- [x] **New table.** Done 2026-11-15 as `trainingLog` (Dexie version 5, backup schema 5). Deleting a technique or position removes it from entries and keeps the entry. Follow the "Add a table" recipe in `AGENTS.md`: model, backup schema and labels, `AppStorage`, both storage engines with a new Dexie `version(5)`, a service, the storage contract and service tests.
- [x] **A Log screen**, plus the latest "focus for next time" on Home. Done 2026-11-15. On phones the tab bar is full, so the log is reached from Home's training log card.
- [x] **Use the log in study.** Done 2026-11-15: an entry can name the situations you got stuck in (`stuckIds`); those cards and their techniques, then the techniques you practised, come first among new cards for the last three classes (`studyFirst`). Cards already being studied keep their schedule.

Open question: should mat time feed the belt and streak display, or stay separate from study progress?

## 4. Smaller content ideas (S each)

- [x] **More curriculum.** Done 2026-11-15 for what fits the eight starter positions: single-leg takedown, kimura defence, americana defence and a turtle breakdown (47 starter techniques). Not planned: knee-on-belly and north-south, which need a way to offer starter positions to existing libraries, and the straight ankle lock.
- [x] **Drills on techniques.** Done 2026-11-15: `Transition.drill`, read through `techniqueDrill`, with a drill written for all 43 starter techniques (backup schema 6). Only concepts have a drill. A solo or partner drill per technique would give a white belt something to do between classes.
- [x] **Training etiquette and safety.** Done 2026-11-15 as two starter concepts, "Be a good training partner" and "Roll to learn, not to win", each with a video and a drawing. One or two concepts on rolling intensity, hygiene, and what to tell a partner about an injury.
- [x] **Search.** Done 2026-11-15: one box on Home finds concepts, positions and techniques by name or text (`core/search.ts`). Only the Videos page has a search box; there is none for concepts, positions or techniques.

## 5. Found after the list above was done

- [x] **Drill for today.** Done 2026-11-15: Home picks one drill (`pickDrill` in `core/todaysDrill.ts`): a way out of where you last got stuck, else a technique that keeps slipping, else one practised in class, else the next one not learned.
- [x] **Progress per position.** Done 2026-11-15: the position page and the positions list say how many of the techniques that start there are learned (`positionProgress`).
- [x] **Situation names read naturally.** Done 2026-11-15: "Mount, underneath" and "Closed Guard, passing" in place of "Mount, Bottom side".
- [x] **Sticking points are sensitive.** Done 2026-11-15: a card is listed once it has been forgotten twice.
- [x] **The deck picker wraps on phones.** Done 2026-11-15: a menu replaces the buttons below 600px.
- [x] **The log has no phone tab.** Done 2026-11-15: Home's hero has a "Log a class" button. The tab bar still holds six.
- [x] **Search is on Home only.** Done 2026-11-15: also on the Concepts and Positions pages.
- [x] **Mat time and study progress are separate.** Decided 2026-11-15: a day with a logged class counts toward the streak; the study belt stays cards-only.

