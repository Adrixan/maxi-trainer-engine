# Extending the Engine

Mini Trainer Engine is designed for extensibility. This guide covers how to add new exercise types, custom themes, badge types, and internationalization.

## Adding New Exercise Types

Adding a new exercise type involves several steps: defining types, creating the component, and registering it.

### Step 1: Define the Content Type

Add the content interface to [`src/types/exercise.ts`](../src/types/exercise.ts):

```typescript
// Add new content interface
export interface DragDropContent {
  /** Discriminant for exercise content union */
  type: 'drag-drop';
  /** The drag items */
  items: { id: string; label: string }[];
  /** The drop zones */
  zones: { id: string; label: string; correctItemId: string }[];
}

// Add to ExerciseType union
export type ExerciseType =
  | // ... existing types
  | 'drag-drop';

// Add to ExerciseContent union
export type ExerciseContent =
  | // ... existing types
  | DragDropContent;
```

### Step 2: Create the Component

Create the exercise component in [`src/core/components/exercises/`](../src/core/components/exercises/):

```tsx
// DragDropExercise.tsx

import { useState } from 'react';
import type { DragDropContent } from '@/types';
import { BaseExercise } from './BaseExercise';

interface Props {
  content: DragDropContent;
  hints: string[];
  onSubmit: (correct: boolean) => void;
  showSolution: boolean;
}

export function DragDropExercise({ content, hints, onSubmit, showSolution }: Props) {
  const [placements, setPlacements] = useState<Record<string, string>>({});

  const handleDrop = (zoneId: string, itemId: string) => {
    setPlacements(prev => ({ ...prev, [zoneId]: itemId }));
  };

  const checkAnswer = () => {
    const correct = content.zones.every(
      zone => placements[zone.id] === zone.correctItemId
    );
    onSubmit(correct);
  };

  return (
    <BaseExercise
      instruction="Drag items to the correct zones"
      hints={hints}
      showSolution={showSolution}
      onCheck={checkAnswer}
    >
      {/* Component implementation */}
    </BaseExercise>
  );
}
```

### Step 3: Register the Component

Add to the component registry in [`src/core/components/exercises/ExerciseRenderer.tsx`](../src/core/components/exercises/ExerciseRenderer.tsx):

```typescript
import { DragDropExercise } from './DragDropExercise';

const EXERCISE_COMPONENTS: Record<string, React.ComponentType<ExerciseProps>> = {
  // ... existing types
  'drag-drop': DragDropExercise,
};
```

### Step 4: Enable in Subject Configuration

Add to [`src/config/subject.json`](../src/config/subject.json):

```json
{
  "enabledExerciseTypes": [
    "fill-blank",
    "multiple-choice",
    // ... existing types
    "drag-drop"
  ],
  "exerciseTypeConfig": {
    "drag-drop": {
      "hintsEnabled": true,
      "maxAttempts": 2
    }
  }
}
```

### Step 5: Add Type Validation

Update the validation script to handle the new type:

```javascript
// scripts/validate-config.mjs

const EXERCISE_CONTENT_SCHEMAS = {
  // ... existing schemas
  'drag-drop': {
    required: ['items', 'zones'],
    itemSchema: {
      required: ['id', 'label']
    },
    zoneSchema: {
      required: ['id', 'label', 'correctItemId']
    }
  }
};
```

### Step 6: Add Tests

Create tests in [`src/core/components/exercises/__tests__/`](../src/core/components/exercises/__tests__/):

```typescript
// DragDropExercise.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DragDropExercise } from '../DragDropExercise';

describe('DragDropExercise', () => {
  const mockContent = {
    type: 'drag-drop' as const,
    items: [
      { id: '1', label: 'Apple' },
      { id: '2', label: 'Banana' }
    ],
    zones: [
      { id: 'a', label: 'Fruit A', correctItemId: '1' },
      { id: 'b', label: 'Fruit B', correctItemId: '2' }
    ]
  };

  it('renders all items and zones', () => {
    render(
      <DragDropExercise
        content={mockContent}
        hints={[]}
        onSubmit={vi.fn()}
        showSolution={false}
      />
    );
    
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});
```

