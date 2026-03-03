/**
 * Results page component.
 * 
 * Displays exercise results and progress statistics.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';

/**
 * Results page component.
 * Shows exercise history and learning progress.
 */
export function ResultsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {t('results.title', 'Results')}
            </h1>

            <p className="text-gray-500 mb-8 text-center max-w-md">
                {t('results.placeholder', 'Exercise results and progress will be displayed here.')}
            </p>

            <button
                onClick={() => navigate(ROUTES.HOME)}
                className="py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
                {t('common.backHome', 'Back to Home')}
            </button>
        </div>
    );
}
