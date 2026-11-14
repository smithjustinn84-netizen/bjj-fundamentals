# Architecture

The day-to-day rules are in [AGENTS.md](../AGENTS.md). This page explains why they are what they are.

## Layers

```
            ┌──────────────────────────────────────────────┐
  src/ui    │ pages, components, routes                    │  React
            └───────────────┬──────────────────┬───────────┘
                            │ hooks, commands  │ types, pure functions
            ┌───────────────▼────────────┐     │
  src/data  │ repositories, queries, db  │     │             Dexie
            └───────────────┬────────────┘     │
                            │                  │
            ┌───────────────▼──────────────────▼───────────┐
  src/domain│ types, srs, study, library, backup, youtube  │  plain TypeScript
            └──────────────────────────────────────────────┘
```

- **Domain** is everything that would still be true if the app were rewritten for another UI or another database: what a position is, how a review is scheduled, what a valid backup looks like. It is pure, so it is tested without mocks and cannot break because of a browser or library change.
- **Data** is the only code that knows IndexedDB exists. `src/data/index.ts` is its whole public surface: live-query hooks for reading and four objects (`items`, `videos`, `reviews`, `backups`) for writing. Swapping Dexie for something else, or adding sync, would be contained here.
- **UI** renders the domain and calls the data layer. A component that needs data it cannot get from `src/data` adds a hook or method there instead of reaching around it.

## How SOLID shows up

- **Single responsibility.** One reason to change per module: `srs.ts` changes when scheduling changes, `itemRepository.ts` when storage of items changes, `ConceptForm.tsx` when the concept form changes. `useReviewSession` holds session state; `Review.tsx` only renders it.
- **Open/closed.** Things that vary by item kind are tables keyed by kind (`FORMS`, `KIND_LABELS`) or exhaustive switches. Adding a kind adds entries; the compiler lists every place that needs one.
- **Liskov.** Every item form satisfies the same `ItemFormProps`, so the editor page treats them identically.
- **Interface segregation.** There is no single "database service". A component that only adds videos imports `videos`, and cannot delete positions by accident.
- **Dependency inversion.** Repositories receive the database as an argument. Domain logic receives `now` as an argument. Nothing in the inner layers reaches out for a global.

## Decisions

| Decision | Why | Revisit when |
| --- | --- | --- |
| Factories and modules, not classes, interfaces or a DI container | One implementation of each thing exists. A factory taking `db` gives testability without the ceremony. | A second storage backend appears. |
| Biome for lint and format, not ESLint + Prettier | `typescript-eslint` did not support TypeScript 7 when this was set up. Biome is one dependency and one config. Layer boundaries are `noRestrictedImports` overrides in `biome.json`. | Type-aware lint rules become necessary. |
| The whole library is loaded into memory (`useLibrary`) | Tens of rows. Simpler than per-screen queries, and every screen stays consistent. | Thousands of items. |
| Backups are validated field by field, by hand | A backup is a user-supplied file. The checks are tied to the types, so a new field cannot be forgotten. A schema library would be a dependency for about 100 lines. | Validation rules get complicated. |
| Hash routing (`/#/positions`) | Works from any static host or subfolder with no server rewrite rules. | The app gets a server. |
| YouTube bookmarks are links, not embedded players | An embed would load third-party code and make network calls, breaking the offline and privacy guarantees. | The user asks for inline playback and accepts that trade. |
| `confirm()` for destructive actions | Zero code, accessible, impossible to mis-style. | A design pass wants custom dialogs. |

## Known limits

- IndexedDB is per browser and per device. The JSON backup is the only way to move or protect data.
- Import replaces everything; there is no merge.
- The streak looks back 400 days (`STREAK_WINDOW_DAYS`), so it tops out there.
- `npm run check` runs in CI after a push, not before a commit: jj has no commit hooks.
- There are no automated UI tests. Domain and data are covered by unit tests; screens are checked by hand.
