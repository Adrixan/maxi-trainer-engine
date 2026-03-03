// Exercise hooks
export { useExerciseSession } from './useExerciseSession';
export type { UseExerciseSessionOptions, UseExerciseSessionReturn } from './useExerciseSession';

export { useExerciseScoring, getStarDisplay, calculateProgress, isLevelThresholdMet, getLevelFromStars } from './useExerciseScoring';
export { useFocusTrap, useFocusNavigation, useRovingTabIndex } from './useFocusTrap';
export type { UseFocusTrapOptions } from './useFocusTrap';

// Accessibility hooks
export { useAccessibility, usePrefersReducedMotion, usePrefersHighContrast } from './useAccessibility';
export type { UseAccessibilityReturn, SystemPreferences } from './useAccessibility';

// Navigation hooks
export { useKeyboardNavigation } from './useKeyboardNavigation';
export type { KeyboardNavigationOptions, KeyboardNavigationResult } from './useKeyboardNavigation';

// Gamification hooks
export {
    useGamification,
    useLevelProgress,
    useStreak,
    useBadges
} from './useGamification';
export type {
    ExerciseCompletionResult,
    GamificationState,
    GamificationActions,
    GamificationNotifications,
    UseGamificationReturn,
    UseGamificationOptions
} from './useGamification';

// Exercise page state hook
export { useExercisePageState, MAX_ATTEMPTS_PER_EXERCISE } from './useExercisePageState';
export type { UseExercisePageStateReturn } from './useExercisePageState';

// Sound effects hook
export { useSoundEffects } from './useSoundEffects';
export type { UseSoundEffectsReturn } from './useSoundEffects';
