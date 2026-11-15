# Working in this codebase

Rules for anyone changing this app, human or AI. They exist to stop small shortcuts piling up into a codebase nobody can change safely. Most are enforced by `npm run check`; the rest are on you.

## What this app is

A 100% client-side Vite + React + TypeScript app for learning beginner BJJ concepts. No backend, no accounts, and no network calls except YouTube's player on a study item that has a video. All data is in IndexedDB (Dexie) and can be exported and imported as JSON.

## The one architectural rule

Imports only point inward: `ui → bindings → storage → core`. **`src/core` is the app; everything else is a replaceable shell around it.**

| Folder | Contains | Must not contain |
| --- | --- | --- |
| `src/core/` | Data models, spaced-repetition logic, queue building, validation, map layout, starter content, the storage interface (`storage.ts`) and all app logic (`services/`). | Anything from a browser or runtime: DOM, `window`, `crypto`, `URL`, `indexedDB`, `Date.now()`. No React, no Dexie. Compiled with no DOM typings, so these are compile errors. |
| `src/storage/` | Implementations of `AppStorage`. Today one: `dexieStorage.ts` (IndexedDB). The only place that imports `dexie`. | App rules, React, UI text |
| `src/bindings/` | The composition root: picks a storage engine, builds the core, exposes services and React hooks. | Business rules, JSX |
| `src/ui/`, `src/App.tsx` | Components, pages, routes, browser-only helpers | Storage engines, business rules. Gets data and actions from `src/bindings` only. |

Where does new code go?

- A rule or calculation ("when is a card due", "is this link valid") → a pure function in `core/`, taking `now` as a parameter, with a test.
- Anything that reads or writes stored data → a method on a service in `core/services/`, written against `AppStorage`, then exposed in `src/bindings/index.ts`. It gets ids and time from `CoreEnv` (`newId`, `now`), never from globals.
- Something the storage engine itself must do → add it to the `AppStorage` interface, implement it in **every** engine (`memoryStorage.ts`, `dexieStorage.ts`), and add a case to `core/testing/storageContract.ts`. Do this rarely: prefer composing existing methods in a service.
- Anything the user sees or clicks → `ui/`.

## Hard constraints

- **No network calls, with one exception.** No `fetch`, no analytics, no fonts or scripts from a CDN. The only thing that may contact another site is the YouTube player iframe in `ui/components/VideoPlayer.tsx` (on `youtube-nocookie.com`, address built by `embedUrl` in `core/youtube.ts`), shown through `ItemPicture` for a study item's bookmarked video, on its page and its review card. No other iframe, and no player anywhere else, without asking the user; everywhere else YouTube bookmarks are plain links.
- **Core stays portable.** If `tsc -p tsconfig.core.json` or the linter rejects something in `core/`, the fix is to inject it through `CoreEnv` or move the code out, never to add DOM typings or loosen the config.
- **No new dependencies without asking the user.** Say what it is for and what it costs in bundle size.
- **No `any`, no non-null `!`, no `@ts-ignore`.** Narrow the type or fix the model. An `as` cast needs a comment saying why it is safe.
- **A lint suppression needs a reason** on the same line (`// biome-ignore <rule>: <why>`). Never weaken `biome.json` or a `tsconfig` to make an error go away.
- **Never edit an existing Dexie `version()` block.** See the comment at the top of `src/storage/dexieStorage.ts`.
- **Imported backups are untrusted input.** Every stored field must have a check in `SCHEMAS` in `src/core/backup.ts`.
- **All persistence goes through `AppStorage`** so it is covered by backup. No `localStorage`.

## Conventions

