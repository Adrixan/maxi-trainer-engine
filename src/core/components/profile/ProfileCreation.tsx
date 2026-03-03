/**
 * Profile creation component.
 * 
 * Displays a form for creating a new user profile with nickname
 * and avatar selection, or loading an existing save game.
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useProfileStore,
    AVATAR_EMOJIS,
    MAX_NICKNAME_LENGTH,
    parseSaveGameFile,
} from '@core/stores';

/**
 * Profile creation component.
 * Shows nickname input, avatar picker, and action buttons.
 */
export function ProfileCreation() {
    const { t } = useTranslation();
    const createProfile = useProfileStore((state) => state.createProfile);
    const importSaveGame = useProfileStore((state) => state.importSaveGame);

    const [nickname, setNickname] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const createButtonRef = useRef<HTMLButtonElement>(null);

    const trimmedNickname = nickname.trim();
    const isValid = trimmedNickname.length > 0 && selectedAvatar !== null;

    // Focus create button when avatar is selected and nickname is valid
    const handleAvatarSelect = useCallback((emoji: string) => {
        setSelectedAvatar(emoji);
        // Move focus to create button if nickname is already entered
        if (trimmedNickname.length > 0) {
            setTimeout(() => {
                createButtonRef.current?.focus();
            }, 50);
        }
    }, [trimmedNickname]);

    const handleCreateProfile = useCallback(() => {
        if (!isValid || !selectedAvatar) return;
        createProfile(trimmedNickname, selectedAvatar);
    }, [createProfile, trimmedNickname, selectedAvatar, isValid]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await parseSaveGameFile(file);
            if (data) {
                const result = await importSaveGame(data);
                if (!result.success) {
                    setError(result.error || t('profile.importFailed', 'Import failed'));
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('profile.invalidFile', 'Invalid file'));
        } finally {
            setIsLoading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [importSaveGame, t]);

    const handleLoadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div
            className="flex flex-col items-center min-h-[80vh] p-4"
            role="main"
            aria-labelledby="profile-creation-title"
        >
            {/* Title Section */}
            <h1
                id="profile-creation-title"
                className="text-3xl font-bold text-gray-900 mb-2"
            >
                {t('app.title', 'Mini Trainer')}
            </h1>
            <p className="text-gray-600 mb-8 text-center max-w-md">
                {t('profile.createSubtitle', 'Create your profile to start learning')}
            </p>

            {/* Nickname Input */}
            <div className="w-full max-w-sm mb-6">
                <label
                    htmlFor="nickname-input"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    {t('profile.nickname', 'Nickname')}
                </label>
                <input
                    id="nickname-input"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.slice(0, MAX_NICKNAME_LENGTH))}
                    placeholder={t('profile.nicknamePlaceholder', 'Enter your name')}
                    maxLength={MAX_NICKNAME_LENGTH}
                    autoFocus
                    className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="nickname-counter"
                />
                <div
                    id="nickname-counter"
                    className="text-sm text-gray-500 mt-1 text-right"
                >
                    {nickname.length}/{MAX_NICKNAME_LENGTH}
                </div>
            </div>

            {/* Avatar Picker */}
            <div className="w-full max-w-sm mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.selectAvatar', 'Choose your avatar')}
                </label>
                <div
                    className="grid grid-cols-4 gap-3"
                    role="radiogroup"
                    aria-label={t('profile.avatarLabel', 'Avatar selection')}
                >
                    {AVATAR_EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => handleAvatarSelect(emoji)}
                            className={`
                                w-14 h-14 text-3xl rounded-xl border-2 transition-all
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                ${selectedAvatar === emoji
                                    ? 'border-blue-500 bg-blue-50 scale-110'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }
                            `}
                            role="radio"
                            aria-checked={selectedAvatar === emoji}
                            aria-label={t(`profile.avatar.${emoji}`, emoji)}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div
                    className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* Action Buttons */}
            <div className="w-full max-w-sm space-y-3">
                <button
                    ref={createButtonRef}
                    onClick={handleCreateProfile}
                    disabled={!isValid || isLoading}
                    className={`
                        w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${isValid && !isLoading
                            ? 'bg-blue-600 hover:bg-blue-700'
                            : 'bg-gray-300 cursor-not-allowed'
                        }
                    `}
                >
                    {t('profile.create', 'Create Profile')}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-gray-500 text-sm">
                        {t('common.or', 'or')}
                    </span>
                    <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Load Save Game */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    onClick={handleLoadClick}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isLoading
                        ? t('profile.loading', 'Loading...')
                        : t('profile.loadGame', 'Load Save Game')
                    }
                </button>
            </div>
        </div>
    );
}

export default ProfileCreation;
