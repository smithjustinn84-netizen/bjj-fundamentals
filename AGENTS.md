# Working in this codebase

Rules for anyone changing this app, human or AI. They exist to stop small shortcuts piling up into a codebase nobody can change safely. Most are enforced by `npm run check`; the rest are on you.

## What this app is

A 100% client-side Vite + React + TypeScript app for learning beginner BJJ concepts. No backend, no accounts, no network calls. All data is in IndexedDB (Dexie) and can be exported and imported as JSON.

## The one architectural rule

Three layers. Imports only point inward: `ui → data → domain`.

| Layer | Folder | Contains | Must not contain |
| --- | --- | --- | --- |
| Domain | `src/domain/` | Types, scheduling, parsing, validation, queue building, starter content. Pure functions. | React, Dexie, DOM, `Date.now()`, `crypto`, anything async |
| Data | `src/data/` | Dexie schema, repositories (writes), queries (reads), live-query hooks | JSX, routing, UI text |
| UI | `src/ui/`, `src/App.tsx` | Components, pages, routes, browser-only helpers | Dexie, business rules, anything in `src/data/` other than its index |

Where does new code go?

- A rule or calculation ("when is a card due", "is this link valid") → `domain/`, as a pure function that takes `now` as a parameter, with a test.
- Reading or writing stored data → a method on a repository or query in `data/`, exported through `src/data/index.ts`.
- Anything the user sees or clicks → `ui/`. Components call hooks and repository methods; they never open transactions or compute business results inline.

## Hard constraints

- **No network calls.** No `fetch`, no analytics, no fonts or scripts from a CDN, no embedded iframes. YouTube bookmarks are plain links.
- **No new dependencies without asking the user.** Say what it is for and what it costs in bundle size.
- **No `any`, no non-null `!`, no `@ts-ignore`.** Narrow the type or fix the model. An `as` cast needs a comment saying why it is safe.
- **A lint suppression needs a reason** on the same line (`// biome-ignore <rule>: <why>`). Never weaken `biome.json` or `tsconfig.json` to make an error go away.
- **Never edit an existing Dexie `version()` block.** See the comment at the top of `src/data/db.ts`.
- **Imported backups are untrusted input.** Every stored field must have a check in `SCHEMAS` in `src/domain/backup.ts`.
- **All persistence goes through IndexedDB** so it is covered by backup. No `localStorage`.

## Conventions

- Union types come from a `const` list (`ITEM_KINDS`, `GRADES`, ...) in `domain/types.ts`. Add a value there, not as a string literal elsewhere.
- Every `switch` over a union ends with `default: return assertNever(x)` so a new member fails to compile until handled.
- Build paths with `src/ui/routes.ts`. No hand-written `'/positions/' + id`.
- Repositories are factories that take the database (`createItemRepository(db)`). Tests pass a throwaway one from `src/data/testDb.ts`.
- Repositories set `id`, `createdAt`, `updatedAt`. Callers pass an `...Input` type without them.
- Multi-table writes go in one `db.transaction`.
- No magic numbers: name the constant and say what it means.
- Comments explain why, not what. No commented-out code, no TODOs without an owner.
- Tests live next to the code as `*.test.ts`.

## Recipes

**Add a field to an item.** (1) Add it to the type in `domain/types.ts`. (2) The compiler now fails in `domain/backup.ts` until you add its check, and in the seed and form until you supply it. (3) Decide what old rows and old backups without the field should do: make the check `optional(...)` and default it on read, or add a Dexie `upgrade`. (4) Add a test.

**Add a table.** (1) Type in `domain/types.ts`. (2) New `version(n + 1)` in `data/db.ts`. (3) Add it to `BackupData`, `BACKUP_TABLES` and `SCHEMAS` in `domain/backup.ts`, and to `TABLE_LABELS`. (4) A repository in `data/`, exported from `data/index.ts`. (5) Tests for the repository and the validation.

**Add a kind of study item.** Add it to `ITEM_KINDS`, then follow the compile errors: every `switch` with `assertNever`, the `FORMS` registry in `ui/pages/editor/EditorPage.tsx`, routes, labels.

**Add a screen.** Path in `ui/routes.ts`, page in `ui/pages/`, route in `App.tsx`. Data comes from a hook in `data/index.ts`.

## Version control

This repo uses [Jujutsu](https://jj-vcs.github.io/jj/) (`jj`) on a git backend, colocated, so `.git` exists too. Use `jj`, not `git`, for anything that changes history.

- The working copy is always a change; there is no staging area. `jj st` and `jj diff` show it.
- Finish a change with `jj commit -m "..."`, or `jj describe -m "..."` then `jj new`.
- `main` is a bookmark and does not move by itself: `jj bookmark move main --to @-` after committing.
- jj does not run git hooks, so nothing runs `npm run check` for you. Run it before every `jj commit` and before any `jj git push`.
- Mistake? `jj undo` reverses the last operation; `jj op log` lists them all.
- Commit or push only when the user asks.

## Definition of done

1. `npm run check` passes (lint and format, typecheck, tests, production build). Run it; do not assume.
2. New or changed logic in `domain/` or `data/` has a test that would fail without the change.
3. UI changes were exercised in a browser, including the empty and error states.
4. Nothing left behind: no unused exports, dead branches, stray logs, or files that only existed for debugging.
5. If you changed a rule or the structure, this file and `docs/ARCHITECTURE.md` say so.

If a rule here blocks something the user asked for, stop and say so instead of working around it.
