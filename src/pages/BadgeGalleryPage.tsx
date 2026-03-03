/**
 * Badge Gallery Page component.
 * 
 * Displays all available badges in a gallery layout, showing both
 * earned and locked badges with progress indicators.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { useProfileStore, selectActiveProfile } from '@core/stores/profileStore';
import { AchievementGrid } from '@core/components/gamification/AchievementGrid';

export function BadgeGalleryPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfileStore(selectActiveProfile);

    const earnedBadges = profile?.badges ?? [];

    // Calculate total badges
    const totalBadges = useMemo(() => {
        // Default badge count from the original app
        return 10;
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
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
                            {t('badges.title', 'Erfolge')}
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Summary Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">
                                {t('badges.earned', 'Verdiente Erfolge')}
                            </h2>
                            <p className="text-gray-500 mt-1">
                                {t('badges.progress', '{{earned}} von {{total}} Erfolgen freigeschaltet', {
                                    earned: earnedBadges.length,
                                    total: totalBadges
                                })}
                            </p>
                        </div>
                        <div className="text-4xl">
                            🏆
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${(earnedBadges.length / totalBadges) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Badges Grid */}
                <section aria-labelledby="badges-heading">
                    <h2 id="badges-heading" className="sr-only">
                        {t('badges.gallery', 'Erfolge Galerie')}
                    </h2>

                    {profile ? (
                        <AchievementGrid
                            badges={earnedBadges}
                            showLocked={true}
                            columns={3}
                            size="lg"
                        />
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">👤</div>
                            <p className="text-gray-600">
                                {t('badges.noProfile', 'Bitte erstelle ein Profil, um Erfolge zu sehen.')}
                            </p>
                            <button
                                onClick={() => navigate(ROUTES.HOME)}
                                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                {t('common.createProfile', 'Profil erstellen')}
                            </button>
                        </div>
                    )}
                </section>

                {/* Recent Badges Section */}
                {earnedBadges.length > 0 && (
                    <section className="mt-8" aria-labelledby="recent-badges-heading">
                        <h2 id="recent-badges-heading" className="text-lg font-semibold text-gray-800 mb-4">
                            {t('badges.recent', 'Kürzlich verdient')}
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {[...earnedBadges]
                                .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
                                .slice(0, 5)
                                .map((badge) => (
                                    <div
                                        key={badge.id}
                                        className="flex-shrink-0 bg-white rounded-lg p-4 shadow-sm text-center min-w-[100px]"
                                    >
                                        <div className="text-3xl mb-2">{badge.icon}</div>
                                        <div className="text-xs font-medium text-gray-700">{badge.name}</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            {new Date(badge.earnedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default BadgeGalleryPage;
