# Hook Architecture Analysis (T3.1)

## Overview

This document analyzes the current hook architecture in the Mini Trainer Engine and identifies areas of duplication, confusion, and proposed responsibility boundaries.

---

## Current Hook Inventory

### 1. `useExercisePageState.ts` (Lines 1-414)

**Status**: ACTIVE - Used by `ExercisePage.tsx`

**Current Responsibilities**:

- URL parameter management (themeId, areaId, level)
- Exercise filtering (by theme, area, level)
- Daily challenge deterministic selection
- Access control (level accessibility)
- **Answer submission** (`handleSubmit`)
- **Exercise progression** (`handleNext`)
- **Session completion** (`handleFinish`)
- Gamification integration (calls `processExerciseCompletion`)
- Keyboard navigation handling

**Issues**:

- Duplicate `handleSubmit` with `useExerciseSession`
- Has its own `hasAnswered` state (line 208)
- Imports and calls sound functions directly instead of using `useSoundEffects`

---

### 2. `useExerciseSession.ts` (Lines 1-197)

**Status**: ORPHANED - NOT imported by any page component

**Current Responsibilities**:

- Session lifecycle management
- Answer submission (`handleSubmit`)
- Exercise progression (`handleNext`) - saves to IndexedDB
- Session navigation (`handleFinish`)
- Sound effect playback

**Issues**:

- **Not used** - ExercisePage only imports `useExercisePageState`
- Duplicate `handleSubmit` with nearly identical logic
- Duplicate `hasAnswered` state (line 106)
- Duplicates sound playback logic

---

### 3. `useGamification.ts` (Lines 1-416)

**Status**: ACTIVE - Imported by `useExercisePageState`

**Current Responsibilities**:

- Stars calculation and tracking
- Level progression
- Badge checking and earning
- Streak management
- Notification state management
- `processExerciseCompletion()` - primary method for profile mutations

**Issues**:

- Well-designed but tightly coupled to useExercisePageState
- Uses `useProfileStore.getState()` inside callbacks (workaround for stale closures)

---

### 4. `useExerciseScoring.ts` (Lines 1-200)

**Status**: ACTIVE - Used in tests

**Current Responsibilities**:

- Pure statistics calculation from `ExerciseResult[]`
- Computes: accuracy, average attempts, average time, grouped stats by type/area/level

**Issues**:

- Not integrated into the main flow - appears to be a utility hook
- No page or component currently uses this hook

---

### 5. `useSoundEffects.ts` (Lines 1-102)

**Status**: INACTIVE - NOT used by ExercisePage or related hooks

**Current Responsibilities**:

- Centralized wrapper for sound functions
- Integrates with appStore for sound enabled setting

**Issues**:

- **Not used** - Both useExercisePageState and useExerciseSession directly import `playCorrect`, `playIncorrect` from `@core/utils/sounds`
- Should be the single source for sound effects

---

### 6. `exerciseStore.ts` (Lines 1-467)

**Status**: ACTIVE - Core state management

**Current Responsibilities**:

- Exercise queue management
- Current exercise tracking
- Answer state management
- Session statistics
- Results persistence to IndexedDB
- **Time tracking** via `recordTime(seconds)`

**Issues**:

- **`recordTime()` is never called** - Time tracking is defined but not implemented
- `handleNext` in useExerciseSession manually constructs results instead of using the store's built-in persistence

---

## Identified Issues Summary

### Issue 1: Duplicate Answer Submission Logic

**Files**: `useExercisePageState.ts` (line 239-255), `useExerciseSession.ts` (line 128-142)

Both implement `handleSubmit` with nearly identical logic:

