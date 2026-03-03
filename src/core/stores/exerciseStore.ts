/**
 * Exercise session store for the Mini Trainer Engine.
 * 
 * Manages the current exercise session state including
 * the current exercise, answers, and session progress.
 * 
 * Architecture:
 *   - exerciseStore: Session state, answer tracking, stats aggregation
 *   - useExercisePageState: Orchestrator that uses this store
 *   - IndexedDB: Persists results via saveExerciseResult
 * 
 * ⚠️ KNOWN ISSUE: recordTime() is defined but never called.
 * Time tracking needs to be implemented in useExercisePageState.
 */

import { create } from 'zustand';
import { calculateStars } from '@core/utils/gamification';
import { saveExerciseResult } from '@core/storage';
import type {
    Exercise,
    ExerciseResult,
    StarRating,
    Score,
    ObservationAreaId,
    ThemeId,
} from '@/types';

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum number of attempts allowed per exercise.
 */
export const MAX_ATTEMPTS_PER_EXERCISE = 3;

// ============================================================================
// Types
// ============================================================================

/**
 * Exercise answer state.
 */
export interface ExerciseAnswer {
    /** Whether the answer is correct */
    correct: boolean;
    /** Number of attempts made */
    attempts: number;
    /** Time spent in seconds */
    timeSpentSeconds: number;
    /** Star rating earned (0-3) */
    stars: Score;
}

/**
 * Session statistics.
 */
export interface SessionStats {
    /** Number of exercises completed */
    exercisesCompleted: number;
    /** Number of correct answers */
    correctAnswers: number;
    /** Total stars earned */
    totalStars: number;
    /** Total time spent in seconds */
    totalTimeSeconds: number;
}

/**
 * Result of a submit answer operation.
 */
export interface SubmitAnswerResult {
    /** Whether the submission was successful */
    success: boolean;
    /** Reason for failure if success is false */
    reason?: 'duplicate' | 'no_exercise';
}

/**
 * Exercise session state interface.
 */

/**
 * Exercise session state interface.
 */
export interface ExerciseSessionState {
    /** Current exercise being displayed */
    currentExercise: Exercise | null;
    /** Index of current exercise in the session */
    currentIndex: number;
    /** Total number of exercises in the session */
    totalExercises: number;
    /** Queue of exercises for this session */
    exerciseQueue: Exercise[];
    /** Current answer state */
    answer: ExerciseAnswer | null;
    /** Whether the current exercise is completed */
    isCompleted: boolean;
    /** Whether to show the solution */
    showSolution: boolean;
    /** Whether the level has been failed (max attempts reached) */
    levelFailed: boolean;
    /** Session statistics */
    stats: SessionStats;
    /** Results for completed exercises */
    results: ExerciseResult[];
    /** Session start time */
    sessionStartTime: number | null;
    /** Current theme ID */
    themeId: ThemeId | null;
    /** Current area ID (optional) */
    areaId: ObservationAreaId | null;
    /** Set of completed exercise IDs for deduplication (Issue #3) */
    completedExerciseIds: Set<string>;
    /** Current child profile ID for persisting results */
    childProfileId: string | null;

