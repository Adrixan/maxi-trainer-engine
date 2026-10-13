# Project guide for coding agents

A configurable trainer engine for school learning apps (exercises, gamification, accessibility).
Each app is a folder of JSON under `src/apps/<id>`; the engine in `src/core` does not change per app.
Variant-specific settings (name, default app, store prefix) live in `trainer.config.json`.

## Commands

- `npm run dev -- --app <id>`: generate the app's files and start the dev server
- `npm run build -- --app <id> [--pwa]`: build `dist/<id>` (USB, works from `file://`) or `dist/<id>-pwa`
- `npm run build:all`: build every app as USB and PWA
- `npm run validate`: validate the config and **every app's content** (schema in `scripts/lib/exercise-schema.mjs`)
- `npm run lint`, `npm run typecheck`, `npm test`

CI runs all of the above plus `build:all`; run them before committing.

## Rules

- Content errors must fail `npm run validate`. When adding an exercise type or field, extend the schema and the TypeScript type together.
- Dates for streaks and daily progress use the local calendar day (`src/core/utils/date.ts`), never `toISOString()`.
- Persisted stores are scoped per app (`src/core/appId.ts`); do not add unscoped `localStorage` keys.
- The teacher PIN is a classroom lock, not access control. Do not describe it as security.
- `public/config`, `public/data` and `dist` are generated and untracked.
- The bundle is an IIFE so it runs from `file://`; route-level code splitting does not apply.
- Commits follow the Conventional Commits format (`feat:`, `fix:`, `refactor:`, ...).
