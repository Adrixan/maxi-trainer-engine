// Renders the correct exercise component based on content type.
// Uses a component map instead of repeated conditionals.

import { memo, ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExerciseContent, ExerciseType } from '@/types/exercise';
import { SentenceBuilderExercise } from './SentenceBuilderExercise';
import { ConjugationTableExercise } from './ConjugationTableExercise';
import { MultipleChoiceExercise } from './MultipleChoiceExercise';
import { FillBlankExercise } from './FillBlankExercise';
import { MatchingExercise } from './MatchingExercise';
import { WordOrderExercise } from './WordOrderExercise';
import { CategorySortExercise } from './CategorySortExercise';
import { ConnectorInsertExercise } from './ConnectorInsertExercise';
import { WritingExercise } from './WritingExercise';
import { PictureVocabularyExercise } from './PictureVocabularyExercise';

/**
 * Common props interface for all exercise components.
 */
export interface ExerciseProps {
    content: ExerciseContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Props for the ExerciseRenderer component.
 */
export interface ExerciseRendererProps extends ExerciseProps {
    /** Optional error fallback component */
    fallback?: ReactNode;
    /** Optional loading state */
    isLoading?: boolean;
    /** Exercise ID for key prop to force remount when exercise changes */
    exerciseId?: string;
}

/**
 * Component map for exercise type to component.
 * Maps exercise type strings to their corresponding React components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EXERCISE_COMPONENTS: Record<ExerciseType, ComponentType<any>> = {
    'sentence-builder': SentenceBuilderExercise,
    'conjugation-table': ConjugationTableExercise,
    'multiple-choice': MultipleChoiceExercise,
    'fill-blank': FillBlankExercise,
    'matching': MatchingExercise,
    'word-order': WordOrderExercise,
    'sorting': CategorySortExercise,
    'connector-insert': ConnectorInsertExercise,
    'writing': WritingExercise,
    'picture-vocabulary': PictureVocabularyExercise,
};

/**
 * Loading component displayed while exercise is loading.
 */
function ExerciseLoading() {
    const { t } = useTranslation();
    return (
        <div
            className="animate-pulse space-y-4"
            role="status"
            aria-label={t('exercise.loading')}
        >
            <div className="h-16 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-gray-200 rounded-xl" />
            <div className="h-12 bg-primary/20 rounded-xl" />
        </div>
    );
}

/**
 * Error fallback component displayed when exercise type is unknown.
 */
function ExerciseError({ type }: { type?: string }) {
    const { t } = useTranslation();
    return (
        <div
            className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
            role="alert"
        >
            <p className="text-red-800 font-semibold">
                {t('exercise.unknownType')}: {type || 'undefined'}
            </p>
            <p className="text-red-600 text-sm mt-1">
                {t('exercise.contactSupport')}
            </p>
        </div>
    );
}

/**
 * ExerciseRenderer component.
 * Dispatches to the correct exercise component based on content type.
 * 
 * @example
 * ```tsx
 * <ExerciseRenderer
 *   content={exercise.content}
 *   hints={exercise.hints}
 *   onSubmit={(correct) => handleResult(correct)}
 *   showSolution={showSolution}
 * />
 * ```
 */
export const ExerciseRenderer = memo(function ExerciseRenderer({
    content,
    hints,
    onSubmit,
    showSolution,
    fallback,
    isLoading,
    exerciseId,
}: ExerciseRendererProps) {
    // Show loading state
    if (isLoading) {
        return <ExerciseLoading />;
    }

    // Get the component for this exercise type
    const Component = EXERCISE_COMPONENTS[content.type];

    // Handle unknown exercise type
    if (!Component) {
        return fallback ?? <ExerciseError type={content.type} />;
    }

    // Render the exercise component
    // Use exerciseId as key to force remount when exercise changes
    // This ensures local state (like answer input) is cleared between exercises
    return (
        <Component
            key={exerciseId}
            content={content}
            hints={hints}
            onSubmit={onSubmit}
            showSolution={showSolution}
        />
    );
});

/**
 * Get the component for an exercise type.
 * Useful for lazy loading or code splitting.
 */
export function getExerciseComponent(type: ExerciseType) {
    return EXERCISE_COMPONENTS[type];
}

/**
 * Check if an exercise type is supported.
 */
export function isExerciseTypeSupported(type: string): type is ExerciseType {
    return type in EXERCISE_COMPONENTS;
}

/**
 * Get all supported exercise types.
 */
export function getSupportedExerciseTypes(): ExerciseType[] {
    return Object.keys(EXERCISE_COMPONENTS) as ExerciseType[];
}