```typescript
// useExercisePageState
const handleSubmit = useCallback((correct: boolean) => {
    incrementAttempts();
    if (correct) {
        playCorrect(soundEnabled);
        submitAnswer(true);
        setHasAnswered(true);
    } else {
        playIncorrect(soundEnabled);
        submitAnswer(false);
        setHasAnswered(true);
    }
}, [incrementAttempts, submitAnswer, soundEnabled]);

// useExerciseSession (nearly identical)
const handleSubmit = useCallback((correct: boolean) => {
    incrementAttempts();
    if (correct) {
        playCorrect(soundEnabled);
        submitAnswer(true);
        setHasAnswered(true);
    } else {
        playIncorrect(soundEnabled);
        submitAnswer(false);
        setHasAnswered(true);
    }
}, [incrementAttempts, submitAnswer, soundEnabled]);
```

---

### Issue 2: Gamification Processing Location

**Current State**:

- `useExercisePageState` calls `processExerciseCompletion` in `handleNext` and `handleFinish`
- `useGamification` handles all profile mutations

**Problem**: The orchestrator hook (useExercisePageState) directly triggers profile changes. This should be more explicit in the architecture.

---

### Issue 3: Session State Duplication

**Duplicated**:

- `hasAnswered` state exists in both hooks:
  - `useExercisePageState.ts` line 208: `const [hasAnswered, setHasAnswered] = useState(false);`
  - `useExerciseSession.ts` line 106: `const [hasAnswered, setHasAnswered] = useState(false);`

- Both hooks manage session lifecycle independently

---

### Issue 4: Sound Effects Scattered

**Problem**:

- `useSoundEffects.ts` hook exists but is **NOT used**
- `useExercisePageState.ts` line 16 imports directly: `import { playCorrect, playIncorrect } from '@core/utils/sounds';`
- `useExerciseSession.ts` line 21 imports directly: `import { playCorrect, playIncorrect } from '@core/utils/sounds';`

---

### Issue 5: useExerciseSession is Orphaned

**Evidence**:

- `src/pages/ExercisePage.tsx` line 8: `import { useExercisePageState } from '@core/hooks';`
- `src/hooks/index.ts` exports both but only `useExercisePageState` is used

**Conclusion**: `useExerciseSession` appears to be legacy code or an alternative implementation that was superseded by `useExercisePageState`.

---

### Issue 6: Time Tracking Not Implemented

**Evidence**:

- `exerciseStore.ts` line 317-325 defines `recordTime(seconds)`
- No search results found for `recordTime(` being called anywhere in the codebase
- `timeSpentSeconds` in results comes from `answer.timeSpentSeconds` which is initialized to 0

**Conclusion**: Time tracking is defined but never actually recorded during exercise sessions.

---

### Issue 7: useExerciseScoring Not Integrated

**Evidence**:

- No page or component imports `useExerciseScoring`
- Only used in test files

**Conclusion**: Statistics calculation hook exists but is not part of the main application flow.

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ExercisePage                                 │
│                    (Page Component)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    useExercisePageState                             │
│                  (ORCHESTRATOR - ACTIVE)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Responsibilities:                                            │  │
│  │  - URL parameter handling                                    │  │
│  │  - Exercise filtering/selection                               │  │
│  │  - Daily challenge logic                                      │  │
│  │  - Access control                                              │  │
│  │  - Keyboard navigation                                        │  │
│  │  - DELEGATES to other hooks:                                  │  │
│  │    → useExerciseSession for flow                              │  │
│  │    → useGamification for profile updates                      │  │
│  │    → useSoundEffects for audio                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│    useExerciseSession    │   │       useGamification             │
│   (SESSION FLOW)         │   │     (PROFILE MUTATIONS)           │
│  ┌────────────────────┐  │   │  ┌────────────────────────────┐  │
│  │ Responsibilities:  │  │   │  │ Responsibilities:          │  │
│  │ - Session lifecycle │  │   │  │ - Stars calculation        │  │
│  │ - Exercise queue    │  │   │  │ - Level progression       │  │
│  │ - Answer submission │  │   │  │ - Badge checking           │  │
│  │ - Navigation        │  │   │  │ - Streak management        │  │
│  │ - Results to DB     │  │   │  │ - Notification state       │  │
│  └────────────────────┘  │   │  └────────────────────────────┘  │
└──────────────────────────┘   └──────────────────────────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│     exerciseStore        │   │       useSoundEffects            │
│    (Zustand Store)       │   │     (WRAPPER - INACTIVE)         │
│  ┌────────────────────┐  │   │  ┌────────────────────────────┐  │
│  │ Responsibilities:  │  │   │  │ Responsibilities:         │  │
│  │ - Exercise queue   │  │   │  │ - Sound playback           │  │
│  │ - Answer state    │  │   │  │ - Sound enabled setting    │  │
│  │ - Session stats   │  │   │  └────────────────────────────┘  │
│  │ - Results to DB   │◄─┼───┼──┘ (Should be used everywhere)    │
│  │ - Time tracking   │  │   │                                   │
│  │   (NOT IMPL)     │  │   │   ┌────────────────────────────┐  │
│  └────────────────────┘  │   │  │ useExerciseScoring         │
└──────────────────────────┘   │  │   (UTILITY - INACTIVE)      │
           │                    │  │  ┌────────────────────────┐  │
           ▼                    │  │  │ Responsibilities:     │  │
