# Getting Started

This guide will help you set up and run the Mini Trainer Engine on your local machine.

## Prerequisites

### Required Software

| Software | Minimum Version | Recommended |
|----------|-----------------|-------------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |

### Checking Your Versions

```bash
node --version
npm --version
```

### Operating System Compatibility

Mini Trainer Engine works on:

- **Windows**: 10/11
- **macOS**: 10.15 (Catalina) or later
- **Linux**: Any modern distribution

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mini-trainer-engine.git
cd mini-trainer-engine
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required dependencies including:

- React 18
- Vite 6
- TypeScript 5.6
- Tailwind CSS 3
- Zustand (state management)
- i18next (internationalization)

### 3. Validate Configuration

Before running the application, validate your configuration files:

```bash
npm run validate
```

This checks:

- JSON syntax validity
- Required fields presence
- Cross-reference integrity (e.g., exercises reference valid themes and areas)

### 4. Choose an App

Every app lives in `src/apps/<id>` (see [CREATING_APPS.md](CREATING_APPS.md)). Commands take the app with `--app <id>`; without it the default app from `trainer.config.json` is used.

## Running the Development Server

Start the development server with hot module replacement:

```bash
npm run dev                       # default app
npm run dev -- --app ahs-mathematik   # another app
```

This generates the app's config and exercise files in `public/` (untracked) and starts Vite. The application will be available at [http://localhost:5173](http://localhost:5173).

### Development Server Features

- **Hot Module Replacement (HMR)**: Changes reflect instantly without page reload
- **Fast Refresh**: React components preserve state during updates
- **Source Maps**: Debug with original TypeScript source

### Common Development Tasks

#### Adding New Exercises

Use the interactive exercise creator:

```bash
npm run add-exercise
```

This guides you through creating exercises with proper validation.

#### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

#### Type Checking

```bash
npm run typecheck
```

#### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Building for Production

### Standard Build

Build one app for production deployment:

```bash
npm run build -- --app ahs-mathematik        # USB build: dist/ahs-mathematik
npm run build:pwa -- --app ahs-mathematik    # PWA build: dist/ahs-mathematik-pwa
npm run build:all                        # every app, USB and PWA
```

A build

1. validates the app's content and fails on any error,
2. type-checks the code and fails on any error,
3. bundles with Vite and writes config, exercises, icon and (PWA) manifest and service worker.

### Build Output Structure

```
dist/<app>/
├── index.html              # Entry point
├── icon.svg
├── assets/
│   └── index-[hash].js     # Bundled application (IIFE, includes styles)
├── config/                 # app, subject, areas, themes, badges (*.js; PWA builds also *.json)
└── data/
    └── exercises.js        # Exercises (PWA builds also exercises.json)
```

PWA builds add `manifest.json` and `sw.js`.

### Preview Production Build

Test the production build locally:

```bash
npx vite preview --outDir dist/ahs-mathematik-pwa
```

This serves the build at [http://localhost:4173](http://localhost:4173).

## Building for USB Distribution

Mini Trainer Engine is designed to work from USB drives using the file:// protocol.

### USB-Compatible Build

```bash
npm run build -- --app <id>
```

The build is already configured for file:// protocol compatibility:

- Relative paths (`base: './'` in vite.config.ts)
- IIFE output format (no ES module CORS issues)
- No module preload (avoids file:// restrictions)

### Deploying to USB

1. Build the application:

   ```bash
   npm run build -- --app <id>
   ```

2. Copy the contents of `dist/<id>/` to your USB drive

3. Users can open `index.html` directly from the USB drive

### USB Distribution Requirements

- Modern web browser (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)
- No internet connection required after initial load
- Data persists in browser's localStorage/IndexedDB

## Building for PWA Distribution

For web deployment with offline support:

```bash
npm run build:pwa -- --app <id>
```

This generates:

- Service worker (`sw.js`), versioned per build and pre-caching every file of the build
- PWA manifest (`manifest.json`), generated from the app's `app.json`
- The app icon (`icon.svg`)

PWA features need https (or localhost).

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed PWA configuration.

## Troubleshooting

### Common Issues

#### "Module not found" Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript Compilation Errors

```bash
# Check for type errors
npm run typecheck

# Rebuild TypeScript cache
rm -rf tsconfig.tsbuildinfo tsconfig.node.tsbuildinfo
npm run typecheck
```

#### Build Fails with Content Errors

```bash
# Lists every problem with the exercise id and field
npm run validate
```

#### Vite Cache Issues

```bash
# Clear Vite cache
npm run clean
```

### Getting Help

1. Check the [Architecture Document](../plans/ARCHITECTURE.md) for technical details
2. Review [CONFIGURATION.md](CONFIGURATION.md) for configuration options
3. Open an issue on GitHub with:
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Operating system
   - Full error message

## Next Steps

- [Configure your subject](CONFIGURATION.md) - Customize the trainer for your subject
- [Create exercises](EXERCISES.md) - Add learning content
- [Understand gamification](GAMIFICATION.md) - Learn about stars, levels, and badges
- [Deploy your trainer](DEPLOYMENT.md) - Distribute to learners
