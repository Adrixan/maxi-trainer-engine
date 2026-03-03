/**
 * ExerciseHeader component for displaying exercise progress and instruction.
 * 
 * Extracted from ExercisePage for reusability and maintainability.
 */

import { useTranslation } from 'react-i18next';
import type { Theme } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ExerciseHeaderProps {
    /** Current exercise number (1-indexed) */
    currentExercise: number;
    /** Total number of exercises in the session */
    totalExercises: number;
    /** Theme information for display */
    theme?: Theme | null;
    /** Theme ID fallback */
    themeId?: string;
    /** Exercise instruction text (may be a translation key prefixed with 't:') */
    instruction: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Header component for exercise pages.
 * Displays progress bar, theme name, and instruction.
 * 
 * @example
 * ```tsx
 * <ExerciseHeader
 *   currentExercise={1}
 *   totalExercises={10}
 *   theme={theme}
 *   instruction="Fill in the blank"
 * />
 * ```
 */
export function ExerciseHeader({
    currentExercise,
    totalExercises,
    theme,
    themeId,
    instruction,
}: ExerciseHeaderProps) {
    const { t } = useTranslation();

    const progressPercent = totalExercises > 0
        ? (currentExercise / totalExercises) * 100
        : 0;

    // Translate instruction if it's a translation key
    const displayInstruction = instruction.startsWith('t:')
        ? t(instruction.slice(2))
        : instruction;

    return (
        <div className="mb-6">
            {/* Progress info */}
            <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                    {t('exercise.progress', {
                        current: currentExercise,
                        total: totalExercises,
                    })}
                </span>
                <span>{theme?.name ?? themeId ?? ''}</span>
            </div>

            {/* Progress bar */}
            <div
                className="h-2 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={currentExercise}
                aria-valuemin={0}
                aria-valuemax={totalExercises}
                aria-label={t('exercise.progressAria', { current: currentExercise, total: totalExercises })}
            >
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Instruction */}
            <h1 className="text-xl font-bold text-gray-900 mt-4">
                {displayInstruction}
            </h1>
        </div>
    );
}