- Union types come from a `const` list (`ITEM_KINDS`, `GRADES`, ...) in `core/models.ts`. Add a value there, not as a string literal elsewhere. Rules about a value are predicates there too: ask `endsTheRoll(type)`, not `type === 'submission'`.
- Anything listed per kind (menus, groups, decks) is built from `ITEM_KINDS`, so a new kind shows up everywhere or fails to compile. Study cards use `CARD_KINDS`, which adds `situation`: one side of one position (`core/situations.ts`), a card with no item, page or form behind it.
- Every `switch` over a union ends with `default: return assertNever(x)` so a new member fails to compile until handled.
- Build paths with `src/ui/routes.ts`, and route patterns with `ROUTE_PATTERNS` there. No hand-written `'/positions/' + id`.
- Deleting an item from the UI goes through `confirmDelete` (`ui/components/confirmDelete.ts`), so every delete button warns about the same cascade.
- Services are factories that take `CoreEnv` (`createItemService(env)`). Tests use `testCore()` from `core/testing/testCore.ts`: in-memory storage, a clock the test controls, predictable ids.
- Services set `id`, `createdAt`, `updatedAt`. Callers pass an `...Input` type without them.
- Multi-step writes go in one `storage.transaction`, and inside it only storage calls are awaited.
- No magic numbers: name the constant and say what it means.
- Comments explain why, not what. No commented-out code, no TODOs without an owner.
- Tests live next to the code as `*.test.ts`. Test-only helpers live in `core/testing/`.

## Look and motion

- Styles are plain CSS in `src/styles/`, one file per area (`tokens`, `base`, `motion`, `shell`, `graphics`, then one per screen), imported in that order from `src/main.tsx`.
- Styles are phone first. A rule outside a media query is the phone layout; wider layouts are added with `min-width` queries (600px is where the bottom tab bar becomes a top bar), never `max-width`. Anything tapped is at least `--tap` tall on a phone. A form's Save row is an `.action-bar`, which pins it above the tab bar on a phone; a list row that opens a page is one `.row-link`, not a link inside a row.
- The shell has five destinations (Today, Learn, Review, Log, More), the same on every screen size. A new screen goes behind one of them, not into the bar: add it to `LEARN_ROUTES` or `MORE_ROUTES` in `ui/routes.ts` so its tab stays lit, and link it from the Learn switch (`LearnTabs`) or the More page.
- Colours, radii, durations and easings come from `tokens.css`. No hex colours anywhere else; a new colour is a new token with a light and a dark value.
- Graphics are hand-written inline SVG components in `src/ui/graphics/` coloured through tokens. The only image files are the painted home-page hero and the touch icon in `public/artwork/`; every other picture is SVG, so do not add more paintings. No font files, no icon or animation library.
- The hero and the diagrams share one sheet of paper: diagrams use only the `--art-*` tokens, which have a single value for both themes; the dark theme dims the whole `.artwork-frame` instead. This is the one exception to "a light and a dark value".
- People in diagrams are `Figure`s (`ui/graphics/Figure.tsx`) posed by joint positions inside a `Diagram`; add a scene by adding poses to `ConceptSvg.tsx` or `PositionSvg.tsx`, not by drawing body shapes by hand. A position's scene in `PositionSvg.tsx` is data (two poses and a draw order) so a concept can be drawn on it. The picture at the top of a concept, position or technique (`ItemPicture`) is its bookmarked video when it has one and the device is online; otherwise its drawing: `ConceptArtwork`, `PositionArtwork`, or the technique's start and end positions side by side (`TransitionArtwork`). Lists, thumbnails and situation cards always use drawings. Do not animate figures between poses: it was tried and two poses cannot show a technique.
- Motion is CSS. `motion.css` ends with a `prefers-reduced-motion` block that switches every animation off; scripted motion checks `prefersReducedMotion()` from `ui/graphics/motion.ts`.
- Anything a graphic has to calculate (where map boxes sit, how arrows curve, which belt a percentage earns, how a pose becomes limbs) is a pure function in `core/` with a test (`mapLayout.ts`, `rank.ts`, `figure.ts`). Components only draw the result.

## Recipes

