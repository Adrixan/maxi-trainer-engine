/**
 * Hook for managing ExercisePage state and logic.
 *
 * ⚠️ PRIMARY ORCHESTRATOR HOOK
 * 
 * This is the main hook used by ExercisePage. It orchestrates all exercise
 * session functionality including:
 * - URL parameter handling (themeId, areaId, level)
 * - Exercise filtering and selection
 * - Daily challenge deterministic selection
 * - Access control (level accessibility)
 * - Answer submission handling
 * - Exercise progression and session completion
 * - Gamification integration
 * - Keyboard navigation
 * 
 * IMPORTANT: This hook handles BOTH session flow AND orchestration.
 * The separate useExerciseSession hook exists but is NOT used.
 * 
 * Architecture:
 *   useExercisePageState → useGamification (profile mutations)
 *                         → exerciseStore (session state)
 *                         → IndexedDB (persistence)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ROUTES } from '@core/router';
import { useExercisesByTheme, useExercisesByArea, useExercises, useTheme, useThemes } from '@core/config';
import { useExerciseStore, selectCurrentExercise, selectProgress, selectIsSessionActive } from '@core/stores';
import { MAX_ATTEMPTS_PER_EXERCISE } from '@core/stores/exerciseStore';
import { useProfileStore, selectThemeLevels } from '@core/stores/profileStore';
import { useAppStore } from '@core/stores/appStore';
import { useGamification } from '@core/hooks/useGamification';
import { playCorrect, playIncorrect } from '@core/utils/sounds';
import { hasExerciseBeenCompleted, getExerciseResultsByTheme } from '@core/storage';
import { isLevelAccessible } from '@core/utils/gamification';
import type { Exercise } from '@/types';

// ============================================================================
// Daily Challenge Helper Functions
// ============================================================================

/**
 * Deterministic pseudo-random number generator based on seed.
 * Uses a simple linear congruential generator.
 */
function createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
        currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
        return currentSeed / 0x7fffffff;
    };
}

/**
 * Fisher-Yates shuffle using a seeded random number generator.
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        // Swap elements
        const temp = result[i]!;
        result[i] = result[j]!;
        result[j] = temp;
    }
    return result;
}

/**
 * Get exercises for the daily challenge using deterministic selection based on current date.
 * Returns exactly 5 exercises from different themes (or fewer if not enough available).
 * 
 * Algorithm:
 * 1. Use current date as seed for deterministic selection
 * 2. Group exercises by themeId
 * 3. Shuffle themes deterministically
 * 4. Select one random exercise from each of the first 5 themes
 */
function getDailyChallengeExercises(exercises: Exercise[]): Exercise[] {
    // Get current date as seed (year * 10000 + month * 100 + day)
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const random = createSeededRandom(dateSeed);

    // Group exercises by themeId
    const exercisesByTheme = new Map<string, Exercise[]>();
    for (const exercise of exercises) {
        const themeExercises = exercisesByTheme.get(exercise.themeId) || [];
        themeExercises.push(exercise);
        exercisesByTheme.set(exercise.themeId, themeExercises);
    }

    // Get all unique themes and shuffle them deterministically
    const themes = shuffleArray(Array.from(exercisesByTheme.keys()), random);

    // Select exercises from different themes
    const selectedExercises: Exercise[] = [];

    for (const theme of themes) {
        if (selectedExercises.length >= 5) break;

        const themeExercises = exercisesByTheme.get(theme);
        if (!themeExercises || themeExercises.length === 0) continue;

        // Shuffle exercises within this theme and pick the first one
        const shuffledExercises = shuffleArray(themeExercises, random);
        const firstExercise = shuffledExercises[0];
        if (firstExercise !== undefined) {
            selectedExercises.push(firstExercise);
        }
    }

    return selectedExercises;
}

// ============================================================================
// Types
// ============================================================================

export interface UseExercisePageStateReturn {
    // Exercise data
    exercises: Exercise[];
    theme: ReturnType<typeof useTheme>;
    themeId: string | undefined;
    areaId: string | undefined;
    level: string | undefined;

    // Session state
    currentExercise: Exercise | null;
    progress: { current: number; total: number };
    isCompleted: boolean;
    showSolution: boolean;
    levelFailed: boolean;
    hasAnswered: boolean;
    answer: ReturnType<typeof useExerciseStore.getState>['answer'];

    // Gamification
    notifications: ReturnType<typeof useGamification>['notifications'];
    dismissBadge: () => void;
    clearLevelUp: () => void;

