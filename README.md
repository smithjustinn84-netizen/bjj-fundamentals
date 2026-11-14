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
src/domain/   Pure logic: types, scheduling, queue building, backup validation, YouTube parsing, starter content
src/data/     IndexedDB (Dexie): schema, repositories, queries. src/data/index.ts is the only door in.
src/ui/       React pages and components
```

Imports only point inward (`ui → data → domain`), and the linter enforces it. Read [AGENTS.md](AGENTS.md) before changing anything; the reasoning is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). To change the starter content, edit `src/domain/seed.ts`.
