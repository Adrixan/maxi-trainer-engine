/**
 * Teacher Dashboard page.
 * 
 * Allows teachers to manage student profiles, view statistics,
 * and reset student progress.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { getAllProfiles, deleteProfile } from '@core/storage';
import type { UserProfile } from '@/types';

/**
 * Student statistics interface.
 */
interface StudentStats {
    totalStars: number;
    totalExercises: number;
    currentStreak: number;
    longestStreak: number;
    themesCompleted: number;
}

/**
 * Teacher dashboard page component.
 */
export function TeacherDashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [stats, setStats] = useState<Record<string, StudentStats>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetTarget, setResetTarget] = useState<string | null>(null);

    // Load all profiles
    useEffect(() => {
        const loadProfiles = async () => {
            try {
                const allProfiles = await getAllProfiles();
                setProfiles(allProfiles);

                // Calculate stats for each profile
                const profileStats: Record<string, StudentStats> = {};
                for (const profile of allProfiles) {
                    profileStats[profile.id] = {
                        totalStars: profile.totalStars,
                        totalExercises: Object.values(profile.themeProgress).reduce(
                            (sum, tp) => sum + (tp.exercisesCompleted || 0),
                            0
                        ),
                        currentStreak: profile.currentStreak,
                        longestStreak: profile.longestStreak,
                        themesCompleted: Object.values(profile.themeProgress || {}).filter(
                            (tp) => tp.exercisesCompleted > 0
                        ).length,
                    };
                }
                setStats(profileStats);
            } catch (error) {
                console.error('Failed to load profiles:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfiles();
    }, []);

    /**
     * Calculate total statistics across all profiles.
     */
    const getTotalStats = () => {
        return {
            totalStudents: profiles.length,
            totalStars: Object.values(stats).reduce((sum, s) => sum + s.totalStars, 0),
            totalExercises: Object.values(stats).reduce((sum, s) => sum + s.totalExercises, 0),
            avgStreak:
                profiles.length > 0
                    ? Object.values(stats).reduce((sum, s) => sum + s.currentStreak, 0) / profiles.length
                    : 0,
        };
    };

    /**
     * Handle profile selection.
     */
    const handleSelectProfile = (profile: UserProfile) => {
        setSelectedProfile(profile);
    };

    /**
     * Handle reset progress click.
     */
    const handleResetClick = (profileId: string) => {
        setResetTarget(profileId);
        setShowResetConfirm(true);
    };

    /**
     * Confirm and execute progress reset.
     */
    const handleConfirmReset = async () => {
        if (!resetTarget) return;

        try {
            // Delete the profile from IndexedDB
            await deleteProfile(resetTarget);

            // Remove from local state
            setProfiles((prev) => prev.filter((p) => p.id !== resetTarget));
            setStats((prev) => {
                const newStats = { ...prev };
                delete newStats[resetTarget];
                return newStats;
            });

            // If this was the selected profile, clear selection
            if (selectedProfile?.id === resetTarget) {
                setSelectedProfile(null);
            }
        } catch (error) {
            console.error('Failed to reset progress:', error);
        } finally {
            setShowResetConfirm(false);
            setResetTarget(null);
        }
    };

    /**
     * Navigate back to PIN page.
     */
    const handleBack = () => {
        navigate(ROUTES.TEACHER_PIN);
    };

    const totalStats = getTotalStats();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-spin">⏳</div>
                    <p className="text-gray-600">{t('common.loading', 'Loading...')}</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col items-center min-h-[80vh] p-4"
            role="main"
            aria-labelledby="dashboard-title"
        >
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            aria-label={t('common.back', 'Back')}
                        >
                            <span className="text-2xl">←</span>
                        </button>
                        <div>
                            <h1 id="dashboard-title" className="text-2xl font-bold text-gray-900">
                                {t('teacher.dashboardTitle', 'Teacher Dashboard')}
                            </h1>
                            <p className="text-gray-600">
                                {t('teacher.dashboardSubtitle', 'Manage student progress')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">👥</div>
                        <div className="text-2xl font-bold text-blue-700">{totalStats.totalStudents}</div>
                        <div className="text-sm text-blue-600">{t('teacher.students', 'Students')}</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">⭐</div>
                        <div className="text-2xl font-bold text-yellow-700">{totalStats.totalStars}</div>
                        <div className="text-sm text-yellow-600">{t('teacher.totalStars', 'Total Stars')}</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">📝</div>
                        <div className="text-2xl font-bold text-purple-700">{totalStats.totalExercises}</div>
                        <div className="text-sm text-purple-600">{t('teacher.exercises', 'Exercises')}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                        <div className="text-3xl mb-1">🔥</div>
                        <div className="text-2xl font-bold text-orange-700">
                            {Math.round(totalStats.avgStreak * 10) / 10}
                        </div>
                        <div className="text-sm text-orange-600">{t('teacher.avgStreak', 'Avg Streak')}</div>
                    </div>
                </div>

                {/* Student List */}
                {profiles.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                        <div className="text-5xl mb-4">📭</div>
                        <p className="text-gray-600">{t('teacher.noStudents', 'No students found')}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            {t('teacher.noStudentsHint', 'Students will appear here after creating profiles')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('teacher.studentList', 'Student List')}
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full" role="table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                            {t('teacher.student', 'Student')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                            ⭐ {t('teacher.stars', 'Stars')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                            📝 {t('teacher.exercises', 'Exercises')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                            🔥 {t('teacher.streak', 'Streak')}
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                                            {t('teacher.actions', 'Actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {profiles.map((profile) => {
                                        const profileStats = stats[profile.id];
                                        return (
                                            <tr
                                                key={profile.id}
                                                className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${selectedProfile?.id === profile.id ? 'bg-blue-50' : ''
                                                    }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => handleSelectProfile(profile)}
                                                        className="flex items-center gap-3 text-left hover:text-blue-600"
                                                    >
                                                        <span className="text-2xl">{profile.avatarId}</span>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {profile.nickname}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(profile.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-yellow-600 font-medium">
                                                    {profileStats?.totalStars || 0}
                                                </td>
                                                <td className="px-4 py-3 text-purple-600 font-medium">
                                                    {profileStats?.totalExercises || 0}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${(profileStats?.currentStreak || 0) > 0
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                    >
                                                        🔥 {profileStats?.currentStreak || 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleResetClick(profile.id)}
                                                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                                        aria-label={`${t('teacher.resetProgress', 'Reset progress')} for ${profile.nickname}`}
                                                    >
                                                        {t('teacher.reset', 'Reset')}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Selected Profile Details */}
                {selectedProfile && (
                    <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{selectedProfile.avatarId}</span>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {selectedProfile.nickname}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {t('teacher.memberSince', 'Member since')}{' '}
                                        {new Date(selectedProfile.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedProfile(null)}
                                className="text-gray-500 hover:text-gray-700"
                                aria-label={t('common.close', 'Close')}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Theme Progress */}
                        <h4 className="font-medium text-gray-900 mb-3">
                            {t('teacher.themeProgress', 'Theme Progress')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(selectedProfile.themeProgress || {}).map(([themeId, progress]) => (
                                <div key={themeId} className="bg-gray-50 rounded-lg p-3">
                                    <div className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                        {themeId.replace(/-/g, ' ')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-500 h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(
                                                        ((progress.exercisesCompleted || 0) /
                                                            (progress.exercisesTotal || 1)) *
                                                        100,
                                                        100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600">
                                            {progress.exercisesCompleted || 0}/{progress.exercisesTotal || 0}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        ⭐ {progress.starsEarned || 0}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reset Confirmation Modal */}
                {showResetConfirm && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="reset-modal-title"
                    >
                        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                            <h2
                                id="reset-modal-title"
                                className="text-xl font-bold text-gray-900 mb-4"
                            >
                                {t('teacher.resetProgress', 'Reset Progress')}
                            </h2>
                            <p className="text-gray-600 mb-6">
                                {t(
                                    'teacher.resetWarning',
                                    'Are you sure you want to reset this student\'s progress? This action cannot be undone.'
                                )}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowResetConfirm(false);
                                        setResetTarget(null);
                                    }}
                                    className="flex-1 py-2 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmReset}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                                >
                                    {t('teacher.reset', 'Reset')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
