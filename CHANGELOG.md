# Changelog

All notable changes to Mini Trainer Engine will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-16

### Added

#### Core Engine

- Initial release of Mini Trainer Engine
- Configuration-driven architecture separating core engine from subject-specific content
- Component registry pattern for exercise type mapping
- Dual storage strategy (localStorage + IndexedDB) for offline support

#### Exercise Types

- **Multiple Choice**: Select one correct answer from multiple options
- **Fill-in-the-Blank**: Fill in blank placeholders in sentences
- **Matching**: Match items from left column to right column
- **Sentence Builder**: Construct sentences from word columns
- **Category Sort**: Sort items into categories
- **Word Order**: Arrange scrambled words into correct order
- **Connector Insert**: Select connector to join sentence parts
- **Conjugation Table**: Fill in verb conjugation forms
- **Writing**: Free writing with scaffolding support
- **Picture Vocabulary**: Identify vocabulary from picture prompts

#### Gamification System

- Star rating system (0-3 stars per exercise)
- Level progression based on accumulated stars
- Badge system with milestone achievements
- Streak tracking for consecutive daily practice
- Customizable gamification configuration

#### Accessibility Features

- WCAG 2.1 AA compliance
- Full keyboard navigation
- Screen reader support (NVDA, JAWS, VoiceOver, TalkBack)
- High contrast mode
- Adjustable font sizes (normal, large, extra-large)
- Reduced motion support
- Sound toggle
- Skip-to-content link
- ARIA live regions for dynamic content

#### Internationalization

- i18next integration
- English translations
- German translations
- Extensible locale system

#### Build System

- Vite-based build with file:// protocol compatibility
- IIFE output format for USB distribution
- PWA build option with service worker
- Configuration validation script
- Interactive exercise creation tool

#### Developer Tools

- TypeScript 5.6 with strict mode
- Vitest testing framework
- ESLint configuration
- Path aliases for clean imports

### Configuration

- Subject configuration (`subject.json`)
- Observation areas configuration (`areas.json`)
- Themes configuration (`themes.json`)
- Badges and gamification configuration (`badges.json`)
- Exercise data format (`exercises.json`)

### Documentation

- Comprehensive README
- Getting Started guide
- Configuration guide
- Exercises guide
- Gamification guide
- Accessibility guide
- Deployment guide
- Extending guide
- Architecture document

### Technical Details

- React 18 with functional components
- Zustand for state management
- React Router for navigation
- Tailwind CSS for styling
- idb for IndexedDB wrapper

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-02-16 | Initial release |

---

## Future Roadmap

### Planned for 0.2.0

- Additional exercise types
- Enhanced analytics dashboard
- Teacher dashboard improvements
- Export/import user data

### Planned for 0.3.0

- Spaced repetition algorithm
- Adaptive difficulty
- Multi-profile support
- Parent/guardian dashboard

### Under Consideration

- Mobile app wrapper
- Cloud sync
- Collaborative features
- AI-powered hints

---

[0.1.0]: https://github.com/your-org/mini-trainer-engine/releases/tag/v0.1.0
