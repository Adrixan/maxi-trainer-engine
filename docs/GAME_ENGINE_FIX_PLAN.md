# Game Engine Logic Fix Plan

This document outlines the detailed fix plan for 10 bugs/logic errors identified in the Mini Trainer Engine's game engine logic.

---

## Executive Summary

| Issue # | Severity | Title | Status | Files Affected |
|---------|----------|-------|--------|----------------|
| 1 | Critical | Double Star Awarding | ✅ FIXED | `useGamification.ts`, `exerciseStore.ts` |
| 2 | High | Inconsistent Star Calculations | ✅ FIXED | `gamification.ts`, `useExerciseScoring.ts`, `exerciseStore.ts`, `useExerciseLogic.ts` |
| 3 | High | Missing Exercise Deduplication | ✅ FIXED | `exerciseStore.ts` |
| 4 | Medium | Stale Profile Reference | ✅ FIXED | `useGamification.ts` |
| 5 | Medium | Race Condition in Badge Checking | ✅ FIXED | `useGamification.ts` |
| 6 | Medium | Unused Global Level Calculation | ✅ FIXED | `gamification.ts`, `profileStore.ts` |
| 7 | Low | Missing Star Count Validation | ✅ FIXED | `profileStore.ts` |
| 8 | Low | Area Star Tracking Not Implemented | ✅ FIXED | `useGamification.ts` |
| 9 | Low | Session Results Not Persisted | ✅ FIXED | `exerciseStore.ts` |
| 10 | Low | Arbitrary Default Stars | ✅ FIXED | `useGamification.ts` |

> **📝 NOTE**: Issue #6 (`calculateGlobalLevel`) was originally marked as "unused" but was found to be in **active use** - imported and utilized by `ThemeSelectPage`, `HomePage`, and `LevelSelectPage`. This issue is now considered resolved as the function is properly integrated.

---

## Document Status

**This document is RESOLVED** - All 10 game engine bugs have been fixed as of 2026-02-23.

---

## Issue #1: Double Star Awarding (Critical)

### Problem

Stars are calculated and awarded in two places:

1. `useGamification.processExerciseCompletion()` calls `addStars(starsEarned)`
2. `exerciseStore.submitAnswer()` calculates stars and stores in `results[]`

This can lead to stars being counted twice - once in `profile.totalStars` and again in session results.

### Analysis

The current architecture has two separate systems:

- **exerciseStore**: Manages session state, calculates stars per exercise, stores results
- **useGamification**: Hook for components, also calculates stars and updates profile

The intended flow appears to be:

1. Exercise component calls `exerciseStore.submitAnswer()`
2. Results are stored in session
3. At session end, `useGamification.processExerciseCompletion()` is called for each result

But this means stars are added twice!

### Fix Strategy

**Option A (Recommended)**: Single source of truth in exerciseStore

- Remove `addStars()` call from `useGamification.processExerciseCompletion()`
- Have `processExerciseCompletion()` read stars from the result passed to it
- Add a new parameter: `processExerciseCompletion(result: ExerciseResult)`

**Option B**: Single source of truth in useGamification

- Remove star calculation from `exerciseStore`
- Have exerciseStore only track correct/incorrect
- useGamification calculates and awards stars

### Implementation (Option A)

**File: `src/core/hooks/useGamification.ts`**

```typescript
// BEFORE
processExerciseCompletion: (attempts: number) => ExerciseCompletionResult

// AFTER
processExerciseCompletion: (result: ExerciseResult) => ExerciseCompletionResult
```

Changes:

1. Change parameter from `attempts: number` to `result: ExerciseResult`
2. Read `starsEarned` from result instead of calculating
3. Remove `addStars()` call - stars already counted in exerciseStore
4. Update return type to use result data

**File: `src/core/stores/exerciseStore.ts`**

1. Ensure `submitAnswer()` properly updates profile stars
2. Add call to `profileStore.getState().addStars(stars)`

### Test Updates Required

