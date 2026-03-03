/**
 * Custom hook for managing exercise sessions.
 * 
 * ⚠️ DEPRECATED - THIS HOOK IS NOT CURRENTLY USED
 * 
 * This hook was designed as a session-specific layer but has been
 * superseded by useExercisePageState which handles all orchestration.
 * 
 * Responsibilities (as originally designed):
 * - Session lifecycle management (start/end)
 * - Exercise state and progression
 * - Answer submission handling
 * - Navigation between exercises
 * 
 * Note: Gamification (stars, levels, badges) is handled by useGamification hook.
 * 
 * @deprecated Use useExercisePageState instead for all exercise page functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@core/router';
import { useExerciseStore } from '@core/stores';
import { useProfileStore } from '@core/stores/profileStore';
import { useAppStore } from '@core/stores/appStore';
import { playCorrect, playIncorrect } from '@core/utils/sounds';
import { saveExerciseResult } from '@core/storage';
import { selectCurrentExercise, selectProgress, selectIsSessionActive } from '@core/stores/exerciseStore';
import type { Exercise, ExerciseResult } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface UseExerciseSessionOptions {
    /** Exercises to use in the session */
    exercises: Exercise[];
    /** Theme ID for the session */
    themeId: string;
    /** Optional area ID for filtering */
    areaId?: string;
}

export interface UseExerciseSessionReturn {
    /** Current exercise being displayed */
    currentExercise: Exercise | null;
    /** Progress information */
    progress: { current: number; total: number };
    /** Whether the session is complete */
    isCompleted: boolean;
    /** Whether solution is being shown */
    showSolution: boolean;
    /** Whether user has answered current exercise */
    hasAnswered: boolean;
    /** Handle answer submission */
    handleSubmit: (correct: boolean) => void;
    /** Handle show solution */
    handleShowSolution: () => void;
    /** Handle next exercise */
    handleNext: () => void;
    /** Handle session finish */
    handleFinish: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing exercise sessions.
 * 
 * @example
 * ```tsx
 * const {
 *   currentExercise,
 *   progress,
 *   handleSubmit,
 *   handleNext,
 *   isCompleted,
 * } = useExerciseSession({ exercises, themeId });
 * ```
 */
export function useExerciseSession({
    exercises,
    themeId,
    areaId,
}: UseExerciseSessionOptions): UseExerciseSessionReturn {
    const navigate = useNavigate();

    // Exercise store actions and state
    const startSession = useExerciseStore((s) => s.startSession);
    const endSession = useExerciseStore((s) => s.endSession);
    const submitAnswer = useExerciseStore((s) => s.submitAnswer);
    const nextExercise = useExerciseStore((s) => s.nextExercise);
    const incrementAttempts = useExerciseStore((s) => s.incrementAttempts);
    const setShowSolution = useExerciseStore((s) => s.setShowSolution);
    const isSessionActive = useExerciseStore(selectIsSessionActive);
    const currentExercise = useExerciseStore(selectCurrentExercise);
    const progress = useExerciseStore(selectProgress);
    const showSolution = useExerciseStore((s) => s.showSolution);
    const isCompleted = useExerciseStore((s) => s.isCompleted);
    const answer = useExerciseStore((s) => s.answer);
    const currentThemeId = useExerciseStore((s) => s.themeId);
    const currentLevel = useExerciseStore((s) => s.currentExercise?.level);

    // Profile and app settings
    const activeProfile = useProfileStore((s) => s.activeProfile);
    const soundEnabled = useAppStore((s) => s.settings.soundEnabled);

    // Track answer state for current attempt
    const [hasAnswered, setHasAnswered] = useState(false);

    // Track level for session reset detection
    const levelRef = useRef<number | undefined>(undefined);

    // Start session when exercises are loaded
    // Reset session if level or theme changes
    useEffect(() => {
        if (exercises.length > 0) {
            // Check if we need to reset the session (level or theme changed)
            const levelChanged = currentLevel !== undefined && currentLevel !== levelRef.current;
            const themeChanged = currentThemeId !== null && currentThemeId !== themeId;

            if (levelChanged || themeChanged || !isSessionActive) {
                endSession();
                startSession(exercises, themeId, areaId);
                levelRef.current = currentLevel;
            }
        }
    }, [exercises, isSessionActive, startSession, endSession, themeId, areaId, currentLevel, currentThemeId]);

    // Handle answer submission
    const handleSubmit = useCallback((correct: boolean) => {
        incrementAttempts();

        // Play sound based on answer
        if (correct) {
            playCorrect(soundEnabled);
            submitAnswer(true);
            setHasAnswered(true);
        } else {
            playIncorrect(soundEnabled);
            // Allow retry if not correct
            submitAnswer(false);
            setHasAnswered(true);
        }
    }, [incrementAttempts, submitAnswer, soundEnabled]);

    // Handle next exercise - saves result to storage
    const handleNext = useCallback(() => {
        // Save exercise result to IndexedDB for progress tracking
        if (answer && activeProfile && currentExercise) {
            const attempts = answer.attempts;

            const exerciseResult: ExerciseResult = {
                id: `result-${currentExercise.id}-${Date.now()}`,
                childProfileId: activeProfile.id,
                exerciseId: currentExercise.id,
                areaId: currentExercise.areaId,
                themeId: currentExercise.themeId,
                level: currentExercise.level,
                correct: answer.correct,
                score: answer.correct ? (attempts === 1 ? 3 : attempts === 2 ? 2 : 1) : 0,
                attempts: attempts,
                timeSpentSeconds: answer.timeSpentSeconds,
                completedAt: new Date().toISOString(),
            };
            saveExerciseResult(exerciseResult).catch(() => { });
        }

        nextExercise();
        setHasAnswered(false);
        setShowSolution(false);
    }, [answer, activeProfile, currentExercise, nextExercise, setShowSolution]);

    // Handle show solution
    const handleShowSolution = useCallback(() => {
        setShowSolution(true);
    }, [setShowSolution]);

    // Handle session complete
    const handleFinish = useCallback(() => {
        // Navigate back to the level selection for this theme
        if (themeId) {
            navigate(ROUTES.LEVEL_SELECT(themeId));
        } else {
            navigate(ROUTES.HOME);
        }
    }, [navigate, themeId]);

    return {
        currentExercise,
        progress,
        isCompleted,
        showSolution,
        hasAnswered,
        handleSubmit,
        handleShowSolution,
        handleNext,
        handleFinish,
    };
}
