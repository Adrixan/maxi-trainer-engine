/**
 * Progress page component.
 * 
 * Displays user's learning progress with enhanced analytics including:
 * - Progress graph showing activity over time
 * - Results table with exercise details
 * - Analytics tab with strengths/weaknesses and trends
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { useProfileStore, selectActiveProfile } from '@core/stores/profileStore';
import { getAllExerciseResults } from '@core/storage';
import { useThemes, useAreas } from '@core/config';
import type { ExerciseResult, ThemeId, ObservationAreaId } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Daily progress data for the graph.
 */
interface DailyProgress {
    date: string;
    exercisesCompleted: number;
    starsEarned: number;
    correctAnswers: number;
    totalTimeSeconds: number;
}

/**
 * Aggregated exercise result for the table.
 */
interface ExerciseRow {
    id: string;
    exerciseId: string;
    themeName: string;
    themeId: ThemeId;
    areaName: string;
    areaId: ObservationAreaId;
    level: number;
    correct: boolean;
    score: number;
    attempts: number;
    timeSpentSeconds: number;
    completedAt: string;
}

/**
 * Theme performance data.
 */
interface ThemePerformance {
    themeId: ThemeId;
    themeName: string;
    exerciseCount: number;
    accuracy: number;
    avgTime: number;
    avgScore: number;
    trend: 'up' | 'down' | 'stable';
}

/**
 * Area performance data.
 */
interface AreaPerformance {
    areaId: ObservationAreaId;
    areaName: string;
    exerciseCount: number;
    accuracy: number;
    avgTime: number;
}

/**
 * Weekly accuracy comparison.
 */
interface WeeklyAccuracy {
    week: string;
    startDate: string;
    endDate: string;
    accuracy: number;
    exerciseCount: number;
    avgTime: number;
}

type TabId = 'graph' | 'table' | 'analytics';

// ============================================================================
// Component
// ============================================================================

/**
 * Progress page component.
 * Shows progress graph and exercise results table.
 */
