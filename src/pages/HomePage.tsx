/**
 * Home page component.
 * 
 * This is the main landing page for the trainer application.
 * Shows profile creation if no active profile, otherwise shows dashboard.
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { useProfileStore, selectActiveProfile, selectTotalStars, selectCurrentStreak, selectThemeLevels } from '@core/stores/profileStore';
import { ProfileCreation } from '@core/components/profile';
import { Modal } from '@core/components/ui';
import { useThemes, useAppConfig } from '@core/config';
import { calculateGlobalLevel } from '@core/utils/gamification';
import { parseSaveGameFile, validateSaveGame, type SaveGamePayload } from '@core/stores/profilePersistence';

/**
 * Get fire emoji count based on streak length.
 */
function getFireCount(streak: number): number {
    if (streak >= 7) return 3;
    if (streak >= 3) return 2;
    if (streak >= 1) return 1;
    return 0;
}

/**
 * Dashboard component shown when profile exists.
 */
function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfileStore(selectActiveProfile);
    const totalStars = useProfileStore(selectTotalStars);
    const currentStreak = useProfileStore(selectCurrentStreak);
    const themeLevels = useProfileStore(selectThemeLevels);
    const exportSaveGame = useProfileStore((state) => state.exportSaveGame);
    const importSaveGameFromStore = useProfileStore((state) => state.importSaveGame);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get app-specific configuration
    const appConfig = useAppConfig();
    const primaryColor = appConfig.display.primaryColor;
    const appName = appConfig.name;
    const levelTerm = appConfig.terminology.level;

    // Get all themes for global level calculation
    const themes = useThemes();
    const allThemeIds = themes.map(t => t.id);
    const globalLevel = calculateGlobalLevel(themeLevels, allThemeIds);

    const fireCount = getFireCount(currentStreak);
    const fires = '🔥'.repeat(fireCount);

    const handleSaveGame = async () => {
        setIsSaving(true);
        try {
            const data = await exportSaveGame();
            if (data) {
                const date = new Date().toISOString().split('T')[0];
                const nickname = profile?.nickname ?? 'player';
                const filename = `daz-spielstand-${nickname}-${date}.json`;
                downloadSaveGame(data, filename);
            }
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Open the load game dialog.
     */
    const handleOpenLoadDialog = () => {
        setLoadError(null);
        setSelectedFile(null);
        setShowLoadDialog(true);
    };

    /**
     * Handle file selection from input.
     */
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoadError(null);
        setIsLoading(true);

        try {
            // Parse and validate the file
            const data = await parseSaveGameFile(file);
            const validation = validateSaveGame(data);

            if (!validation.valid) {
                setLoadError(validation.error ?? t('profile.invalidFile', 'Invalid file'));
                return;
            }

            setSelectedFile(file);
        } catch (error) {
            setLoadError(
                error instanceof Error
                    ? error.message
                    : t('profile.invalidFile', 'Invalid file')
            );
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Confirm and execute the game load.
     */
    const handleConfirmLoad = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setLoadError(null);

        try {
            const data = await parseSaveGameFile(selectedFile);
            const result = await importSaveGameFromStore(data as SaveGamePayload);

            if (result.success) {
                setShowLoadDialog(false);
                // Reload the page to reflect the new profile
                window.location.reload();
            } else {
                setLoadError(result.error ?? t('profile.importFailed', 'Import failed'));
            }
        } catch (error) {
            setLoadError(
                error instanceof Error
                    ? error.message
                    : t('profile.importFailed', 'Import failed')
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex flex-col items-center min-h-[80vh] p-4"
            role="main"
            aria-labelledby="dashboard-title"
        >
            {/* Welcome Header */}
            <div className="flex items-center gap-3 mb-6">
                <span className="text-5xl" role="img" aria-label={t('profile.avatar', 'Avatar')}>
                    {profile?.avatarId}
                </span>
                <div>
                    <h1 id="dashboard-title" className="text-2xl font-bold text-gray-900">
                        {t('dashboard.welcome', 'Welcome back')}, {profile?.nickname}!
                    </h1>
                    <p className="text-sm" style={{ color: primaryColor }}>
                        {appName}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-6">
                {/* Global Level Card */}
                <div
                    className="border rounded-xl p-4 text-center"
                    style={{ backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}30` }}
                >
                    <div className="text-3xl mb-1" role="img" aria-label={t('stats.level', 'Level')}>
                        🎯
                    </div>
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>{globalLevel}</div>
                    <div className="text-sm" style={{ color: primaryColor }}>{levelTerm}</div>
                </div>

                {/* Total Stars Card */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-1" role="img" aria-label={t('stats.stars', 'Stars')}>
                        ⭐
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">{totalStars}</div>
                    <div className="text-sm text-yellow-600">{t('stats.totalStars', 'Stars')}</div>
                </div>

                {/* Current Streak Card */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-1" role="img" aria-label={t('stats.streak', 'Streak')}>
                        {fires || '🔥'}
                    </div>
                    <div className="text-2xl font-bold text-orange-700">{currentStreak}</div>
                    <div className="text-sm text-orange-600">{t('stats.dayStreak', 'Day Streak')}</div>
                </div>
            </div>

            {/* Streak Status */}
            {currentStreak > 0 && (
                <p className="text-gray-600 mb-6 text-center">
                    {t('dashboard.streakActive', 'Keep it up! Your streak is active.')}
                </p>
            )}

            {/* Action Buttons */}
            <div className="grid gap-4 w-full max-w-sm">
                <button
                    onClick={() => navigate(ROUTES.THEMES)}
                    className="w-full py-3 px-4 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{ backgroundColor: primaryColor }}
                >
                    {t('dashboard.startExercises', 'Start Exercises')}
                </button>

                <button
                    onClick={() => navigate(ROUTES.DAILY_CHALLENGE)}
                    className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                >
                    {t('dashboard.dailyChallenge', 'Daily Challenge')}
                </button>

                <button
                    onClick={() => navigate(ROUTES.PROGRESS)}
                    className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                    {t('dashboard.progress', 'Progress')}
                </button>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => navigate(ROUTES.BADGES)}
                        className="py-3 px-4 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                    >
                        {t('dashboard.badges', 'Badges')}
                    </button>
                    <button
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="py-3 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        {t('dashboard.settings', 'Settings')}
                    </button>
                </div>

                <button
                    onClick={handleSaveGame}
                    disabled={isSaving}
                    className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? t('settings.saving', 'Saving...') : t('settings.saveButton', 'Save Game')}
                </button>

                {/* Load Game Button */}
                <button
                    onClick={handleOpenLoadDialog}
                    className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                >
                    {t('dashboard.loadGame', 'Load Game')}
                </button>
            </div>

            {/* Load Game Modal */}
            <Modal
                isOpen={showLoadDialog}
                onClose={() => setShowLoadDialog(false)
                }
                title={t('dashboard.loadGame', 'Load Game')}
                size="md"
            >
                <div className="space-y-4">
                    {/* Warning Message */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl" role="img" aria-label={t('common.warning', 'Warning')}>
                                ⚠️
                            </span>
                            <div>
                                <p className="font-medium text-amber-800">
                                    {t('dashboard.loadWarning', 'Warning')}
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    {t('dashboard.loadWarningMessage', 'Your current game state will be overwritten. This action cannot be undone.')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* File Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('dashboard.selectFile', 'Select save file')}
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleFileSelect}
                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-describedby="file-help"
                        />
                        <p id="file-help" className="mt-1 text-xs text-gray-500">
                            {t('dashboard.fileHelp', 'Select a previously exported save game file (.json)')}
                        </p>
                    </div>

                    {/* Selected File Info */}
                    {selectedFile && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-green-600">✓</span>
                                <span className="text-sm text-green-700">
                                    {t('dashboard.fileValid', 'Valid save file selected')}: {selectedFile.name}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {loadError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <span className="text-red-600">✗</span>
                                <span className="text-sm text-red-700">{loadError}</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setShowLoadDialog(false)}
                            className="flex-1 py-2 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            {t('common.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleConfirmLoad}
                            disabled={!selectedFile || isLoading}
                            className="flex-1 py-2 px-4 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('common.loading', 'Loading...') : t('dashboard.loadConfirm', 'Load Game')}
                        </button>
                    </div>
                </div>
            </Modal >
        </div >
    );
}

/**
 * Download a save game file.
 */
function downloadSaveGame(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Home page component.
 * Displays profile creation or dashboard based on active profile.
 */
export function HomePage() {
    const activeProfile = useProfileStore(selectActiveProfile);

    if (!activeProfile) {
        return <ProfileCreation />;
    }

    return <Dashboard />;
}
