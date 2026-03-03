/**
 * Loading state component for ExercisePage.
 *
 * Displays a skeleton loader while exercises are being loaded.
 */

import { useTranslation } from 'react-i18next';

export function ExerciseLoadingState() {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <div className="animate-pulse space-y-4 w-full max-w-md">
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="h-32 bg-gray-200 rounded-xl" />
                <div className="h-12 bg-gray-200 rounded-xl" />
            </div>
            <p className="text-gray-500 mt-4">
                {t('exercise.loading')}
            </p>
        </div>
    );
}
