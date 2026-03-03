/**
 * Level selection page component.
 * 
 * Displays difficulty levels for a selected theme.
 * Shows locked/unlocked states based on global level progression.
 */

import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { LevelCard } from '@core/components/level';
import { useTheme, useExercisesByTheme, useThemes } from '@core/config';
import {
    useProfileStore,
    selectActiveProfile,
    selectThemeLevels,
} from '@core/stores/profileStore';
import { isLevelAccessible, getAccessibleLevelForTheme } from '@core/utils/gamification';
import { ROUTES } from '@core/router';
import { getExerciseResultsByTheme } from '@core/storage';
import type { Exercise, ExerciseResult } from '@/types';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Count exercises per level (1-4).
 */
function countExercisesPerLevel(exercises: Exercise[]): Record<number, number> {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const exercise of exercises) {
        const level = exercise.level;
        if (level >= 1 && level <= 4) {
            counts[level] = (counts[level] ?? 0) + 1;
        }
    }

    return counts;
}

/**
 * Count completed exercises per level from profile.
 */
function countCompletedPerLevel(
    exercises: Exercise[],
    completedExerciseIds: Set<string>
): Record<number, number> {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const exercise of exercises) {
        if (completedExerciseIds.has(exercise.id)) {
            const level = exercise.level;
            if (level >= 1 && level <= 4) {
                counts[level] = (counts[level] ?? 0) + 1;
            }
        }
    }

    return counts;
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Level selection page.
 * Shows 4 difficulty levels with exercise counts and completion status.
 */
export function LevelSelectPage() {
    const { themeId } = useParams<{ themeId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // Get theme and exercises
    const theme = useTheme(themeId ?? '');
    const exercises = useExercisesByTheme(themeId ?? '');
    const allThemes = useThemes();

    // Get profile data
    const profile = useProfileStore(selectActiveProfile);
    const themeLevels = useProfileStore(selectThemeLevels);

    // Calculate accessible level for this theme
    const allThemeIds = allThemes.map(t => t.id);
    const accessibleLevel = getAccessibleLevelForTheme(themeId ?? '', themeLevels, allThemeIds);

    // Get completed exercise IDs from IndexedDB
    const [completedExerciseIds, setCompletedExerciseIds] = useState<Set<string>>(new Set());

    // Fetch completed exercises - refreshes when location changes (navigation)
    const fetchCompletedExercises = useCallback(() => {
        if (!themeId || !profile) {
            setCompletedExerciseIds(new Set());
            return;
        }

        // Fetch completed exercises from IndexedDB
        getExerciseResultsByTheme(themeId)
            .then((results: ExerciseResult[]) => {
                const completedIds = new Set(
                    results
                        .filter((r) => r.correct)
                        .map((r) => r.exerciseId)
                );
                setCompletedExerciseIds(completedIds);
            })
            .catch(() => {
                setCompletedExerciseIds(new Set());
            });
    }, [themeId, profile]);

    useEffect(() => {
        fetchCompletedExercises();
    }, [fetchCompletedExercises, location.key]);

    // Count exercises per level
    const exerciseCounts = useMemo(
        () => countExercisesPerLevel(exercises),
        [exercises]
    );

    // Count completed per level
    const completedCounts = useMemo(
        () => countCompletedPerLevel(exercises, completedExerciseIds),
        [exercises, completedExerciseIds]
    );

    // Handle level card click
    const handleLevelClick = (level: number) => {
        // Check if level is accessible
        if (!isLevelAccessible(themeId ?? '', level, themeLevels, allThemeIds)) {
            return; // Don't navigate if level is locked
        }
        // Navigate to exercise page with level filter
        navigate(ROUTES.EXERCISE_WITH_LEVEL(themeId ?? '', level));
    };

    // Loading state if theme not found
    if (!theme) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {t('level.themeNotFound', 'Theme not found')}
                </h1>
                <p className="text-gray-600 mb-8">
                    {t('level.themeNotFoundDesc', 'The selected theme could not be found.')}
                </p>
                <button
                    onClick={() => navigate(ROUTES.THEMES)}
                    className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {t('navigation.backToThemes', 'Back to Themes')}
                </button>
            </div>
        );
    }

    // Calculate total exercises
    const totalExercises = exercises.length;
    const totalCompleted = Object.values(completedCounts).reduce((sum, count) => sum + count, 0);

    return (
        <div
            className="min-h-screen bg-gray-50 p-4"
            role="main"
            aria-labelledby="level-select-title"
        >
            {/* Header */}
            <header className="max-w-2xl mx-auto mb-6">
                {/* Back button */}
                <button
                    onClick={() => navigate(ROUTES.THEMES)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 mb-4"
                    aria-label={t('navigation.backToThemes', 'Back to themes')}
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

                {/* Theme header */}
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl" role="img" aria-hidden="true">
                        {theme.icon}
                    </span>
                    <div>
                        <h1
                            id="level-select-title"
                            className="text-2xl font-bold text-gray-900"
                        >
                            {theme.name}
                        </h1>
                        <p className="text-gray-600 text-sm">
                            {theme.description}
                        </p>
                    </div>
                </div>

                {/* Progress summary */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                            {t('level.totalProgress', 'Total Progress')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                            {totalCompleted}/{totalExercises} {t('level.exercises', 'exercises')}
                        </span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${totalExercises > 0
                                    ? Math.round((totalCompleted / totalExercises) * 100)
                                    : 0}%`,
                                backgroundColor: theme.color,
                            }}
                            role="progressbar"
                            aria-valuenow={totalExercises > 0 ? Math.round((totalCompleted / totalExercises) * 100) : 0}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                </div>

                <p className="text-gray-600 mt-4">
                    {t('level.selectPrompt', 'Select a difficulty level to start practicing.')}
                </p>
            </header>

            {/* Level grid */}
            <div
                className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4"
                role="list"
                aria-label={t('level.levelList', 'Available difficulty levels')}
            >
                {[1, 2, 3, 4].map((level) => {
                    const isUnlocked = level <= accessibleLevel;
                    const exerciseCount = exerciseCounts[level] ?? 0;
                    const completedCount = completedCounts[level] ?? 0;
                    const isStarted = completedCount > 0;

                    return (
                        <div key={level} role="listitem">
                            <LevelCard
                                level={level}
                                exerciseCount={exerciseCount}
                                completedCount={completedCount}
                                isUnlocked={isUnlocked}
                                isStarted={isStarted}
                                onClick={() => handleLevelClick(level)}
                            />
                        </div>
                    );
                })}
            </div>

            {/* No exercises message */}
            {totalExercises === 0 && (
                <div className="max-w-2xl mx-auto mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-center">
                        {t('level.noExercisesForTheme', 'No exercises available for this theme yet.')}
                    </p>
                </div>
            )}
        </div>
    );
}

export default LevelSelectPage;