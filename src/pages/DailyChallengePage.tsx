/**
 * Daily Challenge Page component.
 * 
 * Provides a daily challenge with 5 exercises from different themes.
 * The challenge is based on the current date for consistency.
 * Tracks completion and rewards bonus stars.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { useProfileStore, selectActiveProfile } from '@core/stores/profileStore';

export function DailyChallengePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfileStore(selectActiveProfile);

    // State
    const [isCompleted, setIsCompleted] = useState(false);
    const [todayCompleted, setTodayCompleted] = useState(false);
    const [bonusCompleted, setBonusCompleted] = useState(false);
    const [totalStars, setTotalStars] = useState(0);
    const [bonusStars, setBonusStars] = useState(0);

    // Daily challenge storage keys
    const DAILY_KEY = 'daily-challenge';
    const BONUS_KEY = 'bonus-challenge';

    // Get today's date as a string
    const today = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    // Check if today's challenge is completed
    useEffect(() => {
        const completed = localStorage.getItem(`${DAILY_KEY}-${today}`);
        if (completed) {
            setTodayCompleted(true);
            setTotalStars(parseInt(completed, 10) || 0);
        }

        // Check bonus
        const bonus = localStorage.getItem(`${BONUS_KEY}-${today}`);
        if (bonus) {
            setBonusCompleted(true);
            setBonusStars(parseInt(bonus, 10) || 0);
        }
    }, [today]);

    // Handle daily challenge completion
    const handleCompleteChallenge = useCallback((isBonus: boolean = false) => {
        const stars = isBonus ? 3 : 5; // 5 stars for daily, 3 for bonus
        const key = isBonus ? BONUS_KEY : DAILY_KEY;

        // Save completion
        localStorage.setItem(`${key}-${today}`, String(stars));

        // Update profile stars
        const profileStore = useProfileStore.getState();
        profileStore.addStars(stars);
        profileStore.incrementStreak();

        if (isBonus) {
            setBonusCompleted(true);
            setBonusStars(stars);
        } else {
            setTodayCompleted(true);
            setTotalStars(stars);
        }
        setIsCompleted(true);
    }, [today]);

    // Start bonus challenge
    const handleStartBonus = useCallback(() => {
        handleCompleteChallenge(true);
    }, [handleCompleteChallenge]);

    // No profile
    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">👤</div>
                    <p className="text-gray-600 mb-4">
                        {t('dailyChallenge.noProfile', 'Bitte erstelle ein Profil, um am Daily Challenge teilzunehmen.')}
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {t('common.createProfile', 'Profil erstellen')}
                    </button>
                </div>
            </div>
        );
    }

    // Completed state (daily done)
    if (todayCompleted && !isCompleted) {
        return (
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white shadow-sm">
                    <div className="max-w-4xl mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(ROUTES.HOME)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label={t('common.back', 'Zurück')}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-gray-800">
                                {t('dailyChallenge.title', 'Daily Challenge')}
                            </h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <div className="text-8xl mb-6">✅</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {t('dailyChallenge.completed', 'Heute schon gemeistert!')}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        {t('dailyChallenge.completedStars', 'Du hast heute {{stars}} Sterne verdient!', { stars: totalStars })}
                    </p>

                    {/* Bonus Challenge */}
                    {!bonusCompleted ? (
                        <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                            <div className="text-4xl mb-3">⭐</div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                {t('dailyChallenge.bonusTitle', 'Bonus Challenge!')}
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {t('dailyChallenge.bonusDesc', 'Mache noch mehr Übungen für 3 Extra-Sterne!')}
                            </p>
                            <button
                                onClick={handleStartBonus}
                                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                            >
                                {t('dailyChallenge.startBonus', 'Bonus starten')}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-green-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
                            <div className="text-4xl mb-3">🌟</div>
                            <p className="text-gray-700 font-semibold">
                                {t('dailyChallenge.bonusCompleted', 'Bonus abgeschlossen! +{{stars}} Sterne', { stars: bonusStars })}
                            </p>
                        </div>
                    )}

                    <p className="text-gray-500 mb-8">
                        {t('dailyChallenge.comeBack', 'Komm morgen wieder für eine neue Herausforderung!')}
                    </p>
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {t('common.home', 'Zur Startseite')}
                    </button>
                </main>
            </div>
        );
    }

    // Start state - show date-based info
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(ROUTES.HOME)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label={t('common.back', 'Zurück')}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">
                            {t('dailyChallenge.title', 'Daily Challenge')}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12 text-center">
                <div className="text-8xl mb-6">🎯</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {t('dailyChallenge.subtitle', 'Tägliche Herausforderung')}
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {t('dailyChallenge.description', 'Stelle dich 5 Übungen aus verschiedenen Themen. Verdiene 5 Bonus-Sterne!')}
                </p>

                {/* Challenge info */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 max-w-md mx-auto">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div>
                            <div className="text-sm text-gray-500">{t('dailyChallenge.exercises', 'Übungen')}</div>
                            <div className="text-xl font-semibold">5</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500">{t('dailyChallenge.bonus', 'Bonus-Sterne')}</div>
                            <div className="text-xl font-semibold text-yellow-500">⭐ 5</div>
                        </div>
                        <div className="col-span-2">
                            <div className="text-sm text-gray-500">{t('dailyChallenge.date', 'Datum')}</div>
                            <div className="text-lg font-semibold">{new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(ROUTES.EXERCISE('daily'))}
                        className="px-8 py-3 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        {t('dailyChallenge.start', 'Jetzt starten')}
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="px-8 py-3 bg-gray-200 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        {t('common.back', 'Zurück')}
                    </button>
                </div>
            </main>
        </div>
    );
}

export default DailyChallengePage;