- `useGamification.test.ts`: Update mock calls to pass ExerciseResult
- Add test for double-award prevention

---

## Issue #2: Inconsistent Star Calculation Functions (High)

### Problem

Four different star calculation functions with different behaviors:

| Location | Returns 0? | Returns 1-3? |
|----------|------------|--------------|
| `gamification.ts:calculateStars()` | No | Yes |
| `useExerciseScoring.ts:calculateStarRating()` | No | Yes |
| `exerciseStore.ts:calculateStars()` | Yes (attempts > 3) | Yes |
| `useExerciseLogic.ts:calculateStarsFromAttempts()` | No | Yes |

### Fix Strategy

1. Consolidate to single function in `gamification.ts`
2. Add parameter for `maxAttempts` to handle 0-star case
3. Export from `gamification.ts` and import elsewhere
4. Remove duplicate functions

### Implementation

**File: `src/core/utils/gamification.ts`**

```typescript
/**
 * Calculate star rating from number of attempts.
 * 
 * @param attempts - Number of attempts made
 * @param maxAttempts - Maximum allowed attempts (default: 3)
 * @returns Star rating (0-3), where 0 means exceeded max attempts
 */
export function calculateStars(attempts: number, maxAttempts: number = 3): StarRating {
    if (attempts > maxAttempts) return 0;
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    return 1;
}
```

**File: `src/core/stores/exerciseStore.ts`**

- Remove local `calculateStars()` function
- Import from `gamification.ts`

**File: `src/core/hooks/useExerciseScoring.ts`**

- Remove `calculateStarRating()` function
- Import `calculateStars` from `gamification.ts`

**File: `src/core/hooks/useExerciseLogic.ts`**

- Remove `calculateStarsFromAttempts()` function
- Import `calculateStars` from `gamification.ts`

### Test Updates Required

- Update all tests that mock star calculation
- Add edge case tests for `attempts > maxAttempts`

---

## Issue #3: Missing Exercise Deduplication (High)

### Problem

`exerciseStore.submitAnswer()` creates a new `ExerciseResult` every time without checking if the exercise was already completed.

### Fix Strategy

Track completed exercise IDs in the session state.

### Implementation

**File: `src/core/stores/exerciseStore.ts`**

1. Add to state:

```typescript
interface ExerciseSessionState {
    // ... existing fields
    completedExerciseIds: Set<string>;
}
```

1. Update `submitAnswer()`:

```typescript
submitAnswer: (correct) => {
    const state = get();
    if (!state.currentExercise) return;
    
    // Check for duplicate
    if (state.completedExerciseIds.has(state.currentExercise.id)) {
        console.warn('Exercise already completed, skipping duplicate result');
        return;
    }
    
    // ... existing logic ...
    
    if (correct) {
        // Add to completed set
        const newCompletedIds = new Set(state.completedExerciseIds);
        newCompletedIds.add(state.currentExercise.id);
        
        set({
            // ... existing updates
            completedExerciseIds: newCompletedIds,
        });
    }
}
```

1. Update `startSession()` and `restartLevel()` to reset the set:

```typescript
completedExerciseIds: new Set<string>(),
```

### Test Updates Required

- Add test for duplicate submission prevention

---

## Issue #4: Stale Profile Reference (Medium)

### Problem

`useGamification.processExerciseCompletion()` captures `activeProfile` in closure, which becomes stale after `addStars()` updates the store.

### Fix Strategy

Get fresh state inside the callback using `useProfileStore.getState()`.

### Implementation

**File: `src/core/hooks/useGamification.ts`**

```typescript
processExerciseCompletion: useCallback((attempts: number) => {
    // Get fresh profile state
    const currentProfile = useProfileStore.getState().activeProfile;
    
    if (!currentProfile) {
        return {
            starsEarned: 0 as StarRating,
            leveledUp: false,
            newLevel: undefined,
            newBadges: [],
            streakUpdate: null,
        };
    }
    
    // Use currentProfile instead of activeProfile from closure
    const starsEarned = calculateStars(attempts);
    const prevLevel = calculateLevel(currentProfile.totalStars, starsPerLevel);
    // ... rest of logic using currentProfile
}, [starsPerLevel, badgeDefinitions]), // Remove addStars, incrementStreak, earnBadge from deps
```