## Custom Themes

Themes control the visual appearance and can be customized via CSS variables.

### Creating a Custom Theme

1. **Define theme colors** in your configuration:

```json
// src/config/themes.json
[
  {
    "id": "space",
    "name": "Space Adventure",
    "icon": "rocket",
    "color": "#1a1a2e",
    "description": "Explore the cosmos",
    "minLevel": 1
  }
]
```

1. **Add theme-specific styles** (optional):

```css
/* src/index.css */
[data-theme="space"] {
  --color-primary: #7c3aed;
  --color-secondary: #06b6d4;
  --color-background: #0f172a;
  --color-surface: #1e293b;
}
```

1. **Apply theme in components**:

```tsx
<div data-theme={currentTheme}>
  {/* Themed content */}
</div>
```

### Theme Best Practices

- Use semantic color names (primary, secondary, surface)
- Ensure sufficient contrast for accessibility
- Test themes with high contrast mode
- Consider reduced motion preferences

## Custom Badge Types

Create custom badge types for specialized achievements.

### Step 1: Define the Badge Type

Add to [`src/config/badges.json`](../src/config/badges.json):

```json
{
  "badge": {
    "id": "perfect_score_theme",
    "name": "Perfect Score Champion",
    "description": "Get 3 stars on all exercises in a theme",
    "icon": "emoji_events"
  },
  "type": "theme_perfection",
  "threshold": 1
}
```

### Step 2: Implement Badge Check

Add the check logic in [`src/core/utils/badges.ts`](../src/core/utils/badges.ts):

```typescript
export function checkBadge(
  badge: BadgeDefinition,
  profile: ChildProfile,
  results: ExerciseResult[]
): boolean {
  switch (badge.type) {
    // ... existing cases
    
    case 'theme_perfection':
      return Object.entries(profile.themeProgress).some(([themeId, progress]) => {
        const themeResults = results.filter(r => r.themeId === themeId);
        return themeResults.length > 0 && 
               themeResults.every(r => r.score === 3);
      });
    
    default:
      return false;
  }
}
```

### Step 3: Add Badge Type to Validation

Update the validation schema:

```typescript
const VALID_BADGE_TYPES = [
  'star_milestone',
  'streak_milestone',
  'level_milestone',
  'theme_perfection'
];
```

## Internationalization

Add support for new languages.

### Step 1: Create Translation File

Create [`src/core/i18n/[locale].json`](../src/core/i18n/):

```json
// fr.json
{
  "common": {
    "submit": "Soumettre",
    "next": "Suivant",
    "cancel": "Annuler",
    "close": "Fermer"
  },
  "exercises": {
    "multipleChoice": {
      "instruction": "Choisissez la bonne réponse"
    },
    "fillBlank": {
      "instruction": "Remplissez le blanc"
    }
  },
  "gamification": {
    "stars": "étoiles",
    "level": "niveau",
    "streak": "série"
  },
  "accessibility": {
    "fontSizeNormal": "Normal",
    "fontSizeLarge": "Grand",
    "fontSizeExtraLarge": "Très grand"
  }
}
```

### Step 2: Register the Locale

Update [`src/core/i18n/index.ts`](../src/core/i18n/index.ts):

```typescript
import fr from './fr.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});
```

### Step 3: Update Subject Configuration

Add supported locales to [`src/config/subject.json`](../src/config/subject.json):

```json
{
  "supportedLocales": ["en", "de", "fr"],
  "defaultLocale": "en"
}
```

### Translation Best Practices

- Use nested keys for organization
- Provide fallback translations
- Include all keys from the default locale
- Test with right-to-left languages if supported

## Custom Gamification Rules

Implement custom star calculation or progression rules.

### Custom Star Calculator

