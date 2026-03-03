/**
 * Settings page component.
 * 
 * Displays and manages application settings including
 * accessibility options and save/load game functionality.
 */

import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { AccessibilitySettings } from '@core/components/accessibility';
import { Modal, ModalFooter } from '@core/components/ui';
import {
    useProfileStore,
    selectActiveProfile,
    downloadSaveGame,
    parseSaveGameFile,
} from '@core/stores';
import type { SaveGamePayload } from '@core/stores';
import {
    useAppStore,
    selectSoundEnabled,
} from '@core/stores/appStore';
import { playCorrect } from '@core/utils/sounds';

/**
 * Settings page component.
 * Allows users to configure app preferences including accessibility settings
 * and save/load game functionality.
 */
export function SettingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const activeProfile = useProfileStore(selectActiveProfile);
    const exportSaveGame = useProfileStore((state) => state.exportSaveGame);
    const importSaveGame = useProfileStore((state) => state.importSaveGame);

    // Sound settings
    const soundEnabled = useAppStore(selectSoundEnabled);
    const toggleSound = useAppStore((state) => state.toggleSound);

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showImportConfirm, setShowImportConfirm] = useState(false);
    const [pendingImportData, setPendingImportData] = useState<SaveGamePayload | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle sound toggle with preview
    const handleSoundToggle = useCallback(() => {
        toggleSound();
        // Play a preview sound when enabling
        if (!soundEnabled) {
            playCorrect(true);
        }
    }, [toggleSound, soundEnabled]);

    const handleSaveGame = useCallback(async () => {
        if (!activeProfile) return;

        setIsExporting(true);
        setError(null);

        try {
            const payload = await exportSaveGame();
            if (payload) {
                downloadSaveGame(payload);
                setSuccess(t('settings.saveSuccess', 'Game saved successfully!'));
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('settings.saveFailed', 'Failed to save game'));
        } finally {
            setIsExporting(false);
        }
    }, [activeProfile, exportSaveGame, t]);

    const handleLoadGame = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccess(null);

        try {
            const data: SaveGamePayload | null = await parseSaveGameFile(file);
            if (data) {
                // Show confirmation dialog before importing
                setPendingImportData(data);
                setShowImportConfirm(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('settings.invalidFile', 'Invalid save file'));
        } finally {
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [t]);

    // Handle the actual import after confirmation
    const handleConfirmImport = useCallback(async () => {
        if (!pendingImportData) return;

        setIsImporting(true);
        setError(null);
        setSuccess(null);
        setShowImportConfirm(false);

        try {
            const result = await importSaveGame(pendingImportData);
            if (result.success) {
                setSuccess(t('settings.loadSuccess', 'Game loaded successfully!'));
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(result.error || t('settings.loadFailed', 'Failed to load game'));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('settings.loadFailed', 'Failed to load game'));
        } finally {
            setIsImporting(false);
            setPendingImportData(null);
        }
    }, [pendingImportData, importSaveGame, t]);

    // Cancel import
    const handleCancelImport = useCallback(() => {
        setShowImportConfirm(false);
        setPendingImportData(null);
    }, []);

    return (
        <div
            className="flex flex-col items-center min-h-[80vh] p-4"
            role="main"
            id="main-content"
            aria-labelledby="settings-page-title"
        >
            <h1
                id="settings-page-title"
                className="text-2xl font-bold text-gray-900 mb-6"
            >
                {t('settings.title', 'Settings')}
            </h1>

            <div className="w-full max-w-2xl space-y-6">
                {/* Accessibility Settings */}
                <AccessibilitySettings />

                {/* Sound Settings */}
                <section
                    className="bg-white rounded-xl border border-gray-200 p-4"
                    aria-labelledby="sound-settings-title"
                >
                    <h2
                        id="sound-settings-title"
                        className="text-lg font-semibold text-gray-900 mb-4"
                    >
                        {t('settings.sound', 'Sound')}
                    </h2>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-800">
                                {t('settings.soundEffects', 'Sound Effects')}
                            </p>
                            <p className="text-sm text-gray-500">
                                {t('settings.soundEffectsDescription', 'Play sounds for correct/incorrect answers and achievements')}
                            </p>
                        </div>
                        <button
                            onClick={handleSoundToggle}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                            role="switch"
                            aria-checked={soundEnabled}
                            aria-label={t('settings.toggleSound', 'Toggle sound effects')}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </section>

                {/* Save Game Section */}
                {activeProfile && (
                    <section
                        className="bg-white rounded-xl border border-gray-200 p-4"
                        aria-labelledby="save-game-title"
                    >
                        <h2
                            id="save-game-title"
                            className="text-lg font-semibold text-gray-900 mb-4"
                        >
                            {t('settings.saveGame', 'Save Game')}
                        </h2>

                        {/* Status Messages */}
                        {error && (
                            <div
                                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}
                        {success && (
                            <div
                                className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
                                role="status"
                            >
                                {success}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleSaveGame}
                                disabled={isExporting || isImporting}
                                title={t('settings.exportDataTooltip', 'Download your profile, progress, and badges as a JSON file')}
                                className="py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting
                                    ? t('settings.saving', 'Saving...')
                                    : t('settings.exportData', 'Export Data')
                                }
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileSelect}
                                className="hidden"
                                aria-hidden="true"
                            />
                            <button
                                onClick={handleLoadGame}
                                disabled={isExporting || isImporting}
                                title={t('settings.importDataTooltip', 'Load profile data from a JSON file')}
                                className="py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting
                                    ? t('settings.loading', 'Loading...')
                                    : t('settings.importData', 'Import Data')
                                }
                            </button>
                        </div>

                        <p className="mt-3 text-sm text-gray-500">
                            {t('settings.saveDescription', 'Save your progress to a file or load a previously saved game.')}
                        </p>
                    </section>
                )}

                {/* Teacher Area Section */}
                <section
                    className="bg-white rounded-xl border border-gray-200 p-4"
                    aria-labelledby="teacher-area-title"
                >
                    <h2
                        id="teacher-area-title"
                        className="text-lg font-semibold text-gray-900 mb-4"
                    >
                        {t('settings.teacherArea', 'Teacher Area')}
                    </h2>

                    <p className="text-sm text-gray-500 mb-4">
                        {t('settings.teacherAreaDescription', 'Access the teacher dashboard to view student progress and statistics.')}
                    </p>

                    <button
                        onClick={() => navigate(ROUTES.TEACHER_PIN)}
                        className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                        🔐 {t('settings.openTeacherArea', 'Open Teacher Area')}
                    </button>
                </section>

                {/* Navigation */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="py-2 px-4 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        {t('common.backHome', 'Back to Home')}
                    </button>
                </div>
            </div>

            {/* Import Confirmation Modal */}
            <Modal
                isOpen={showImportConfirm}
                onClose={handleCancelImport}
                title={t('settings.importConfirmTitle', 'Import Game Data?')}
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        {t('settings.importConfirmMessage', 'Your current game progress will be overwritten by the imported data. This action cannot be undone.')}
                    </p>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-amber-800 text-sm font-medium">
                            ⚠️ {t('settings.importConfirmWarning', 'This will replace all your current progress, stars, badges, and exercise results.')}
                        </p>
                    </div>
                </div>
                <ModalFooter>
                    <button
                        onClick={handleCancelImport}
                        className="py-2 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={handleConfirmImport}
                        disabled={isImporting}
                        className="py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isImporting
                            ? t('settings.loading', 'Loading...')
                            : t('settings.importButton', 'Import')
                        }
                    </button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