### Test Updates Required

- Update test mocks to work with `getState()` pattern

---

## Issue #5: Race Condition in Badge Checking (Medium)

### Problem

Badge checking uses a locally constructed `updatedProfile` object that may not reflect actual store state.

### Fix Strategy

Read fresh profile state after all updates before checking badges.

### Implementation

**File: `src/core/hooks/useGamification.ts`**

```typescript
processExerciseCompletion: useCallback((attempts: number) => {
    const currentProfile = useProfileStore.getState().activeProfile;
    if (!currentProfile) { /* ... */ }
    
    // Calculate and add stars
    const starsEarned = calculateStars(attempts);
    useProfileStore.getState().addStars(starsEarned);
    
    // Update streak
    useProfileStore.getState().incrementStreak();
    
    // Get FRESH profile after updates
    const updatedProfile = useProfileStore.getState().activeProfile;
    if (!updatedProfile) { /* ... */ }
    
    // Now check badges with fresh data
    const newBadges = checkAllBadges(updatedProfile, badgeDefinitions);
    
    for (const badge of newBadges) {
        useProfileStore.getState().earnBadge(badge);
    }
    
    return { /* ... */ };
}, [starsPerLevel, badgeDefinitions]),
```

---

## Issue #6: Unused Global Level Calculation (Medium)

### Problem

`calculateGlobalLevel()` exists in `gamification.ts` but is never called. Area levels are updated independently.

### Fix Strategy

Either:

- **Option A**: Remove the unused function
- **Option B**: Integrate it into the level system

### Implementation (Option B - Integrate)

**File: `src/core/stores/profileStore.ts`**
Add a computed/derived value or selector:

```typescript
// Add selector
export const selectGlobalLevel = (allThemeIds: string[]) => (state: ProfileState) => {
    if (!state.activeProfile) return 1;
    return calculateGlobalLevel(state.activeProfile.themeLevels, allThemeIds);
};
```

**File: `src/core/hooks/useGamification.ts`**
Use the global level in state:

```typescript
const globalLevel = useMemo(() => {
    if (!activeProfile) return 1;
    return calculateGlobalLevel(activeProfile.themeLevels, allThemeIds);
}, [activeProfile, allThemeIds]);
```

---

## Issue #7: Missing Star Count Validation (Low)

### Problem

`addStars()` doesn't validate that count is positive.

### Implementation

**File: `src/core/stores/profileStore.ts`**

```typescript
addStars: (count) =>
    set((state) => {
        if (!state.activeProfile) return state;
        // Validate count
        if (count <= 0) {
            console.warn('addStars called with non-positive count:', count);
            return state;
        }
        return {
            activeProfile: {
                ...state.activeProfile,
                totalStars: state.activeProfile.totalStars + count,
            },
        };
    }),
```

---

## Issue #8: Area Star Tracking Not Implemented (Low)

### Problem

`getAreaStars()` ignores the `areaId` parameter.

### Implementation

**File: `src/core/hooks/useGamification.ts`**

```typescript
getAreaStars: useCallback((areaId: string): number => {
    if (!activeProfile) return 0;
    
    // Filter themes by area - need area-to-theme mapping
    // This requires additional data structure or configuration
    // For now, document the limitation
    
    // TODO: Implement area filtering when area-to-theme mapping is available
    // For now, sum all theme progress stars
    let areaStars = 0;
    for (const [themeId, progress] of Object.entries(activeProfile.themeProgress)) {
        // Check if theme belongs to area (requires mapping)
        // if (themeToAreaMap[themeId] === areaId) {
        //     areaStars += progress.starsEarned;
        // }
        areaStars += progress.starsEarned;
    }
    return areaStars;
}, [activeProfile]),
```

**Alternative**: Remove the function if not needed, or add proper area-to-theme mapping.

