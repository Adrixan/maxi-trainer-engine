import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { feedbackStyles } from '@core/utils/exerciseStyles';
import type { Exercise, StarRating } from '@/types/exercise';

/**
 * Base props shared by all exercise components.
 */
export interface BaseExerciseProps {
    /** The exercise content (discriminated by type) */
    content: Exercise['content'];
    /** Hints available for this exercise */
    hints?: string[];
    /** Callback when exercise is submitted (correct or incorrect) */
    onSubmit: (correct: boolean) => void;
    /** Whether to show the solution state */
    showSolution: boolean;
}

/**
 * Props for the ExerciseWrapper component.
 */
export interface ExerciseWrapperProps {
    /** Exercise instruction text */
    instruction: string;
    /** Feedback for correct answer */
    feedbackCorrect?: string;
    /** Feedback for incorrect answer */
    feedbackIncorrect?: string;
    /** Whether the current answer state is correct */
    isCorrect: boolean | null;
    /** Whether to show the solution */
    showSolution: boolean;
    /** Number of attempts made */
    attempts: number;
    /** Maximum attempts allowed */
    maxAttempts?: number;
    /** Children (the exercise content) */
    children: React.ReactNode;
    /** Callback to proceed to next exercise */
    onNext?: () => void;
}

/**
 * Calculate star rating based on attempts.
 * 1 attempt = 3 stars, 2 attempts = 2 stars, 3 attempts = 1 star
 */
export function calculateStars(attempts: number): StarRating {
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    return 1;
}

/**
 * Wrapper component providing common exercise UI elements:
 * - Instruction display
 * - Feedback messages
 * - Attempt counter
 * - Next button
 */
export function ExerciseWrapper({
    instruction,
    feedbackCorrect,
    feedbackIncorrect,
    isCorrect,
    showSolution,
    attempts,
    maxAttempts = 3,
    children,
    onNext,
}: ExerciseWrapperProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-4">
            {/* Instruction */}
            <div
                className="bg-primary/5 rounded-xl p-4 border border-primary/10"
                role="region"
                aria-label={t('exercises.instruction')}
            >
                <p className="text-base font-semibold text-gray-800">
                    {instruction}
                </p>
            </div>

            {/* Exercise content */}
            <div role="group" aria-label={t('exercises.exerciseArea')}>
                {children}
            </div>

            {/* Feedback */}
            {showSolution && (
                <div
                    className={`${feedbackStyles({ type: isCorrect ? 'success' : 'error' })} animate-fadeIn`}
                    role="alert"
                    aria-live="polite"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-2xl" aria-hidden="true">
                            {isCorrect ? '🎉' : '💪'}
                        </span>
                        <div>
                            <p className="font-bold">
                                {isCorrect
                                    ? (feedbackCorrect || t('exercises.correct'))
                                    : (feedbackIncorrect || t('exercises.incorrect'))
                                }
                            </p>
                            {!isCorrect && attempts < maxAttempts && (
                                <p className="text-sm opacity-90 mt-1">
                                    {t('exercises.tryAgain')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attempt counter */}
            {attempts > 0 && !showSolution && (
                <div className="text-center text-sm text-gray-500">
                    {t('exercises.attempts', { current: attempts, max: maxAttempts })}
                </div>
            )}

            {/* Next button */}
            {showSolution && onNext && (
                <button
                    onClick={onNext}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    {t('exercises.next')}
                </button>
            )}
        </div>
    );
}

/**
 * Hook for managing exercise session state.
 * Handles attempts, scoring, and solution display.
 */
export function useExerciseState(maxAttempts: number = 3) {
    const [attempts, setAttempts] = useState(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showSolution, setShowSolution] = useState(false);

    const handleSubmit = useCallback((correct: boolean) => {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (correct) {
            setIsCorrect(true);
            setShowSolution(true);
        } else if (newAttempts >= maxAttempts) {
            setIsCorrect(false);
            setShowSolution(true);
        } else {
            // Incorrect but can try again
            setIsCorrect(false);
        }
    }, [attempts, maxAttempts]);

    const reset = useCallback(() => {
        setAttempts(0);
        setIsCorrect(null);
        setShowSolution(false);
    }, []);

    const stars = showSolution && isCorrect ? calculateStars(attempts) : null;

    return {
        attempts,
        isCorrect,
        showSolution,
        stars,
        handleSubmit,
        reset,
        canRetry: !showSolution && attempts < maxAttempts,
    };
}

/**
 * Hook for managing focus within an exercise.
 * Returns focus to the first focusable element after solution is shown.
 */
export function useExerciseFocus(showSolution: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (showSolution && containerRef.current) {
            // Find the first focusable element
            const focusable = containerRef.current.querySelector<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            focusable?.focus();
        }
    }, [showSolution]);

    return containerRef;
}