export function ProgressPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfileStore(selectActiveProfile);
    const themes = useThemes();
    const areas = useAreas();

    const [results, setResults] = useState<ExerciseResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>('graph');

    // Load exercise results
    useEffect(() => {
        async function loadResults() {
            if (!profile) return;

            try {
                const allResults = await getAllExerciseResults();
                // Filter to current profile
                const profileResults = allResults.filter(
                    r => r.childProfileId === profile.id
                );
                setResults(profileResults);
            } catch { /* Silently ignore load errors */ } finally {
                setIsLoading(false);
            }
        }

        loadResults();
    }, [profile]);

    // Aggregate daily progress for graph
    const dailyProgress = useMemo(() => {
        const dayMap = new Map<string, DailyProgress>();

        // Initialize last 30 days
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            if (dateStr) {
                dayMap.set(dateStr, {
                    date: dateStr,
                    exercisesCompleted: 0,
                    starsEarned: 0,
                    correctAnswers: 0,
                    totalTimeSeconds: 0,
                });
            }
        }

        // Aggregate results by day
        for (const result of results) {
            const dateStr = result.completedAt.split('T')[0];
            if (!dateStr) continue;
            const dayData = dayMap.get(dateStr);
            if (dayData) {
                dayData.exercisesCompleted += 1;
                dayData.starsEarned += result.score;
                dayData.totalTimeSeconds += result.timeSpentSeconds;
                if (result.correct) {
                    dayData.correctAnswers += 1;
                }
            }
        }

        return Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [results]);

    // Transform results for table
    const tableRows = useMemo(() => {
        return results
            .map(result => {
                const theme = themes.find(t => t.id === result.themeId);
                const area = areas.find(a => a.id === result.areaId);

                return {
                    id: result.id,
                    exerciseId: result.exerciseId,
                    themeName: theme?.name ?? result.themeId,
                    themeId: result.themeId,
                    areaName: area?.name ?? result.areaId,
                    areaId: result.areaId,
                    level: result.level,
                    correct: result.correct,
                    score: result.score,
                    attempts: result.attempts,
                    timeSpentSeconds: result.timeSpentSeconds,
                    completedAt: result.completedAt,
                };
            })
            .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    }, [results, themes, areas]);

    // Calculate summary stats
    const stats = useMemo(() => {
        const totalExercises = results.length;
        const totalStars = results.reduce((sum, r) => sum + r.score, 0);
        const correctCount = results.filter(r => r.correct).length;
        const accuracy = totalExercises > 0
            ? Math.round((correctCount / totalExercises) * 100)
            : 0;
        const totalTime = results.reduce((sum, r) => sum + r.timeSpentSeconds, 0);

        return {
            totalExercises,
            totalStars,
            correctCount,
            accuracy,
            totalTime,
        };
    }, [results]);

    // Calculate theme performance (strengths & weaknesses)
    const themePerformance = useMemo((): ThemePerformance[] => {
        const themeMap = new Map<ThemeId, { count: number; correct: number; totalTime: number; totalScore: number; dates: string[] }>();

        results.forEach(r => {
            const existing = themeMap.get(r.themeId) || { count: 0, correct: 0, totalTime: 0, totalScore: 0, dates: [] };
            existing.count++;
            existing.totalTime += r.timeSpentSeconds;
            existing.totalScore += r.score;
            existing.dates.push(r.completedAt);
            if (r.correct) existing.correct++;
            themeMap.set(r.themeId, existing);
        });

        const performances: ThemePerformance[] = [];
        themeMap.forEach((data, themeId) => {
            const theme = themes.find(t => t.id === themeId);
            const accuracy = data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0;
            const avgTime = data.count > 0 ? Math.round(data.totalTime / data.count) : 0;
            const avgScore = data.count > 0 ? data.totalScore / data.count : 0;

            // Calculate trend (compare first half vs second half of attempts)
            const sortedDates = data.dates.sort();
            const mid = Math.floor(sortedDates.length / 2);
            const firstHalf = data.dates.slice(0, mid);
            const secondHalf = data.dates.slice(mid);

            let trend: 'up' | 'down' | 'stable' = 'stable';
            if (firstHalf.length >= 3 && secondHalf.length >= 3) {
                const firstHalfCorrect = results.filter(r => firstHalf.includes(r.completedAt) && r.themeId === themeId && r.correct).length;
                const secondHalfCorrect = results.filter(r => secondHalf.includes(r.completedAt) && r.themeId === themeId && r.correct).length;
                const firstHalfAcc = firstHalf.length > 0 ? (firstHalfCorrect / firstHalf.length) * 100 : 0;
                const secondHalfAcc = secondHalf.length > 0 ? (secondHalfCorrect / secondHalf.length) * 100 : 0;

                if (secondHalfAcc - firstHalfAcc > 10) trend = 'up';
                else if (firstHalfAcc - secondHalfAcc > 10) trend = 'down';
            }

            performances.push({
                themeId,
                themeName: theme?.name ?? themeId,
                exerciseCount: data.count,
                accuracy,
                avgTime,
                avgScore,
                trend,
            });
        });

        return performances.sort((a, b) => b.accuracy - a.accuracy);
    }, [results, themes]);

    // Calculate area performance
    const areaPerformance = useMemo((): AreaPerformance[] => {
        const areaMap = new Map<ObservationAreaId, { count: number; correct: number; totalTime: number }>();

        results.forEach(r => {
            const existing = areaMap.get(r.areaId) || { count: 0, correct: 0, totalTime: 0 };
            existing.count++;
            existing.totalTime += r.timeSpentSeconds;
            if (r.correct) existing.correct++;
            areaMap.set(r.areaId, existing);
        });

        const performances: AreaPerformance[] = [];
        areaMap.forEach((data, areaId) => {
            const area = areas.find(a => a.id === areaId);
            const accuracy = data.count > 0 ? Math.round((data.correct / data.count) * 100) : 0;
            const avgTime = data.count > 0 ? Math.round(data.totalTime / data.count) : 0;

            performances.push({
                areaId,
                areaName: area?.name ?? areaId,
                exerciseCount: data.count,
                accuracy,
                avgTime,
            });
        });

        return performances.sort((a, b) => b.accuracy - a.accuracy);
    }, [results, areas]);

    // Calculate weekly accuracy (last 4 weeks)
    const weeklyAccuracy = useMemo((): WeeklyAccuracy[] => {
        const weeks: WeeklyAccuracy[] = [];
        const today = new Date();

        for (let w = 3; w >= 0; w--) {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            const weekStart = new Date(weekEnd);
            weekStart.setDate(weekStart.getDate() - 7);

            const startStr = weekStart.toISOString().split('T')[0] ?? '';
            const endStr = weekEnd.toISOString().split('T')[0] ?? '';

            const weekResults = results.filter(r => {
                const dateParts = r.completedAt.split('T');
                const dateStr = dateParts[0];
                return dateStr && dateStr >= startStr && dateStr <= endStr;
            });

            const correctCount = weekResults.filter(r => r.correct).length;
            const avgTime = weekResults.length > 0
                ? Math.round(weekResults.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / weekResults.length)
                : 0;

            weeks.push({
                week: `Week ${4 - w}`,
                startDate: startStr,
                endDate: endStr,
                accuracy: weekResults.length > 0 ? Math.round((correctCount / weekResults.length) * 100) : 0,
                exerciseCount: weekResults.length,
                avgTime,
            });
        }

        return weeks;
    }, [results]);

    // Get strengths (themes with accuracy >= 70%)
    const strengths = themePerformance.filter(t => t.accuracy >= 70);

    // Get weaknesses (themes with accuracy < 50%)
    const weaknesses = themePerformance.filter(t => t.accuracy < 50 && t.exerciseCount >= 3);

    // Calculate max values for graph scaling
    const maxExercises = Math.max(...dailyProgress.map(d => d.exercisesCompleted), 1);

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
                <p className="text-gray-500">{t('progress.noProfile', 'Please create a profile to view progress.')}</p>
                <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('common.backHome', 'Back to Home')}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[80vh] p-4 max-w-4xl mx-auto" role="main">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {t('progress.title', 'Progress')}
                </h1>
                <button
                    onClick={() => navigate(ROUTES.HOME)}
                    className="py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                    {t('common.backHome', 'Back to Home')}
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-700">{stats.totalExercises}</div>
                    <div className="text-sm text-blue-600">{t('progress.totalExercises', 'Exercises')}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{stats.totalStars}</div>
                    <div className="text-sm text-yellow-600">{t('progress.totalStars', 'Stars')}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">{stats.accuracy}%</div>
                    <div className="text-sm text-green-600">{t('progress.accuracy', 'Accuracy')}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700">{formatTime(stats.totalTime)}</div>
                    <div className="text-sm text-purple-600">{t('progress.timeSpent', 'Time')}</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 mb-4" role="tablist" aria-label={t('progress.tabs', 'Progress sections')}>
                <button
                    onClick={() => setActiveTab('graph')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'graph'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    aria-selected={activeTab === 'graph'}
                    role="tab"
                >
                    {t('progress.graphTab', 'Progress Graph')}
                </button>
                <button
                    onClick={() => setActiveTab('table')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'table'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    aria-selected={activeTab === 'table'}
                    role="tab"
                >
                    {t('progress.tableTab', 'Exercise Results')}
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === 'analytics'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    aria-selected={activeTab === 'analytics'}
                    role="tab"
                >
                    {t('progress.analyticsTab', 'Analytics')}
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">{t('common.loading', 'Loading...')}</div>
                </div>
            ) : activeTab === 'graph' ? (
                <ProgressGraph
                    data={dailyProgress}
                    maxExercises={maxExercises}
                />
            ) : activeTab === 'table' ? (
                <ResultsTable rows={tableRows} />
            ) : (
                <AnalyticsTab
                    themePerformance={themePerformance}
                    areaPerformance={areaPerformance}
                    weeklyAccuracy={weeklyAccuracy}
                    strengths={strengths}
                    weaknesses={weaknesses}
                />
            )}
        </div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Progress graph component.
 * Shows a bar chart of exercises completed over time.
 */
