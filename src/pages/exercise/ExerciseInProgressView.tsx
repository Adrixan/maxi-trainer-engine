/**
 * Exercise in-progress view component.
 *
 * Displays the current exercise with progress, feedback, and action buttons.
 * Uses reusable components from @core/components/exercises.
 */

import { useTranslation } from 'react-i18next';
import { ExerciseRenderer, ExerciseHeader, ExerciseFooter } from '@core/components/exercises';
import { BadgeEarnedToast, LevelUpCelebration } from '@core/components/gamification';
import type { Exercise, Theme } from '@/types';
import type { UseExercisePageStateReturn } from '@core/hooks/useExercisePageState';

export interface ExerciseInProgressViewProps {
    /** Current exercise being displayed */
    currentExercise: Exercise;
    /** Theme name for display */
    themeName: string | undefined;
    /** Theme ID for display */
    themeId: string | undefined;
    /** Progress information */
    progress: { current: number; total: number };
    /** Whether the exercise is completed (from store) */
    isCompleted: boolean;
    /** Whether solution is being shown */
    showSolution: boolean;
    /** Whether level has been failed */
    levelFailed: boolean;
    /** Whether user has answered current exercise */
    hasAnswered: boolean;
    /** Current answer state */
    answer: UseExercisePageStateReturn['answer'];
    /** Gamification notifications */
    notifications: UseExercisePageStateReturn['notifications'];
    /** Handle answer submission */
    onSubmit: (correct: boolean) => void;
    /** Handle show solution */
    onShowSolution: () => void;
    /** Handle next exercise */
    onNext: () => void;
    /** Handle restart level */
    onRestartLevel: () => void;
    /** Handle finish session */
    onFinish: () => void;
    /** Handle back navigation */
    onBack: () => void;
    /** Handle dismiss badge notification */
    onDismissBadge: () => void;
    /** Handle clear level up notification */
    onClearLevelUp: () => void;
}

export function ExerciseInProgressView({
    currentExercise,
    themeName,
    themeId,
    progress,
    isCompleted: isCompletedFromStore,
    showSolution,
    levelFailed,
    hasAnswered,
    answer,
    notifications,
    onSubmit,
    onShowSolution,
    onNext,
    onRestartLevel,
    onFinish,
    onBack,
    onDismissBadge,
    onClearLevelUp,
}: ExerciseInProgressViewProps) {
    const { t } = useTranslation();

    // Prepare theme object for ExerciseHeader
    const theme = themeId ? { name: themeName } as Theme : null;

    // Build feedback message for ExerciseFooter
    let feedbackMessage: string | undefined;
    let feedbackType: 'correct' | 'incorrect' | undefined;

    if (hasAnswered && answer && !levelFailed) {
        feedbackType = answer.correct ? 'correct' : 'incorrect';
        feedbackMessage = answer.correct
            ? currentExercise.feedbackCorrect
            : showSolution
                ? currentExercise.feedbackIncorrect
                : t('exercise.tryAgain');
    }

    // Check if there's more exercises
    const hasNext = progress.current < progress.total;

    return (
        <div className="flex flex-col min-h-[80vh] lg:min-h-0 p-4 max-w-2xl mx-auto">
            {/* Exercise header with progress bar and instruction */}
            <ExerciseHeader
                currentExercise={progress.current}
                totalExercises={progress.total}
                theme={theme}
                themeId={themeId || ''}
                instruction={currentExercise.instruction}
            />

            {/* Exercise content */}
            <div className="flex-1 lg:flex-none">
                <ExerciseRenderer
                    content={currentExercise.content}
                    exerciseId={currentExercise.id}
                    hints={currentExercise.hints}
                    onSubmit={onSubmit}
                    showSolution={showSolution}
                />
            </div>

            {/* Level Failed Message */}
            {levelFailed && (
                <div
                    className="mt-4 p-4 rounded-lg bg-red-100 border border-red-300"
                    role="alert"
                >
                    <p className="text-red-800 font-bold">
                        {t('exercise.levelFailed')}
                    </p>
                    <p className="text-red-700 text-sm mt-1">
                        {t('exercise.levelFailedDescription')}
                    </p>
                </div>
            )}

            {/* Action buttons - Level failed state */}
            {levelFailed ? (
                <div className="mt-6 flex gap-4">
                    <button
                        onClick={onRestartLevel}
                        className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {t('exercise.restartLevel')}
                    </button>
                    <button
                        onClick={onFinish}
                        className="flex-1 py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        {t('exercise.exitLevel')}
                    </button>
                </div>
            ) : (
                /* Normal flow - use ExerciseFooter with proper state */
                <ExerciseFooter
                    showSolution={showSolution}
                    isCompleted={isCompletedFromStore}
                    hasNext={hasNext}
                    onShowSolution={onShowSolution}
                    onNext={onNext}
                    onFinish={onFinish}
                    onBack={onBack}
                    feedbackMessage={feedbackMessage || ''}
                    feedbackType={feedbackType || 'correct'}
                />
            )}

            {/* Level Up Celebration */}
            {notifications.levelUpLevel !== null && (
                <LevelUpCelebration
                    newLevel={notifications.levelUpLevel}
                    onDone={onClearLevelUp}
                />
            )}

            {/* Badge Earned Toast */}
            {(() => {
                const currentBadge = notifications.earnedBadges[notifications.currentBadgeIndex];
                if (notifications.earnedBadges.length > 0 &&
                    notifications.currentBadgeIndex < notifications.earnedBadges.length &&
                    currentBadge) {
                    return (
                        <BadgeEarnedToast
                            badge={currentBadge}
                            onDismiss={onDismissBadge}
                        />
                    );
                }
                return null;
            })()}
        </div>
    );
}