┌──────────────────────────┐   │  │  │ - Statistics calc     │  │
│      IndexedDB           │◄──┼───┼──│ - Report generation   │  │
│   (Persistence)         │   │  │  └────────────────────────┘  │
└──────────────────────────┘   │  │ (Should be used in results)   │
                               │  └──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────────────────┐
                    │         profileStore             │
                    │     (Profile Persistence)         │
                    └──────────────────────────────────┘
```

---

## Recommended Actions

### Phase 1: Cleanup (Before Refactoring)

1. **Remove or deprecate `useExerciseSession`**
   - It's not used and duplicates `useExercisePageState`
   - Option A: Delete entirely
   - Option B: Mark as deprecated and remove from exports

2. **Activate `useSoundEffects`**
   - Update `useExercisePageState` to use `useSoundEffects` hook
   - Remove direct imports of `playCorrect`, `playIncorrect`

3. **Implement time tracking**
   - Add a timer in `useExercisePageState` that calls `recordTime()` periodically
   - Or add to exercise component lifecycle

### Phase 2: Architectural Improvements

4. **Refactor `useExercisePageState`**
   - Extract session-specific logic to use `exerciseStore` actions
   - Make it a true orchestrator that delegates

2. **Activate `useExerciseScoring`**
   - Integrate into session results view
   - Use for progress/statistics display

### Phase 3: Documentation

6. **Update hook comments**
   - Add clear responsibility declarations to each hook
   - Document the data flow and delegation pattern

---

## Responsibility Boundaries (Proposed)

| Hook | Responsibility | Public API |
|------|---------------|------------|
| `useExercisePageState` | Orchestration, routing, filtering | All handlers, exercise data |
| `useExerciseSession` | (Deprecated) | N/A |
| `useGamification` | Profile mutations, achievements | `processExerciseCompletion`, notifications |
| `useSoundEffects` | Audio feedback | `playCorrect`, `playIncorrect`, etc. |
| `useExerciseScoring` | Statistics calculation | `useExerciseScoring(results)` |
| `exerciseStore` | Session state, persistence | Actions: `startSession`, `submitAnswer`, etc. |

---

## Notes

- The target architecture from the Master Plan (Phase 3) shows:

  ```
  ExercisePage → useExercisePageState (Orchestrator)
                      ↓
                useExerciseSession (Session flow)
                      ↓
                useGamification (Profile mutations)
                      ↓
                IndexedDB (Result persistence)
  ```
  
- This aligns with current implementation where `useExercisePageState` orchestrates everything, but the "Session flow" layer (`useExerciseSession`) is orphaned.

- The most practical path forward is to simplify by removing `useExerciseSession` and keeping `useExercisePageState` as the single orchestrator.