**Add a field to an item.** (1) Add it to the model in `core/models.ts`. (2) The compiler now fails in `core/backup.ts` until you add its check, and in the seed and form until you supply it. (3) Decide what old rows and old backups without the field should do: make the check `optional(...)` and default it on read (through one function, like `isOnBlueBeltTest`, `performerRole` or `endRole`, never `row.field ?? ...` at each use), or add a Dexie `upgrade`. (4) Bump `BACKUP_SCHEMA_VERSION` in `core/backup.ts`. (5) Add a test.

**Add starter content.** Edit `core/seed.ts`. New libraries get it on first run; existing libraries only see new starter *concepts* and *techniques*, offered on the Concepts and Blue belt pages (`core/starter.ts`) unless the user dismissed them (`starterDismissals`, keyed by id alone, so starter ids must be unique across kinds; `core/seed.test.ts` checks this). An added concept brings its starter video and is linked to the starter positions that list it. Every starter technique starts on the blue belt test list. New starter positions, or videos for items a library already has, do not reach an existing library.

**Add a table.** (1) Model in `core/models.ts`. (2) Add it to `BackupData`, `BACKUP_TABLES` and `SCHEMAS` in `core/backup.ts`, to `TABLE_LABELS`, and to `AppStorage`. (3) Implement it in `memoryStorage.ts` and, with a new `version(n + 1)`, in `dexieStorage.ts`. (4) A service in `core/services/`, wired in `core/core.ts` and exposed in `bindings/index.ts`. (5) Extend the storage contract and add service tests.

**Swap or add a storage engine** (SQLite, Capacitor, ...). (1) Write `src/storage/<engine>Storage.ts` exporting a factory that returns an `AppStorage` and honours `StorageOptions.initialData` (insert once, on first creation). (2) Add `<engine>Storage.test.ts` that calls `describeStorageContract` with that factory, and make it pass. (3) Change the one `storage` line in `src/bindings/index.ts`. Nothing in `core/` or `ui/` changes. If the engine cannot report changes from other processes, notifying after its own commits is enough.

**Add a kind of study item.** Add it to `ITEM_KINDS`, then follow the compile errors: every `switch` with `assertNever`, the `FORMS` registry in `ui/pages/editor/EditorPage.tsx`, routes, labels.

**Add a screen.** Path in `ui/routes.ts`, page in `ui/pages/`, route in `App.tsx`. Data comes from a hook in `bindings/index.ts`, built with `useQuery`.

## Version control

This repo uses [Jujutsu](https://jj-vcs.github.io/jj/) (`jj`) on a git backend, colocated, so `.git` exists too. Use `jj`, not `git`, for anything that changes history.

- The working copy is always a change; there is no staging area. `jj st` and `jj diff` show it.
- Finish a change with `jj commit -m "..."`, or `jj describe -m "..."` then `jj new`.
- `main` is a bookmark and does not move by itself: `jj bookmark move main --to @-` after committing.
- jj does not run git hooks, so nothing runs `npm run check` locally for you. Run it before every `jj commit` and before any `jj git push`. CI (`.github/workflows/ci.yml`) runs the same four stages, as separate steps, on every push to `main` and every pull request; a red run means the change is not done. If you change the `check` script, change those steps to match.
- A green run on `main` deploys the built `dist/` to GitHub Pages when the repository variable `DEPLOY_TO_PAGES` is `true`. Pushing to `main` is then a release.
- Actions in `.github/workflows/` are pinned to a commit SHA with the version in a trailing comment. Dependabot (`.github/dependabot.yml`) updates the pins and the npm packages weekly; do not replace a pin with a tag.
- Mistake? `jj undo` reverses the last operation; `jj op log` lists them all.
- Commit or push only when the user asks.

## Definition of done

1. `npm run check` passes (lint and format, typecheck, tests, production build). Run it; do not assume.
2. New or changed logic in `core/` or `storage/` has a test that would fail without the change.
3. UI changes were exercised in a browser, including the empty and error states.
4. Nothing left behind: no unused exports, dead branches, stray logs, or files that only existed for debugging.
5. If you changed a rule or the structure, this file and `docs/ARCHITECTURE.md` say so.

If a rule here blocks something the user asked for, stop and say so instead of working around it.
