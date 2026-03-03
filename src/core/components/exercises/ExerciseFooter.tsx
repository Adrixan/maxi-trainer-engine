/**
 * ExerciseFooter component for displaying action buttons and feedback.
 * 
 * Extracted from ExercisePage for reusability and maintainability.
 */

import { useTranslation } from 'react-i18next';
import { Button } from '@core/components/ui';
import { feedbackStyles } from '@core/utils/exerciseStyles';

// ============================================================================
// Types
// ============================================================================

export interface ExerciseFooterProps {
    /** Whether the solution is currently shown */
    showSolution: boolean;
    /** Whether the current exercise is completed (correct answer) */
    isCompleted: boolean;
    /** Whether there are more exercises after this one */
    hasNext: boolean;
    /** Callback when user clicks "Show Solution" */
    onShowSolution?: () => void;
    /** Callback when user clicks "Next" */
    onNext?: () => void;
    /** Callback when user clicks "Finish" */
    onFinish?: () => void;
    /** Callback when user clicks "Back" */
    onBack?: () => void;
    /** Feedback message to display (if any) */
    feedbackMessage?: string;
    /** Whether the feedback is positive (correct) or negative (incorrect) */
    feedbackType?: 'correct' | 'incorrect' | 'warning';
}

// ============================================================================
// Component
// ============================================================================

/**
 * Footer component for exercise pages.
 * Displays action buttons and feedback messages.
 * 
 * @example
 * ```tsx
 * <ExerciseFooter
 *   showSolution={false}
 *   isCompleted={false}
 *   hasNext={true}
 *   onShowSolution={handleShowSolution}
 *   onNext={handleNext}
 *   onFinish={handleFinish}
 *   onBack={handleBack}
 * />
 * ```
 */
export function ExerciseFooter({
    showSolution,
    isCompleted,
    hasNext,
    onShowSolution,
    onNext,
    onFinish,
    onBack,
    feedbackMessage,
    feedbackType = 'correct',
}: ExerciseFooterProps) {
    const { t } = useTranslation();

    // Map feedbackType to exerciseStyles feedback type
    const getFeedbackType = (): 'success' | 'error' | 'warning' => {
        switch (feedbackType) {
            case 'correct':
                return 'success';
            case 'incorrect':
                return 'error';
            default:
                return 'warning';
        }
    };

    return (
        <div className="mt-6">
            {/* Feedback message */}
            {feedbackMessage && (
                <div
                    className={`mb-4 ${feedbackStyles({ type: getFeedbackType() })}`}
                    role="alert"
                    aria-live="polite"
                >
                    <p className="font-medium">{feedbackMessage}</p>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-4">
                {/* Show Solution button - only when not yet shown and not completed */}
                {!showSolution && !isCompleted && (
                    <Button
                        intent="secondary"
                        fullWidth
                        onClick={onShowSolution}
                        aria-label={t('exercise.showSolution')}
                    >
                        {t('exercise.showSolution')}
                    </Button>
                )}

                {/* Next button - when solution shown or completed, and more exercises remain */}
                {(showSolution || isCompleted) && hasNext && (
                    <Button
                        intent={isCompleted ? 'success' : 'primary'}
                        fullWidth
                        onClick={onNext}
                        aria-label={t('exercise.next')}
                    >
                        {t('exercise.next')}
                    </Button>
                )}

                {/* Finish button - when solution shown or completed, and no more exercises */}
                {(showSolution || isCompleted) && !hasNext && (
                    <Button
                        intent="accent"
                        fullWidth
                        onClick={onFinish}
                        aria-label={t('exercise.finish')}
                    >
                        {t('exercise.finish')}
                    </Button>
                )}
            </div>

            {/* Back button */}
            {onBack && (
                <button
                    onClick={onBack}
                    className="mt-4 w-full py-2 px-4 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
                    aria-label={t('common.back')}
                >
                    {t('common.back')}
                </button>
            )}
        </div>
    );
}
