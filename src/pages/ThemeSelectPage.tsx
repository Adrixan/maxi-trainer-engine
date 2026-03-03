/**
 * Theme selection page component.
 * 
 * Displays a grid of themes that users can select to start exercises.
 * Shows locked/unlocked states based on vocabulary level.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { ThemeCard } from '@core/components/theme';
import { useThemes, useConfig } from '@core/config';
import {
    useProfileStore,
    selectActiveProfile,
    selectThemeLevels,
} from '@core/stores/profileStore';
import { calculateGlobalLevel, getAccessibleLevelForTheme } from '@core/utils/gamification';
import { ROUTES } from '@core/router';
import { getAllExerciseResults } from '@core/storage';
import type { Theme, ThemeProgress, ExerciseResult } from '@/types';

// ============================================================================
// Level Display Component
// ============================================================================

/**
 * Level indicator dots showing current vocabulary level.
 */
function LevelIndicator({ level }: { level: number }) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">
                {t('theme.vocabularyLevel', 'Vocabulary Level')}:
            </span>
            <div className="flex gap-1" role="img" aria-label={t('theme.levelLabel', { level, defaultValue: `Level ${level}` })}>
                {[1, 2, 3, 4].map((lvl) => (
                    <div
                        key={lvl}
                        className={`w-3 h-3 rounded-full ${lvl <= level
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                            }`}
                        aria-hidden="true"
                    />
                ))}
            </div>
            <span className="text-sm font-medium text-blue-600">
                {level}
            </span>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Theme selection page.
 * Shows a grid of themes with progress and lock status.
 */
export function ThemeSelectPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Get themes and exercises from config
    const themes = useThemes();
    const { getExercisesByTheme } = useConfig();

    // Get profile data
    const profile = useProfileStore(selectActiveProfile);
    const themeLevels = useProfileStore(selectThemeLevels);

    // Calculate global level and per-theme accessible levels
    const allThemeIds = themes.map(t => t.id);
    const globalLevel = calculateGlobalLevel(themeLevels, allThemeIds);

    // Track completed exercise IDs and stars per theme from IndexedDB
    const [completedByTheme, setCompletedByTheme] = useState<Record<string, { exerciseIds: Set<string>; stars: number }>>({});

    // Fetch completed exercises from IndexedDB - refreshes when location changes
    const fetchCompletedExercises = useCallback(() => {
        if (!profile) {
            setCompletedByTheme({});
            return;
        }

        getAllExerciseResults()
            .then((results: ExerciseResult[]) => {
                // Group results by theme, tracking unique exercise IDs and best stars
                const byTheme: Record<string, { exerciseIds: Set<string>; stars: number }> = {};

                for (const result of results) {
                    if (!result.correct) continue; // Only count correct answers

                    const themeId = result.themeId;
                    if (!byTheme[themeId]) {
                        byTheme[themeId] = { exerciseIds: new Set(), stars: 0 };
                    }
                    // Track unique exercise IDs
                    byTheme[themeId].exerciseIds.add(result.exerciseId);
                    // Add stars (this will sum all attempts, but we could track max per exercise if needed)
                    byTheme[themeId].stars += result.score;
                }

                setCompletedByTheme(byTheme);
            })
            .catch(() => {
                setCompletedByTheme({});
            });
    }, [profile]);

    useEffect(() => {
        fetchCompletedExercises();
    }, [fetchCompletedExercises, location.key]);

    // Calculate theme progress from IndexedDB data
    const calculateThemeProgress = (theme: Theme): ThemeProgress => {
        const exercises = getExercisesByTheme(theme.id);
        const themeStats = completedByTheme[theme.id];
        const accessibleLevel = getAccessibleLevelForTheme(theme.id, themeLevels, allThemeIds);

        return {
            unlocked: accessibleLevel >= theme.minLevel,
            exercisesCompleted: themeStats?.exerciseIds.size ?? 0,
            exercisesTotal: exercises.length,
            starsEarned: themeStats?.stars ?? 0,
            maxStars: exercises.length * 3,
        };
    };

    // Handle theme card click
    const handleThemeClick = (theme: Theme) => {
        // Navigate to level selection for this theme
        navigate(ROUTES.LEVEL_SELECT(theme.id));
    };

    return (
        <div
            className="min-h-screen bg-gray-50 p-4"
            role="main"
            aria-labelledby="theme-select-title"
        >
            {/* Header */}
            <header className="max-w-2xl mx-auto mb-6">
                <h1
                    id="theme-select-title"
                    className="text-2xl font-bold text-gray-900 mb-2"
                >
                    {t('theme.title', 'Choose a Theme')}
                </h1>

                {/* Level indicator */}
                <LevelIndicator level={globalLevel} />

                <p className="text-gray-600">
                    {t('theme.subtitle', 'Select a theme to practice. Complete exercises to earn stars and unlock new themes!')}
                </p>
            </header>

            {/* Theme grid */}
            <div
                className="max-w-2xl mx-auto grid grid-cols-2 gap-4"
                role="list"
                aria-label={t('theme.themeList', 'Available themes')}
            >
                {themes.map((theme) => {
                    const accessibleLevel = getAccessibleLevelForTheme(theme.id, themeLevels, allThemeIds);
                    const isUnlocked = accessibleLevel >= theme.minLevel;
                    const progress = calculateThemeProgress(theme);

                    return (
                        <div key={theme.id} role="listitem">
                            <ThemeCard
                                theme={theme}
                                progress={progress}
                                isUnlocked={isUnlocked}
                                vocabularyLevel={globalLevel}
                                onClick={() => handleThemeClick(theme)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Back button */}
            <div className="max-w-2xl mx-auto mt-6">
                <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                    aria-label={t('navigation.back', 'Back to home')}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    <span>{t('navigation.back', 'Back')}</span>
                </button>
            </div>
        </div>
    );
}

export default ThemeSelectPage;