---

## Issue #9: Session Results Not Persisted (Low)

### Problem

`endSession()` clears results without persisting to IndexedDB.

### Implementation

**File: `src/core/stores/exerciseStore.ts`**

```typescript
import { saveExerciseResult } from '@core/storage';

endSession: async () => {
    const state = get();
    
    // Persist results before clearing
    if (state.results.length > 0) {
        for (const result of state.results) {
            await saveExerciseResult(result);
        }
    }
    
    set({
        // ... existing clear logic
    });
},
```

**Note**: This requires changing `endSession` to async function.

---

## Issue #10: Arbitrary Default Stars (Low)

### Problem

Returns 1 star when no profile exists.

### Implementation

**File: `src/core/hooks/useGamification.ts`**

```typescript
if (!activeProfile) {
    return {
        starsEarned: 0 as StarRating,  // Changed from 1
        leveledUp: false,
        newLevel: undefined,
        newBadges: [],
        streakUpdate: null,
    };
}
```

---

## Implementation Order

1. **Issue #2** - Consolidate star calculations first (foundational)
2. **Issue #1** - Fix double star awarding (depends on #2)
3. **Issue #3** - Add deduplication (independent)
4. **Issue #4** - Fix stale reference (independent)
5. **Issue #5** - Fix race condition (depends on #4)
6. **Issue #7** - Add validation (independent, quick)
7. **Issue #10** - Fix default stars (independent, quick)
8. **Issue #9** - Persist results (independent)
9. **Issue #6** - Connect global level (optional enhancement)
10. **Issue #8** - Area star tracking (optional enhancement)

---

## Testing Strategy

After each fix:

1. Run existing tests: `npm test`
2. Run specific test file: `npm test -- <file>`
3. Add new tests for fixed behavior

Final validation:

1. Run full test suite
2. Manual testing of exercise completion flow
3. Verify no double-awarding in console logs
4. Check IndexedDB for persisted results

---

## Rollback Plan

Each fix should be committed separately. If issues arise:

1. Revert specific commit
2. Other fixes remain in place
3. Re-implement with different approach

---

## Estimated Effort

| Issue | Complexity | Time Est. |
|-------|------------|-----------|
| #1 | High | 2 hours |
| #2 | Medium | 1 hour |
| #3 | Medium | 1 hour |
| #4 | Medium | 30 min |
| #5 | Medium | 30 min |
| #6 | Low | 30 min |
| #7 | Low | 15 min |
| #8 | Low | 30 min |
| #9 | Low | 30 min |
| #10 | Low | 5 min |

**Total**: ~6-7 hours

---

## Approval

- [x] Fix plan reviewed and approved
- [x] Implementation order confirmed
- [x] Ready to proceed with fixes

---

## Implementation Status

All 10 issues have been implemented:

| Issue # | Status | Notes |
|---------|--------|-------|
| #1 | ✅ Complete | Stars only added via `useGamification.processExerciseCompletion()`. `exerciseStore` tracks for session stats only. |
| #2 | ✅ Complete | Single `calculateStars()` function in `gamification.ts`, re-exported from other modules. |
| #3 | ✅ Complete | `completedExerciseIds: Set<string>` tracks completed exercises in session. |
| #4 | ✅ Complete | Uses `useProfileStore.getState().activeProfile` for fresh state. |
| #5 | ✅ Complete | Gets fresh profile after updates before badge checking. |
| #6 | ✅ Complete | `calculateGlobalLevel()` used in `HomePage`, `ThemeSelectPage`, `LevelSelectPage`. |
| #7 | ✅ Complete | `addStars()` validates `count > 0` before updating. |
| #8 | ✅ Complete | `getAreaStars()` is async, reads from IndexedDB via `getExerciseResultsByArea()`. |
| #9 | ✅ Complete | `endSession()` is async, persists results to IndexedDB before clearing. |
| #10 | ✅ Complete | Returns 0 stars when no profile (was returning 1). |

**Implementation Date**: 2026-02-23
