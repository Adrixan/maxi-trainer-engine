# Migration Guide - Refactoring 2024

This guide documents the changes made during the refactoring and provides instructions for updating code that uses the old APIs.

## Overview

The refactoring improved code organization by:

1. Splitting large files into focused modules
2. Creating new utility functions for common operations
3. Decomposing the ExercisePage into separate view components
4. Adding new hooks for improved functionality

---

## 1. Gamification Module Split

### What Changed

The `gamification.ts` utility has been split into focused sub-modules:

| Old Location | New Location |
|--------------|--------------|
| `src/core/utils/gamification.ts` | `src/core/utils/starCalculation.ts` |
| | `src/core/utils/levelCalculation.ts` |
| | `src/core/utils/streakCalculation.ts` |
| | `src/core/utils/gamification.ts` (re-exports) |

### Import Updates

**Before (deprecated):**

```typescript
// Importing from the monolithic file still works but is discouraged
import { calculateStars } from '@core/utils/gamification';
```

**After (recommended):**

```typescript
// Option 1: Import from main module (recommended)
import { calculateStars } from '@core/utils/gamification';

// Option 2: Import directly from sub-module (better tree-shaking)
import { calculateStars } from '@core/utils/starCalculation';
```

### Functions by Module

**starCalculation.ts:**

- `calculateStars(attempts, maxAttempts)` - Calculate star rating from attempts
- `getStarDisplay(stars)` - Get star emoji string
- `getStarArray(stars)` - Get star array for rendering
- `calculateMaxStars(exerciseCount)` - Calculate maximum stars

**levelCalculation.ts:**

- `calculateLevel(totalStars)` - Calculate level from stars
- `levelFromStars(totalStars)` - Get vocabulary level
- `getStarsForNextLevel(currentStars)` - Stars needed for next level
- `getProgressPercentage(current, total)` - Progress percentage
- `getLevelProgress(profile)` - Full level progress
- `isLevelAccessible(themeId, level)` - Check if level is unlocked
- Constants: `DEFAULT_STARS_PER_LEVEL`, `MAX_THEME_LEVEL`

**streakCalculation.ts:**

- `updateStreak(currentStreak, lastActivity)` - Update streak
- `isStreakAtRisk(lastActivity)` - Check if streak is at risk
- `getStreakDisplay(streak)` - Get streak display string

---

## 2. New Exercise Styling Utilities

### What Changed

New utility module `exerciseStyles.ts` provides consistent Tailwind CSS classes for exercise components.

### Import Updates

**Before:**

```typescript
// Inline styles or local constants
const buttonClass = 'px-4 py-2 bg-primary text-white rounded-lg';
```

**After:**

```typescript
import { optionStyles, inputFieldStyles, feedbackStyles } from '@core/utils/exerciseStyles';

// Usage
<div className={optionStyles({ variant: 'correct' })} />
<input className={inputFieldStyles({ state: 'error' })} />
```

### Available Functions

- `optionStyles(options)` - Styles for exercise options
- `inputFieldStyles(options)` - Styles for input fields
- `feedbackStyles(type)` - Styles for feedback messages
- `solutionStateStyles(state)` - Styles for solution display
- `hintButtonStyles(hasHints, used)` - Styles for hint buttons
- `getSolutionClasses(isCorrect, show)` - Get solution classes
- `getFeedbackClasses(type)` - Get feedback classes

---

## 3. New ExerciseFeedback Component

### What Changed

A new centralized `ExerciseFeedback` component replaces inline feedback in exercise components.

### Import Updates

**Before:**

```typescript
// Inline feedback implementation
{showSolution && (
  <div className="bg-green-100 border-2 border-green-400">
    Correct!
  </div>
)}
```

**After:**

```typescript
import { ExerciseFeedback } from '@core/components/exercises/ExerciseFeedback';

// Usage
<ExerciseFeedback
  correct={isCorrect}
  show={showSolution}
  message={customMessage}
/>
```

### Component Props

| Prop | Type | Description |
|------|------|-------------|
| `correct` | `boolean` | Whether the answer was correct |
| `show` | `boolean` | Whether to show the feedback |
| `message` | `string` | Optional custom message |
| `className` | `string` | Additional CSS classes |
| `onAnimationComplete` | `function` | Callback when animation ends |
| `animationDuration` | `number` | Animation duration in ms |

---

## 4. Decomposed ExercisePage

### What Changed

