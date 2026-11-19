<p align="center">
  <img src="docs/hero.jpg" alt="BJJ Fundamentals — woodblock illustration of two Brazilian Jiu-Jitsu practitioners on the mat" width="100%" />
</p>

# BJJ Fundamentals

A small, 100% client-side web app for learning beginner Brazilian Jiu-Jitsu concepts, positions, and the techniques that connect them.

No backend, no accounts, and no tracking. Everything lives in your browser's IndexedDB (via Dexie.js), with one-click JSON backup and restore. The only external request is YouTube's privacy-enhanced player (`youtube-nocookie.com`) when you watch a bookmarked video on a concept or technique.

## What's inside

- **Today** — A daily starting point with your current study path, due reviews, and **Today's drill** picked from where you got stuck in class, cards slipping in review, or what comes next.
- **28 Concepts** — Posture, base, frames, shrimping, bridging, underhooks, grips, pressure, tapping safely, and more.
- **8 Positions & Interactive Map** — Core positions with top/bottom goals (16 situations) and **59 starter techniques** (sweeps, passes, escapes, takedowns, submissions, and transitions) linked by defence and follow-up chains.
- **14 Foundation Lessons** — Class-sized tracks ordered from day-one safety and survival to guard and attacks, each with a 15-minute partner practice script.
- **Blue Belt Test** — A customisable checklist of test techniques and readiness progress.
- **Spaced-Repetition Review** — Every concept, position, situation, and technique is a flashcard (simplified SM-2). Keyboard shortcuts: <kbd>Space</kbd> to reveal, <kbd>1</kbd>–<kbd>4</kbd> to grade.
- **Training Log** — Record mat time, classes, techniques practised, and positions where you got stuck so the app can surface what to drill next.
- **YouTube Timestamp Bookmarks** — Includes **188 curated video bookmarks**, and you can paste any link (with `?t=` timestamps) onto any item. Concept and technique videos play inline; other bookmarks open on YouTube in a new tab.
- **Fully Editable & Portable** — Add or edit your own concepts, positions, techniques, and notes; export everything to JSON or import a backup in a single transaction; switch between Light, Dark, and Device themes.

## Run it

```bash
npm install
npm run dev
```

| Command | What it does |
| --- | --- |
| `npm run check` | Lint, typecheck, test, and production build. Run before calling any change done. |
| `npm test` | Unit tests (Vitest) |
| `npm run format` | Auto-format and apply safe lint fixes (Biome) |
| `npm run build` | Typecheck and production build into `dist/`, servable from any static host |

## CI and deploy

Every push to `main` and every pull request runs lint, typecheck, tests, and the production build ([ci.yml](.github/workflows/ci.yml)). Pull requests that touch dependencies are also checked for known vulnerabilities, and Dependabot opens weekly update pull requests.

Deploying to GitHub Pages is built in but off by default. To enable it:

1. In the repository's **Settings → Pages**, set the source to **GitHub Actions**.
2. In **Settings → Secrets and variables → Actions → Variables**, add `DEPLOY_TO_PAGES` with the value `true`.

From then on, every green run on `main` publishes that run's `dist/`.

## How the code is organised

```text
src/core/       The app itself: models, spaced repetition, curriculum, and the storage interface.
                Plain TypeScript with zero DOM/browser dependencies (compiler-enforced).
src/storage/    Storage engines implementing core's AppStorage interface. Today: IndexedDB via Dexie.
src/bindings/   Composition root: picks the storage engine, builds the core, exposes React hooks.
src/ui/         React pages, components, and hand-written SVG woodblock illustrations.
```

Imports only point inward (`ui → bindings → storage → core`), enforced by the compiler and linter. Moving to native SQLite or Capacitor means adding one file in `src/storage/` that passes the shared contract tests, and changing one line in `src/bindings/index.ts`.

Read [AGENTS.md](AGENTS.md) before changing anything; the architectural reasoning is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). To change the starter content, edit `src/core/seed.ts`.
