/**
 * No exercise view component.
 *
 * Displayed when no exercise is available.
 */

import { useTranslation } from 'react-i18next';

export interface NoExerciseViewProps {
    /** Handler for navigating back home */
    onBackHome: () => void;
}

export function NoExerciseView({ onBackHome }: NoExerciseViewProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <p className="text-gray-500">
                {t('exercise.noExercise')}
            </p>
            <button
                onClick={onBackHome}
                className="mt-4 py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
            >
                {t('common.backHome')}
            </button>
        </div>
    );
}
