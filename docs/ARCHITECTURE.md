# Architecture

The day-to-day rules are in [AGENTS.md](../AGENTS.md). This page explains why they are what they are.

## Shape

```
   src/ui            pages, components, routes                 React
      │
      ▼
   src/bindings      composition root + React hooks            picks the storage engine
      │        \
      │         ▼
      │      src/storage   dexieStorage.ts                     IndexedDB (replaceable)
      │         │  implements
      ▼         ▼
   src/core   ┌──────────────────────────────────────────────────────────┐
              │ models · srs · study · library · backup · youtube · seed │  plain TypeScript
              │ rank · mapLayout · figure · svgNumber  ← graphics maths  │
              │ beltTest  ← which techniques are on the blue belt test   │
              │ starter   ← starter techniques a library does not hold   │
              │ roles     ← who does a technique; options per position   │
              │ storage.ts   ← the AppStorage interface                  │  no DOM, no browser,
              │ services/    ← all app logic, written against AppStorage │  no React, no Dexie
              │ core.ts      ← createCore({ storage, newId, now })       │
              └──────────────────────────────────────────────────────────┘
```

`src/core` is the application. It can be lifted into a Capacitor app, a React Native app, a CLI or a server and run unchanged, because the three things it needs from outside are handed to it through `CoreEnv`:

- **`storage`**: an `AppStorage`. Six repositories with plain reads and writes by id, a `transaction`, a `subscribe` for change notifications, and `reset`.
- **`newId`**: so core never calls `crypto`.
- **`now`**: so core never reads the clock, and tests control time.

The interface is deliberately small. Filtering, sorting, cascading deletes and backup import are done in core services by composing those few methods. That costs a little efficiency (services read whole tables) and buys a storage engine that is around a hundred lines and knows nothing about BJJ.

## How the boundary is enforced

| Guard | Catches |
| --- | --- |
| `tsconfig.core.json` compiles `src/core` with `lib: ["ES2022"]` and no ambient types | Any browser or Node global in core (`document`, `window`, `crypto`, `URL`, `indexedDB`, `fetch`, timers). It caught the original YouTube parser using `URL`. |
| `biome.json` `noRestrictedImports` / `noRestrictedGlobals` per folder | Imports that point outward, `dexie` outside `src/storage`, React inside core |
| `core/testing/storageContract.ts`, run against every engine | An engine that behaves differently from the others (rollback, notifications, first-run data, restart) |
| Core service tests run on `memoryStorage` | Core logic that secretly depends on IndexedDB behaviour |

## How SOLID shows up

- **Single responsibility.** `srs.ts` changes when scheduling changes, `services/items.ts` when item rules change, `dexieStorage.ts` when IndexedDB details change, `ConceptForm.tsx` when that form changes.
- **Open/closed.** A new storage engine is a new file, not an edit to existing ones. Things that vary by item kind are tables keyed by kind or exhaustive switches.
- **Liskov.** Any `AppStorage` can replace any other; the contract suite is the proof. Every item form satisfies the same `ItemFormProps`.
- **Interface segregation.** UI code imports the one service it needs (`videos`, `reviews`, ...), not a single "database" object.
- **Dependency inversion.** Core defines the storage interface and the engine implements it, so the dependency points at core. Ids and time are injected.

## Decisions

