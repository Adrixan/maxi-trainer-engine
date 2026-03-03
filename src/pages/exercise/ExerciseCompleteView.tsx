/**
 * Exercise complete view component.
 *
 * Displayed when all exercises in a session have been completed.
 */

import { useTranslation } from 'react-i18next';

export interface ExerciseCompleteViewProps {
    /** Handler for finishing the session and viewing results */
    onFinish: () => void;
}

export function ExerciseCompleteView({ onFinish }: ExerciseCompleteViewProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t('exercise.complete')}
            </h1>
            <p className="text-gray-600 mb-8">
                {t('exercise.completedAll')}
            </p>
            <button
                onClick={onFinish}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                {t('exercise.viewResults')}
            </button>
        </div>
    );
}