function ProgressGraph({
    data,
    maxExercises,
}: {
    data: DailyProgress[];
    maxExercises: number;
}) {
    const { t } = useTranslation();

    if (data.every(d => d.exercisesCompleted === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <span className="text-4xl mb-2">📊</span>
                <p>{t('progress.noData', 'No exercise data yet. Start practicing to see your progress!')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('progress.last30Days', 'Last 30 Days')}
            </h2>

            {/* Graph Container */}
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    {/* Y-axis labels */}
                    <div className="flex">
                        <div className="w-12 flex flex-col justify-between h-32 text-xs text-gray-500 pr-2">
                            <span>{maxExercises}</span>
                            <span>{Math.round(maxExercises / 2)}</span>
                            <span>0</span>
                        </div>

                        {/* Bars */}
                        <div className="flex-1 flex items-end gap-1 h-32 border-l border-b border-gray-200 pl-2 pb-2">
                            {data.map((day, index) => {
                                const heightPercent = (day.exercisesCompleted / maxExercises) * 100;
                                const showLabel = index % 5 === 0; // Show every 5th date

                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 flex flex-col items-center"
                                        title={`${day.date}: ${day.exercisesCompleted} exercises, ${day.starsEarned} stars`}
                                    >
                                        <div
                                            className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }}
                                        />
                                        {showLabel && (
                                            <span className="text-xs text-gray-400 mt-1 transform -rotate-45 origin-left">
                                                {formatDate(day.date)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded" />
                    <span>{t('progress.exercisesCompleted', 'Exercises Completed')}</span>
                </div>
            </div>
        </div>
    );
}

/**
 * Results table component.
 * Shows detailed results for each exercise.
 */
function ResultsTable({ rows }: { rows: ExerciseRow[] }) {
    const { t } = useTranslation();

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <span className="text-4xl mb-2">📝</span>
                <p>{t('progress.noResults', 'No exercise results yet. Complete some exercises to see your results!')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                                {t('progress.table.theme', 'Theme')}
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                                {t('progress.table.area', 'Area')}
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                {t('progress.table.level', 'Level')}
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                {t('progress.table.result', 'Result')}
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                {t('progress.table.stars', 'Stars')}
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                {t('progress.table.attempts', 'Attempts')}
                            </th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">
                                {t('progress.table.time', 'Time')}
                            </th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">
                                {t('progress.table.date', 'Date')}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-900">
                                    {row.themeName}
                                </td>
                                <td className="px-4 py-3 text-gray-600">
                                    {row.areaName}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-900">
                                    {row.level}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${row.correct
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}>
                                        {row.correct ? '✓' : '✗'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="text-yellow-500">
                                        {'⭐'.repeat(row.score)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                    {row.attempts}
                                </td>
                                <td className="px-4 py-3 text-center text-gray-600">
                                    {formatTime(row.timeSpentSeconds)}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {formatDateTime(row.completedAt)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Analytics tab component.
 * Shows strengths, weaknesses, and weekly trends.
 */
function AnalyticsTab({
    themePerformance,
    areaPerformance,
    weeklyAccuracy,
    strengths,
    weaknesses,
}: {
    themePerformance: ThemePerformance[];
    areaPerformance: AreaPerformance[];
    weeklyAccuracy: WeeklyAccuracy[];
    strengths: ThemePerformance[];
    weaknesses: ThemePerformance[];
}) {
    const { t } = useTranslation();

    const hasData = themePerformance.length > 0;

    if (!hasData) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <span className="text-4xl mb-2">📊</span>
                <p>{t('progress.noData', 'No exercise data yet. Start practicing to see your analytics!')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Strengths */}
            {strengths.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>💪</span>
                        {t('progress.analytics.strengths', 'Your Strengths')}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {strengths.map(s => (
                            <div key={s.themeId} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                                <span className="font-medium text-gray-800">{s.themeName}</span>
                                <span className="text-green-600 font-bold">{s.accuracy}%</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Weaknesses */}
            {weaknesses.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🎯</span>
                        {t('progress.analytics.needsWork', 'Needs More Practice')}
                    </h2>
                    <div className="space-y-2">
                        {weaknesses.map(w => (
                            <div key={w.themeId} className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-800">{w.themeName}</span>
                                    <span className="text-red-600 font-bold">{w.accuracy}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500 rounded-full"
                                        style={{ width: `${w.accuracy}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {w.exerciseCount} {t('progress.analytics.exercises', 'exercises')}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Weekly Progress */}
            <section className="bg-white border border-gray-200 rounded-xl p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📈</span>
                    {t('progress.analytics.weeklyProgress', 'Weekly Progress')}
                </h2>
                <div className="space-y-3">
                    {weeklyAccuracy.map((week) => (
                        <div key={week.week} className="flex items-center gap-3">
                            <div className="w-16 text-sm text-gray-600">{week.week}</div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${week.accuracy >= 70 ? 'bg-green-500' :
                                            week.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${week.accuracy}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-16 text-right">
                                <span className={`font-bold ${week.accuracy >= 70 ? 'text-green-600' :
                                    week.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {week.accuracy}%
                                </span>
                            </div>
                            <div className="w-20 text-right text-xs text-gray-500">
                                {week.exerciseCount} {t('progress.analytics.ex', 'ex')}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Theme Performance Table */}
            {themePerformance.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>🎨</span>
                        {t('progress.analytics.themePerformance', 'Theme Performance')}
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm" role="table" aria-label={t('progress.analytics.themePerformance', 'Theme performance')}>
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium text-gray-700">{t('progress.table.theme', 'Theme')}</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">{t('progress.analytics.exercises', 'Ex.')}</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">{t('progress.accuracy', 'Accuracy')}</th>
                                    <th className="px-3 py-2 text-right font-medium text-gray-700">{t('progress.analytics.avgTime', 'Avg Time')}</th>
                                    <th className="px-3 py-2 text-center font-medium text-gray-700">{t('progress.analytics.trend', 'Trend')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {themePerformance.map(tp => (
                                    <tr key={tp.themeId} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium text-gray-800">{tp.themeName}</td>
                                        <td className="px-3 py-2 text-right text-gray-600">{tp.exerciseCount}</td>
                                        <td className="px-3 py-2 text-right">
                                            <span className={`font-medium ${tp.accuracy >= 70 ? 'text-green-600' :
                                                tp.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {tp.accuracy}%
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600">{formatTime(tp.avgTime)}</td>
                                        <td className="px-3 py-2 text-center">
                                            <span title={t('progress.analytics.trendUp', 'Improving')}>
                                                {tp.trend === 'up' ? '📈' : tp.trend === 'down' ? '📉' : '➡️'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Area Performance */}
            {areaPerformance.length > 0 && (
                <section className="bg-white border border-gray-200 rounded-xl p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <span>📋</span>
                        {t('progress.analytics.areaPerformance', 'Area Performance')}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {areaPerformance.map(ap => (
                            <div key={ap.areaId} className="bg-gray-50 rounded-lg p-3 text-center">
                                <div className="font-medium text-gray-800 text-sm mb-1">{ap.areaName}</div>
                                <div className={`text-xl font-bold ${ap.accuracy >= 70 ? 'text-green-600' :
                                    ap.accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {ap.accuracy}%
                                </div>
                                <div className="text-xs text-gray-500">
                                    {ap.exerciseCount} {t('progress.analytics.ex', 'ex')}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds to a human-readable time string.
 */
function formatTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return remainingSeconds > 0
            ? `${minutes}m ${remainingSeconds}s`
            : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`;
}

/**
 * Format date string to a shorter format.
 */
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

/**
 * Format datetime string to a readable format.
 */
function formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