    // Actions
    /** Initialize a new session with exercises */
    startSession: (exercises: Exercise[], themeId: ThemeId, areaId?: ObservationAreaId, childProfileId?: string) => void;
    /** Move to the next exercise */
    nextExercise: () => void;
    /** Submit an answer, returns result indicating success/failure */
    submitAnswer: (correct: boolean) => SubmitAnswerResult;
    /** Increment attempts */
    incrementAttempts: () => void;
    /** Show the solution */
    setShowSolution: (show: boolean) => void;
    /** Record time spent */
    recordTime: (seconds: number) => void;
    /** End the session and persist results to IndexedDB */
    endSession: () => Promise<void>;
    /** Reset the current exercise */
    resetCurrentExercise: () => void;
    /** Restart the level from the first exercise */
    restartLevel: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a unique ID for exercise results.
 */
function generateResultId(): string {
    return `result-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// Store
// ============================================================================

/**
 * Exercise session store.
 * 
 * Manages the state of an active exercise session.
 */
export const useExerciseStore = create<ExerciseSessionState>()((set, get) => ({
    currentExercise: null,
    currentIndex: 0,
    totalExercises: 0,
    exerciseQueue: [],
    answer: null,
    isCompleted: false,
    showSolution: false,
    levelFailed: false,
    stats: {
        exercisesCompleted: 0,
        correctAnswers: 0,
        totalStars: 0,
        totalTimeSeconds: 0,
    },
    results: [],
    sessionStartTime: null,
    themeId: null,
    areaId: null,
    completedExerciseIds: new Set<string>(),
    childProfileId: null,

    startSession: (exercises, themeId, areaId, childProfileId) => {
        if (exercises.length === 0) return;

        set({
            currentExercise: exercises[0] ?? null,
            currentIndex: 0,
            totalExercises: exercises.length,
            exerciseQueue: exercises,
            answer: null,
            isCompleted: false,
            showSolution: false,
            levelFailed: false,
            stats: {
                exercisesCompleted: 0,
                correctAnswers: 0,
                totalStars: 0,
                totalTimeSeconds: 0,
            },
            results: [],
            sessionStartTime: Date.now(),
            themeId,
            areaId: areaId ?? null,
            completedExerciseIds: new Set<string>(),
            childProfileId: childProfileId ?? null,
        });
    },

    nextExercise: () => {
        const state = get();
        const nextIndex = state.currentIndex + 1;

        if (nextIndex >= state.totalExercises) {
            // Session complete
            set({ isCompleted: true, currentExercise: null });
            return;
        }

        const nextExercise = state.exerciseQueue[nextIndex];
        if (!nextExercise) return;

        set({
            currentExercise: nextExercise,
            currentIndex: nextIndex,
            answer: null,
            isCompleted: false,
            showSolution: false,
            levelFailed: false,
        });
    },

    submitAnswer: (correct) => {
        const state = get();
        if (!state.currentExercise) {
            return { success: false, reason: 'no_exercise' as const };
        }

        // Check for duplicate completion (Issue #3 fix)
        const exerciseId = state.currentExercise.id;
        if (state.completedExerciseIds.has(exerciseId)) {
            return { success: false, reason: 'duplicate' as const };
        }

        // Use existing answer or create a default one if not yet set
        const currentAnswer = state.answer ?? { correct: false, attempts: 1, timeSpentSeconds: 0, stars: 0 };
        const stars = correct ? calculateStars(currentAnswer.attempts) : 0;

        // Update answer with result
        const finalAnswer: ExerciseAnswer = {
            ...currentAnswer,
            correct,
            stars,
        };

        // Only mark as completed and update stats when answer is correct
        // This allows retry when the answer is wrong
        if (correct) {
            // Mark exercise as completed to prevent duplicate awards
            const newCompletedIds = new Set(state.completedExerciseIds);
            newCompletedIds.add(exerciseId);

            // Create result record with childProfileId from session state
            const result: ExerciseResult = {
                id: generateResultId(),
                childProfileId: state.childProfileId ?? '',
                exerciseId: state.currentExercise.id,
                areaId: state.currentExercise.areaId,
                themeId: state.currentExercise.themeId,
                level: state.currentExercise.level,
                correct,
                score: stars as StarRating,
                attempts: currentAnswer.attempts,
                timeSpentSeconds: currentAnswer.timeSpentSeconds,
                completedAt: new Date().toISOString(),
            };

            // Update stats
            const newStats: SessionStats = {
                exercisesCompleted: state.stats.exercisesCompleted + 1,
                correctAnswers: state.stats.correctAnswers + 1,
                totalStars: state.stats.totalStars + stars,
                totalTimeSeconds: state.stats.totalTimeSeconds + currentAnswer.timeSpentSeconds,
            };

            set({
                answer: finalAnswer,
                isCompleted: true,
                showSolution: true, // Show solution when correct so exercise displays solution state
                stats: newStats,
                results: [...state.results, result],
                completedExerciseIds: newCompletedIds,
            });
        } else {
            // For wrong answers, check if max attempts reached
            const attempts = currentAnswer.attempts;
            if (attempts >= MAX_ATTEMPTS_PER_EXERCISE) {
                // Max attempts reached - level failed
                set({
                    answer: finalAnswer,
                    showSolution: true,
                    levelFailed: true,
                });
            } else {
                // Still have attempts left - allow retry
                set({
                    answer: finalAnswer,
                });
            }
        }

        return { success: true };
    },

    incrementAttempts: () => {
        set((state) => {
            const currentAnswer = state.answer;
            const newAnswer: ExerciseAnswer = currentAnswer
                ? { ...currentAnswer, attempts: currentAnswer.attempts + 1 }
                : { correct: false, attempts: 1, timeSpentSeconds: 0, stars: 0 };
            return { answer: newAnswer };
        });
    },

    setShowSolution: (show) => set({ showSolution: show }),

    recordTime: (seconds) => {
        set((state) => {
            const currentAnswer = state.answer;
            const newAnswer: ExerciseAnswer = currentAnswer
                ? { ...currentAnswer, timeSpentSeconds: seconds }
                : { correct: false, attempts: 0, timeSpentSeconds: seconds, stars: 0 };
            return { answer: newAnswer };
        });
    },

    endSession: async () => {
        const state = get();

        // Persist results to IndexedDB before clearing state
        if (state.results.length > 0 && state.childProfileId) {
            // Save each result, handling errors gracefully
            for (const result of state.results) {
                try {
                    // Update the result with the correct childProfileId
                    const resultToSave: ExerciseResult = {
                        ...result,
                        childProfileId: state.childProfileId,
                    };
                    await saveExerciseResult(resultToSave);
                } catch {
                    // Continue saving other results - don't throw
                }
            }
        }

        set({
            currentExercise: null,
            currentIndex: 0,
            totalExercises: 0,
            exerciseQueue: [],
            answer: null,
            isCompleted: false,
            showSolution: false,
            levelFailed: false,
            stats: {
                exercisesCompleted: 0,
                correctAnswers: 0,
                totalStars: 0,
                totalTimeSeconds: 0,
            },
            results: [],
            sessionStartTime: null,
            themeId: null,
            areaId: null,
            completedExerciseIds: new Set<string>(),
            childProfileId: null,
        });
    },

    resetCurrentExercise: () => {
        set({
            answer: null,
            isCompleted: false,
            showSolution: false,
        });
    },

    restartLevel: () => {
        const state = get();
        if (state.exerciseQueue.length === 0) return;

        set({
            currentExercise: state.exerciseQueue[0] ?? null,
            currentIndex: 0,
            answer: null,
            isCompleted: false,
            showSolution: false,
            levelFailed: false,
            stats: {
                exercisesCompleted: 0,
                correctAnswers: 0,
                totalStars: 0,
                totalTimeSeconds: 0,
            },
            results: [],
            sessionStartTime: Date.now(),
            completedExerciseIds: new Set<string>(),
        });
    },
}));

// ============================================================================
// Selectors
// ============================================================================

/**
 * Selector for current exercise.
 */
export const selectCurrentExercise = (state: ExerciseSessionState) => state.currentExercise;

/**
 * Selector for session progress.
 * Uses memoization to return stable references.
 */
let cachedProgress: { current: number; total: number } | null = null;
let lastProgressDeps: { currentIndex: number; totalExercises: number } | null = null;

export const selectProgress = (state: ExerciseSessionState) => {
    const deps = { currentIndex: state.currentIndex, totalExercises: state.totalExercises };

    // Return cached result if dependencies haven't changed
    if (
        cachedProgress &&
        lastProgressDeps &&
        lastProgressDeps.currentIndex === deps.currentIndex &&
        lastProgressDeps.totalExercises === deps.totalExercises
    ) {
        return cachedProgress;
    }

    // Create new cached result
    cachedProgress = { current: state.currentIndex + 1, total: state.totalExercises };
    lastProgressDeps = deps;
    return cachedProgress;
};

/**
 * Selector for session stats.
 */
export const selectStats = (state: ExerciseSessionState) => state.stats;

/**
 * Selector for session results.
 */
export const selectResults = (state: ExerciseSessionState) => state.results;

/**
 * Selector for answer state.
 */
export const selectAnswer = (state: ExerciseSessionState) => state.answer;

/**
 * Selector for whether session is active.
 */
export const selectIsSessionActive = (state: ExerciseSessionState) =>
    state.sessionStartTime !== null && state.currentExercise !== null;

/**
 * Selector for correct rate percentage.
 */
export const selectCorrectRate = (state: ExerciseSessionState) => {
    if (state.stats.exercisesCompleted === 0) return 0;
    return Math.round(
        (state.stats.correctAnswers / state.stats.exercisesCompleted) * 100
    );
};