    // Handlers
    handleSubmit: (correct: boolean) => void;
    handleNext: () => Promise<void>;
    handleShowSolution: () => void;
    handleRestartLevel: () => void;
    handleFinish: () => Promise<void>;
    handleBack: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useExercisePageState(): UseExercisePageStateReturn {
    const { themeId, areaId, level } = useParams<{ themeId: string; areaId?: string; level?: string }>();
    const navigate = useNavigate();

    // Get theme info for display
    const theme = useTheme(themeId ?? '');
    const allThemes = useThemes();

    // Get exercises based on theme/area filters
    const allExercises = useExercises();
    const exercisesByTheme = useExercisesByTheme(themeId ?? 'default');
    const exercisesByArea = useExercisesByArea(areaId ?? '');

    // Determine if this is the daily challenge
    const isDailyChallenge = themeId === 'daily';

    // Determine which exercises to use
    const baseExercises = useMemo(() => {
        if (isDailyChallenge) {
            // Get exercises from different themes using deterministic selection based on date
            return getDailyChallengeExercises(allExercises);
        }

        if (areaId) {
            return exercisesByArea;
        }

        if (themeId === 'default' || !themeId) {
            return allExercises;
        }

        return exercisesByTheme;
    }, [isDailyChallenge, allExercises, areaId, exercisesByArea, themeId, exercisesByTheme]);

    // Filter by level if specified
    const exercises: Exercise[] = level
        ? baseExercises.filter((e) => e.level === Number(level))
        : baseExercises;

    // Exercise store actions and state
    const startSession = useExerciseStore((s) => s.startSession);
    const endSession = useExerciseStore((s) => s.endSession);
    const submitAnswer = useExerciseStore((s) => s.submitAnswer);
    const nextExercise = useExerciseStore((s) => s.nextExercise);
    const incrementAttempts = useExerciseStore((s) => s.incrementAttempts);
    const setShowSolution = useExerciseStore((s) => s.setShowSolution);
    const restartLevel = useExerciseStore((s) => s.restartLevel);
    const isSessionActive = useExerciseStore(selectIsSessionActive);
    const currentExercise = useExerciseStore(selectCurrentExercise);
    const progress = useExerciseStore(selectProgress);
    const showSolution = useExerciseStore((s) => s.showSolution);
    const isCompleted = useExerciseStore((s) => s.isCompleted);
    const levelFailed = useExerciseStore((s) => s.levelFailed);
    const currentThemeId = useExerciseStore((s) => s.themeId);
    const currentLevel = useExerciseStore((s) => s.currentExercise?.level);
    const answer = useExerciseStore((s) => s.answer);

    // Profile and gamification
    const activeProfile = useProfileStore((s) => s.activeProfile);
    const themeLevels = useProfileStore(selectThemeLevels);
    const updateThemeLevel = useProfileStore((s) => s.updateThemeLevel);
    const soundEnabled = useAppStore((s) => s.settings.soundEnabled);
    const {
        processExerciseCompletion,
        notifications,
        dismissBadge,
        clearLevelUp
    } = useGamification();

    // Track answer state for current attempt
    const [hasAnswered, setHasAnswered] = useState(false);

    // Ref to prevent race conditions from rapid button clicks
    const isProcessingRef = useRef(false);

    // Access control: Check if user can access this level
    useEffect(() => {
        if (themeId && level && activeProfile) {
            const allThemeIds = allThemes.map(t => t.id);
            const numericLevel = Number(level);

            if (!isLevelAccessible(themeId, numericLevel, themeLevels, allThemeIds)) {
                navigate(ROUTES.LEVEL_SELECT(themeId));
            }
        }
    }, [themeId, level, activeProfile, themeLevels, allThemes, navigate]);

    // Start session when exercises are loaded
    useEffect(() => {
        if (exercises.length > 0) {
            const levelChanged = currentLevel !== undefined && currentLevel !== Number(level);
            const themeChanged = currentThemeId !== null && currentThemeId !== themeId;

            if (levelChanged || themeChanged || !isSessionActive) {
                endSession();
                startSession(exercises, themeId ?? 'default', areaId, activeProfile?.id);
            }
        }
    }, [exercises, isSessionActive, startSession, endSession, themeId, areaId, level, currentLevel, currentThemeId, activeProfile?.id]);

    // Handle answer submission
    const handleSubmit = useCallback((correct: boolean) => {
        incrementAttempts();

        if (correct) {
            playCorrect(soundEnabled);
            const result = submitAnswer(true);
            if (result.success) {
                setHasAnswered(true);
            }
        } else {
            playIncorrect(soundEnabled);
            const result = submitAnswer(false);
            if (result.success) {
                setHasAnswered(true);
            }
        }
    }, [incrementAttempts, submitAnswer, soundEnabled]);

    // Handle next exercise with gamification processing
    const handleNext = useCallback(async () => {
        if (isProcessingRef.current) {
            return;
        }
        isProcessingRef.current = true;

        try {
            const currentAnswer = useExerciseStore.getState().answer;

            if (currentAnswer && activeProfile && currentExercise) {
                const wasPreviouslyCompleted = await hasExerciseBeenCompleted(activeProfile.id, currentExercise.id);

                if (!wasPreviouslyCompleted && currentAnswer.correct) {
                    const attempts = currentAnswer.attempts;
                    // processExerciseCompletion handles all gamification updates internally:
                    // - adds stars to profile
                    // - increments streak
                    // - checks for level up and badges
                    // - updates notification state (earnedBadges, levelUpLevel)
                    // Return value intentionally ignored - notifications are accessed via hook state
                    processExerciseCompletion(attempts);
                }
            }

            nextExercise();
            setHasAnswered(false);
            setShowSolution(false);
        } finally {
            isProcessingRef.current = false;
        }
    }, [activeProfile, currentExercise, processExerciseCompletion, nextExercise, setShowSolution]);

    // Handle show solution
    const handleShowSolution = useCallback(() => {
        setShowSolution(true);
    }, [setShowSolution]);

    // Handle level restart when failed
    const handleRestartLevel = useCallback(() => {
        restartLevel();
        setHasAnswered(false);
    }, [restartLevel]);

    // Handle session complete
    const handleFinish = useCallback(async () => {
        if (isProcessingRef.current) {
            return;
        }
        isProcessingRef.current = true;

        try {
            const currentAnswer = useExerciseStore.getState().answer;

            if (currentAnswer && activeProfile && currentExercise) {
                const wasPreviouslyCompleted = await hasExerciseBeenCompleted(activeProfile.id, currentExercise.id);

                if (!wasPreviouslyCompleted && currentAnswer.correct) {
                    const attempts = currentAnswer.attempts;
                    // processExerciseCompletion handles all gamification updates internally
                    // Return value intentionally ignored - notifications are accessed via hook state
                    processExerciseCompletion(attempts);
                }

                // Check if all exercises in this level/theme are completed
                if (themeId && level && currentAnswer.correct) {
                    const numericLevel = Number(level);
                    try {
                        const results = await getExerciseResultsByTheme(themeId);
                        const correctExerciseIds = new Set(
                            results.filter(r => r.correct).map(r => r.exerciseId)
                        );

                        const levelExercises = exercises.filter(e => e.level === numericLevel);
                        const allLevelExercisesCompleted = levelExercises.every(e =>
                            correctExerciseIds.has(e.id) || e.id === currentExercise.id
                        );

                        if (allLevelExercisesCompleted && levelExercises.length > 0) {
                            updateThemeLevel(themeId, numericLevel);
                        }
                    } catch {
                        // Log error but don't block user from finishing
                        // Level completion will be recalculated on next session
                        // Silently ignore
                    }
                }
            }

            await endSession();

            // Navigate to theme selection page after completing a level
            navigate(ROUTES.THEMES);
        } finally {
            isProcessingRef.current = false;
        }
    }, [activeProfile, currentExercise, processExerciseCompletion, navigate, themeId, level, exercises, updateThemeLevel, endSession]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        if (themeId) {
            navigate(ROUTES.LEVEL_SELECT(themeId));
        } else {
            navigate(ROUTES.HOME);
        }
    }, [navigate, themeId]);

    // Handle keyboard navigation for next/finish
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Enter' && (showSolution || isCompleted)) {
                event.preventDefault();
                if (progress.current < progress.total) {
                    handleNext();
                } else {
                    handleFinish();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSolution, isCompleted, progress.current, progress.total, handleNext, handleFinish]);

    return {
        // Exercise data
        exercises,
        theme,
        themeId,
        areaId,
        level,

        // Session state
        currentExercise,
        progress,
        isCompleted,
        showSolution,
        levelFailed,
        hasAnswered,
        answer,

        // Gamification
        notifications,
        dismissBadge,
        clearLevelUp,

        // Handlers
        handleSubmit,
        handleNext,
        handleShowSolution,
        handleRestartLevel,
        handleFinish,
        handleBack,
    };
}

// Re-export MAX_ATTEMPTS_PER_EXERCISE for use in components
export { MAX_ATTEMPTS_PER_EXERCISE };
