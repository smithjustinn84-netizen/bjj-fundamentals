# BJJ Fundamentals

A small, fully client-side app for learning beginner Brazilian Jiu-Jitsu concepts, positions, and the techniques that connect them.

- **No backend, no accounts, no API calls.** Everything is stored in your browser's IndexedDB (via Dexie.js).
- **Concepts** – posture, base, frames, shrimping, bridging, underhooks, grips, pressure, and tapping safely.
- **Position map** – 8 core positions, with goals for each person and 20 starter sweeps, passes, escapes, takedowns, and submissions.
- **Spaced-repetition review** – every concept, position, and technique is a flashcard (simplified SM-2). Keyboard: <kbd>Space</kbd> to reveal, <kbd>1</kbd>–<kbd>4</kbd> to grade.
- **YouTube timestamp bookmarks** – paste a link (with `?t=` if you like) and attach it to any item. Links open on YouTube in a new tab; nothing is embedded or fetched.
- **Backup** – one-click JSON export of everything, and import that replaces all data in a single transaction.
- Everything is editable: add your own positions, techniques, concepts, and class notes.

## Run it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run check` | Lint, typecheck, test and build. Run before calling any change done. |
| `npm test` | Unit tests |
| `npm run format` | Auto-format and apply safe lint fixes |
| `npm run build` | Production build into `dist/`, which can be served from any static host, at the root or in a subfolder |

## How the code is organised

```
src/core/       The app itself: models, spaced repetition, app logic, and the storage interface.
                Plain TypeScript with zero DOM/browser dependencies (compiler-enforced).
src/storage/    Storage engines implementing core's AppStorage interface. Today: IndexedDB via Dexie.
src/bindings/   Composition root: picks the storage engine, builds the core, exposes React hooks.
src/ui/         React pages and components
```

Imports only point inward (`ui → bindings → storage → core`), and the compiler and linter enforce it. Moving to native SQLite or Capacitor means adding one file in `src/storage/` that passes the shared contract tests, and changing one line in `src/bindings/index.ts`.

Read [AGENTS.md](AGENTS.md) before changing anything; the reasoning is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). To change the starter content, edit `src/core/seed.ts`.