Create a custom calculator in [`src/core/utils/gamification.ts`](../src/core/utils/gamification.ts):

```typescript
export interface GamificationCalculator {
  calculateStars(params: ScoringParams): number;
  calculateLevel(totalStars: number, thresholds: LevelThreshold[]): number;
}

export function createCustomCalculator(
  config: GamificationConfig
): GamificationCalculator {
  return {
    calculateStars(params: ScoringParams): number {
      // Custom logic: combine attempts and time
      const { correct, attempts, timeSpentSeconds, difficulty } = params;
      
      if (!correct) return 0;
      
      // Base stars from attempts
      let stars = Math.max(0, 4 - attempts);
      
      // Time bonus for fast completion
      if (timeSpentSeconds < 30) {
        stars = Math.min(3, stars + 1);
      }
      
      // Difficulty multiplier
      if (difficulty === 3) {
        stars = Math.min(3, stars + 1);
      }
      
      return Math.min(3, stars);
    },
    
    calculateLevel(totalStars: number, thresholds: LevelThreshold[]): number {
      // Standard level calculation
      const sorted = [...thresholds].sort((a, b) => b.level - a.level);
      for (const threshold of sorted) {
        if (totalStars >= threshold.starsRequired) {
          return threshold.level;
        }
      }
      return 1;
    }
  };
}
```

### Using Custom Calculator

Update the gamification hook:

```typescript
// src/core/hooks/useGamification.ts

import { createCustomCalculator } from '@/utils/gamification';

export function useGamification() {
  const calculator = useMemo(
    () => createCustomCalculator(gamificationConfig),
    [gamificationConfig]
  );
  
  // Use calculator.calculateStars() instead of default
}
```

## Custom Diagnostic Frameworks

Implement specialized observation frameworks.

### Step 1: Define Observation Areas

Create areas specific to your framework:

```json
// src/config/areas.json
[
  {
    "id": "phonics",
    "name": "Phonics & Decoding",
    "category": "Reading",
    "stages": [
      {
        "level": 1,
        "label": "Letter Recognition",
        "description": "Identifies letters and their sounds",
        "examples": ["Names uppercase letters", "Names lowercase letters"]
      },
      {
        "level": 2,
        "label": "Blending",
        "description": "Blends sounds to read words",
        "examples": ["Reads CVC words", "Blends consonant clusters"]
      }
    ]
  }
]
```

### Step 2: Add Framework-Specific Fields

Extend types if needed:

```typescript
// src/types/profile.ts

export interface AreaObservation {
  areaId: ObservationAreaId;
  achievedLevel: number;
  notes: string;
  // Framework-specific fields
  phonicsRatings?: {
    blending: 'emerging' | 'developing' | 'proficient';
    segmenting: 'emerging' | 'developing' | 'proficient';
  };
}
```

### Step 3: Create Framework-Specific UI

Build components for framework-specific features:

```tsx
// PhonicsObservationForm.tsx

export function PhonicsObservationForm({ area, observation, onChange }) {
  return (
    <div>
      <h3>{area.name}</h3>
      <RatingScale
        label="Blending"
        value={observation.phonicsRatings?.blending}
        onChange={(value) => onChange({ 
          phonicsRatings: { ...observation.phonicsRatings, blending: value }
        })}
      />
    </div>
  );
}
```

## Extension Best Practices

### Code Organization

- Keep extensions in appropriate directories
- Follow existing naming conventions
- Document new types and interfaces

### Testing

- Write tests for all new functionality
- Include edge cases
- Test accessibility

### Documentation

- Update relevant documentation
- Add JSDoc comments
- Provide usage examples

### Backward Compatibility

- Don't break existing configurations
- Provide migration paths
- Version your changes

## Next Steps

- [Review the architecture](../plans/ARCHITECTURE.md) for technical details
- [Contribute your extensions](CONTRIBUTING.md) back to the project
- [Deploy your customized trainer](DEPLOYMENT.md)