The monolithic `ExercisePage.tsx` has been decomposed into separate view components in `src/pages/exercise/`.

### New File Structure

```
src/pages/exercise/
├── ExerciseCompleteView.tsx    # Completion screen
├── ExerciseInProgressView.tsx  # Main exercise interaction
├── ExerciseLoadingState.tsx   # Loading indicator
├── NoExerciseView.tsx         # Empty state
└── index.ts                   # Re-exports
```

### Import Updates

**Before:**

```typescript
// Still works - ExercisePage.tsx re-exports views
import { ExerciseInProgressView } from '@/pages/ExercisePage';
```

**After:**

```typescript
import { 
  ExerciseCompleteView,
  ExerciseInProgressView,
  ExerciseLoadingState,
  NoExerciseView 
} from '@/pages/exercise';
```

---

## 5. useKeyboardNavigation Hook

### What Changed

New hook for keyboard navigation in exercise components.

### Import

```typescript
import { useKeyboardNavigation } from '@core/hooks/useKeyboardNavigation';

const { 
  getOptionProps, 
  handleKeyDown 
} = useKeyboardNavigation({
  options: items,
  onSelect: handleSelect,
  onNavigate: handleNavigate,
});
```

---

## 6. Consolidated Shuffle Functions

### What Changed

Shuffle functions are now consolidated in `src/core/utils/shuffle.ts`.

### Import Updates

**Before:**

```typescript
// Local shuffle implementation in components
function shuffle<T>(array: T[]): T[] {
  // ... local implementation
}
```

**After:**

```typescript
// Import from centralized module
import { shuffle, secureShuffle, shuffleInPlace } from '@core/utils/shuffle';
```

### Available Functions

- `shuffle<T>(array)` - Fisher-Yates shuffle
- `secureShuffle<T>(array)` - Cryptographically secure shuffle
- `shuffleInPlace<T>(array)` - Mutating shuffle
- `getRandomElement<T>(array)` - Get random element
- `getRandomElements<T>(array, count)` - Get multiple random elements
- `seededShuffle<T>(array, seed)` - Deterministic shuffle

---

## 7. Deprecated Hooks

### What Changed

The following hooks are deprecated and will be removed in a future version:

- `useTextInputExercise`
- `useMultipleChoiceExercise`
- `useOrderingExercise`

### Migration

These hooks are not used by any exercise component. Exercise components manage their own local state. If you were using these hooks, migrate to local state management:

**Before:**

```typescript
const { answer, setAnswer, submit } = useTextInputExercise(
  ['correct answer'],
  { onCorrect: handleCorrect }
);
```

**After:**

```typescript
const [answer, setAnswer] = useState('');
const isCorrect = answer.trim().toLowerCase() === 'correct answer';
```

---

## 8. Updated Store Structure

### What Changed

Stores have been split for better organization:

| Old | New |
|-----|-----|
| `childStore.ts` | `profileStore.ts` + `exerciseStore.ts` |

### Import Updates

```typescript
// Profile store
import { useProfileStore } from '@core/stores/profileStore';
import { useExerciseStore } from '@core/stores/exerciseStore';
import { useAppStore } from '@core/stores/appStore';
```

---

## Summary of Import Changes

| Category | Old Import | New Import |
|----------|------------|------------|
| Stars | `@core/utils/gamification` | `@core/utils/starCalculation` |
| Levels | `@core/utils/gamification` | `@core/utils/levelCalculation` |
| Streaks | `@core/utils/gamification` | `@core/utils/streakCalculation` |
| Exercise Styles | (none) | `@core/utils/exerciseStyles` |
| Feedback | inline | `@core/components/exercises/ExerciseFeedback` |
| Views | `@core/pages/ExercisePage` | `@core/pages/exercise` |
| Shuffle | local | `@core/utils/shuffle` |
| Keyboard Nav | (none) | `@core/hooks/useKeyboardNavigation` |

---

## Backward Compatibility

All old import paths still work due to re-exports in the main modules. However, we recommend migrating to the new import paths for:

1. Better tree-shaking (smaller bundle size)
2. More explicit dependencies
3. Future-proofing (deprecated items will be removed)

---

## Migration Checklist

- [ ] Update gamification imports to use new modules
- [ ] Replace inline styles with exerciseStyles utilities
- [ ] Update ExerciseFeedback imports
- [ ] Update page view imports
- [ ] Update shuffle function imports
- [ of deprecated hooks if applicable
- [ ] ] Remove usage Run tests to verify functionality