| Decision | Why | Revisit when |
| --- | --- | --- |
| Narrow CRUD interface, logic in core | Maximum portability, minimum per-engine code. Data is tens to hundreds of rows. | Tables reach tens of thousands of rows; then add specific indexed reads to the interface, as `reviewLog.since` already is. |
| Engines insert `initialData` on first creation | Every engine has a natural "database created" hook (Dexie `populate`, SQLite `user_version`), so no startup step or seeding flag is needed. Core still owns the content. | An engine has no such hook. |
| Starter concepts and techniques added to the app later are offered to existing libraries (`core/starter.ts`, `items.addMissingStarterConcepts`, `items.addMissingStarterTechniques`), not inserted automatically | `initialData` is only inserted once, and `AppStorage` has no engine-neutral place to record that a content update has run (Dexie `version().upgrade()` can, and was used for the starter videos, but that ties the rule to one engine). Without that record, "missing" cannot tell "never had it" from "deleted it on purpose", so an automatic insert would bring back deleted techniques. A button leaves that choice with the user, and "Dismiss" records the techniques not to offer again in the `starterDismissals` table, which is backed up like any other. | Starter content changes often enough to need real versioning. |
| Change notification is one coarse `subscribe` | One event re-runs the few visible queries; simple to implement on any engine. Dexie's version also reports other tabs. | Re-running queries shows up in profiling. |
| `useQuery` instead of `dexie-react-hooks` | UI reactivity no longer depends on the engine. | A data library (TanStack Query etc.) is adopted. |
| The in-memory storage ships in core | It makes core tests need no database and is the reference implementation for new engines. | Never, unless it stops matching the contract. |
| Factories and modules, not classes or a DI container | One composition root, a handful of dependencies. | The dependency graph grows. |
| Biome for lint and format, not ESLint + Prettier | `typescript-eslint` did not support TypeScript 7 when this was set up. | Type-aware lint rules become necessary. |
| Backups are validated field by field, by hand | A backup is a user-supplied file. The checks are tied to the models, so a new field cannot be forgotten. | Validation rules get complicated. |
| Hash routing (`/#/positions`) | Works from any static host, subfolder or `file://`-style webview with no rewrite rules. | The app gets a server. |
| Graphics are inline SVG (plus one painted hero image served from `public/artwork/`) and motion is CSS; no three.js, icon set or animation library | The app is small and must work offline with no network calls. SVG stays sharp, follows the theme tokens and is reachable by keyboard and screen readers. Diagram figures are posed from joint positions (`core/figure.ts`) so every scene shares one drawing style. three.js alone would have roughly doubled the download. | A graphic genuinely needs 3D or thousands of moving parts. |
| Map geometry and belt rank are computed in core (`mapLayout.ts`, `rank.ts`) | They are rules with edge cases (parallel arrows, arrows steering around boxes, rank thresholds), so they are tested without a browser; the component only draws. | Layout needs measured text sizes, which only the browser knows. |
| The map's arrows are single curves chosen from a fixed set of bows | Simple and deterministic; good for tens of positions. | Libraries grow to where arrows cannot avoid each other; then route properly or let the user arrange positions. |
| A concept or technique with a bookmarked video shows YouTube's player (`VideoPlayer`, on `youtube-nocookie.com`); every other bookmark is a plain link | Drawings of the start and end positions cannot show how a technique moves, and tweening the figures between the two poses was tried and read as tangled limbs. A real video does. The cost, accepted by the user: opening such a concept or technique, or revealing its review card, loads third-party code and contacts YouTube, the app's only network call. Offline, and for items with no video, the drawing is shown instead. | The player should appear in more places, or load only after a click to avoid contacting YouTube on page load. |

## Known limits

- IndexedDB is per browser and per device. The JSON backup is the only way to move or protect data.
- Import replaces everything; there is no merge.
- The streak looks back 400 days (`STREAK_WINDOW_DAYS`), so it tops out there.
- Only the IndexedDB engine exists. The SQLite/Capacitor path is designed for and contract-tested in shape, but not built.
- `npm run check` runs in CI after a push, not before a commit: jj has no commit hooks.
- CI deploys what it built: the `dist/` that passed the checks on `main` is the artifact published to GitHub Pages, and only when the repository variable `DEPLOY_TO_PAGES` is `true`. There is no staging site and no rollback beyond re-running an older run's deploy or reverting the change.
- There are no automated UI tests. Core and storage are covered by unit and contract tests; screens are checked by hand.
