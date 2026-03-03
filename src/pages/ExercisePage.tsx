/**
 * Exercise page component.
 *
 * Displays exercise content and handles exercise sessions.
 * This component orchestrates the exercise flow using extracted hooks and components.
 */

import { useExercisePageState } from '@core/hooks';
import { ROUTES } from '@core/router';
import {
    ExerciseLoadingState,
    ExerciseCompleteView,
    ExerciseInProgressView,
    NoExerciseView,
} from './exercise';

/**
 * Exercise page component.
 * Renders the current exercise and handles user interactions.
 */
export function ExercisePage() {
    const {
        exercises,
        theme,
        themeId,
        currentExercise,
        progress,
        isCompleted,
        showSolution,
        levelFailed,
        hasAnswered,
        answer,
        notifications,
        handleSubmit,
        handleNext,
        handleShowSolution,
        handleRestartLevel,
        handleFinish,
        handleBack,
        dismissBadge,
        clearLevelUp,
    } = useExercisePageState();

    // Loading state
    if (exercises.length === 0) {
        return <ExerciseLoadingState />;
    }

    // Session complete state
    if (isCompleted && !currentExercise) {
        return <ExerciseCompleteView onFinish={handleFinish} />;
    }

    // No current exercise
    if (!currentExercise) {
        return <NoExerciseView onBackHome={() => window.location.assign(ROUTES.HOME)} />;
    }

    // Exercise in progress
    return (
        <ExerciseInProgressView
            currentExercise={currentExercise}
            themeName={theme?.name}
            themeId={themeId}
            progress={progress}
            isCompleted={isCompleted}
            showSolution={showSolution}
            levelFailed={levelFailed}
            hasAnswered={hasAnswered}
            answer={answer}
            notifications={notifications}
            onSubmit={handleSubmit}
            onShowSolution={handleShowSolution}
            onNext={handleNext}
            onRestartLevel={handleRestartLevel}
            onFinish={handleFinish}
            onBack={handleBack}
            onDismissBadge={dismissBadge}
            onClearLevelUp={clearLevelUp}
        />
    );
}
