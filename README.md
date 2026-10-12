# Maxi Trainer Engine

A configurable engine for learning apps: exercises, gamification and accessibility, driven by JSON content.
Each app (a subject, such as Physik or Latein for the AHS Unterstufe) is a folder of JSON under `src/apps/<id>`; the engine in `src/core` stays the same for all of them.
Apps are distributed as a **USB build** (open `index.html` from the stick, works from `file://`) or as an installable **PWA**.

## Features

- **10 exercise types**: multiple choice, fill in the blank, matching, sentence builder, word order, category sorting, conjugation tables, connector insertion, writing, picture vocabulary
- **Gamification**: stars, levels, badges and streaks (calendar days in local time)
- **Accessibility**: keyboard operation, screen reader support, high contrast, font sizes
- **Offline**: USB builds need no server; PWA builds cache everything for offline use
- **Per-app storage**: profiles, settings and progress are separated per app, so several apps can share one origin
- **Content validation**: every exercise of every app is checked against a schema in CI and on every build

## Quick start

Requires Node.js 20 or newer.

```bash
npm install
npm run dev                         # default app (see trainer.config.json)
npm run dev -- --app ahs-mathematik     # any app under src/apps
```

Open [http://localhost:5173](http://localhost:5173).

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev [-- --app <id>]` | Generate the app's files and start the dev server |
| `npm run build [-- --app <id>]` | USB build in `dist/<id>` (validates content, type-checks) |
| `npm run build:pwa [-- --app <id>]` | PWA build in `dist/<id>-pwa` |
| `npm run build:all` | Every app, USB and PWA (`build:all:usb`, `build:all:pwa` for one kind) |
| `npm run validate [-- --app <id>]` | Validate the default config and the content of every app |
| `npm test` | Run the tests (`test:watch`, `test:coverage`) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run add-exercise` | Interactive exercise creator |

## Project structure

```
├── trainer.config.json      # What differs between engine variants: name, default app, store prefix
├── src/
│   ├── apps/<id>/           # One app: app.json, subject.json, areas.json, themes.json, badges.json, exercises.json
│   ├── core/                # The engine: components, hooks, stores, storage, config loading, i18n
│   ├── config/              # Default config used when an app does not provide a file
│   ├── pages/               # Route components
│   └── types/
├── scripts/
│   ├── build-app.mjs        # Build one app
│   ├── build-all-apps.mjs   # Build all apps
│   ├── prepare-dev.mjs      # Dev server for one app
│   ├── validate-config.mjs  # Content validation
│   ├── templates/sw.js      # Service worker template
│   └── lib/                 # Exercise schema, app validation, build helpers
├── public/                  # Static assets (icons, fonts); config and data are generated and untracked
└── docs/
```

## Documentation

- [Getting started](docs/GETTING_STARTED.md)
- [Configuration](docs/CONFIGURATION.md)
- [Creating an app](docs/CREATING_APPS.md)
- [Creating exercises](docs/EXERCISES.md)
- [Gamification](docs/GAMIFICATION.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Extending the engine](docs/EXTENDING.md)
- [Multi-app architecture](docs/MULTI_APP_ARCHITECTURE.md)

## Design decisions and limits

- **Content is data.** `exercises.json` is validated by `scripts/lib/exercise-schema.mjs`; add a field to the schema and the TypeScript type together.
- **`file://` compatibility.** The bundle is an IIFE and config and exercises are classic scripts that set `window.__TRAINER_*__` globals. Consequently route-level code splitting does not apply.
- **Teacher PIN.** The PIN keeps children out of the teacher area. It is stored (hashed) in the browser and is not access control: anyone with access to the device can bypass it. Five wrong attempts block login for 30 seconds, doubling up to 15 minutes. Clearing the browser data removes the PIN together with all progress.
- **Save games.** Exported save games carry an unkeyed SHA-256 checksum. It detects damaged or hand-edited files but does not prevent forged ones; stars and badges are motivational, not a certificate.
- **PWA icons** are SVG. Home-screen icons on iOS need PNG, which the build does not generate.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). CI runs lint, type check, content validation, tests and a build of every app.

## License

GNU Affero General Public License v3.0, see [LICENSE](LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
