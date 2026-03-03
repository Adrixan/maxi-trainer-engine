# Mini Trainer Engine

A reusable, configurable trainer application shell for creating web-based learning applications. Build subject-specific trainers with exercise types, gamification, and accessibility features that can be distributed via USB or as a Progressive Web App (PWA).

## Features

- **🎯 10 Exercise Types**: Multiple choice, fill-in-the-blank, matching, sentence builder, word order, category sorting, conjugation tables, connector insertion, writing exercises, and picture vocabulary
- **🎮 Gamification System**: Stars, levels, badges, and streak tracking to motivate learners
- **♿ WCAG 2.1 AA Accessibility**: Full keyboard navigation, screen reader support, high contrast mode, and customizable font sizes
- **📱 Multiple Distribution Options**: Build for USB (file:// protocol) or PWA deployment
- **🌍 Internationalization**: Built-in i18n support with German and English translations
- **⚙️ Highly Configurable**: Customize subjects, themes, badges, and exercise content via JSON configuration

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/mini-trainer-engine.git
cd mini-trainer-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## Installation

### Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Setup

```bash
# Install dependencies
npm install

# Validate configuration files
npm run validate

# Build exercise data
npm run build:data
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (includes data build) |
| `npm run build:data` | Build exercise data from JSON sources |
| `npm run build:pwa` | Build for PWA distribution |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix linting issues automatically |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run validate` | Validate configuration files |
| `npm run add-exercise` | Interactive exercise creation tool |

## Project Structure

```
mini-trainer-engine/
├── src/
│   ├── core/                    # Core engine (unchanged between trainers)
│   │   ├── components/          # React components
│   │   │   ├── exercises/       # Exercise type components
│   │   │   ├── gamification/    # Stars, badges, progress components
│   │   │   └── accessibility/   # Accessibility settings and utilities
│   │   ├── hooks/               # Custom React hooks
│   │   ├── stores/              # Zustand state management
│   │   ├── storage/             # IndexedDB and localStorage utilities
│   │   ├── utils/               # Utility functions
│   │   ├── i18n/                # Internationalization
│   │   └── config/              # Configuration loading and validation
│   │
│   ├── config/                  # Configuration files (customize per trainer)
│   │   ├── subject.json         # Subject/domain definition
│   │   ├── areas.json           # Observation/diagnostic areas
│   │   ├── themes.json          # Content themes
│   │   └── badges.json          # Achievement definitions
│   │
│   ├── types/                   # TypeScript type definitions
│   ├── pages/                   # Page components
│   └── data/                    # Exercise content data
│
├── public/
│   ├── data/                    # Generated exercise data
│   └── fonts/                   # Custom fonts
│
├── scripts/                     # Build and utility scripts
│   ├── add-exercise.mjs         # Interactive exercise creator
│   ├── build-exercise-data.mjs  # Data build script
│   └── validate-config.mjs      # Configuration validator
│
└── docs/                        # Documentation
```

## Configuration

Mini Trainer Engine is designed to be customized through configuration files. The core engine code remains unchanged between different trainers.

### Key Configuration Files

| File | Purpose |
|------|---------|
| [`src/config/subject.json`](src/config/subject.json) | Defines the subject, target audience, and enabled exercise types |
| [`src/config/areas.json`](src/config/areas.json) | Observation/diagnostic areas for progress tracking |
| [`src/config/themes.json`](src/config/themes.json) | Content themes that group related exercises |
| [`src/config/badges.json`](src/config/badges.json) | Achievement badge definitions |
| [`src/data/exercises.json`](src/data/exercises.json) | Exercise content data |

### Example: Subject Configuration

```json
{
  "id": "generic-trainer",
  "name": "Generic Trainer",
  "description": "A configurable trainer for any subject",
  "targetAudience": "Learners of all ages and skill levels",
  "primarySkillArea": "comprehension",
  "enabledExerciseTypes": [
    "fill-blank",
    "multiple-choice",
    "matching",
    "sentence-builder"
  ]
}
```

## Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** - Prerequisites, installation, and running the application
- **[Configuration Guide](docs/CONFIGURATION.md)** - Detailed configuration options
- **[Creating Exercises](docs/EXERCISES.md)** - Exercise types and content creation
- **[Gamification System](docs/GAMIFICATION.md)** - Stars, levels, badges, and streaks
- **[Accessibility](docs/ACCESSIBILITY.md)** - WCAG compliance and accessibility features
- **[Deployment](docs/DEPLOYMENT.md)** - Building for USB and PWA distribution
- **[Extending the Engine](docs/EXTENDING.md)** - Adding new exercise types and customizing behavior

## Architecture

For a detailed technical overview, see the [Architecture Document](plans/ARCHITECTURE.md).

### Key Design Principles

1. **Separation of Core and Config**: The `src/core/` directory contains engine code that never changes between trainers. All customization happens in `src/config/`.

2. **Component Registry Pattern**: Exercise types are mapped to components via a registry, enabling easy addition of new types.

3. **Dual Storage Strategy**: Settings in localStorage, user data in IndexedDB for robust offline support.

4. **file:// Protocol Compatibility**: Built output works without a web server, enabling USB distribution.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style guidelines, and pull request process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.
