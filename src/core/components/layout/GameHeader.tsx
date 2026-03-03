/**
 * GameHeader component.
 * 
 * A persistent header that displays gamification stats (stars, streak, level)
 * and an audio toggle button. Appears on every page of the application.
 */

import { useTranslation } from 'react-i18next';
import { useProfileStore } from '@core/stores';
import { useAccessibility } from '@core/hooks';
import { LEVEL_EMOJIS } from '@core/components/level/LevelCard';
import { isStreakAtRisk } from '@core/utils/gamification';

interface GameHeaderProps {
    /** Additional CSS classes */
    className?: string;
}

/**
 * Get streak emoji based on streak length.
 */
function getStreakEmoji(streak: number): string {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '💪';
    if (streak >= 7) return '🌟';
    if (streak >= 3) return '✨';
    return '🔥';
}

/**
 * Get the highest unlocked level across all areas.
 */
function getHighestLevel(currentLevels: Record<string, number>): number {
    const levels = Object.values(currentLevels);
    if (levels.length === 0) return 1;
    return Math.max(...levels);
}

/**
 * GameHeader displays gamification stats and audio toggle.
 * 
 * Shows:
 * - Total stars earned
 * - Current streak with at-risk indicator
 * - Highest level achieved
 * - Sound on/off toggle
 */
export function GameHeader({ className = '' }: GameHeaderProps) {
    const { t } = useTranslation();
    const activeProfile = useProfileStore((s) => s.activeProfile);
    const { soundEnabled, toggleSound } = useAccessibility();

    // Get profile data with defaults
    const totalStars = activeProfile?.totalStars ?? 0;
    const currentStreak = activeProfile?.currentStreak ?? 0;
    const lastActiveDate = activeProfile?.lastActiveDate;
    const currentLevels = activeProfile?.currentLevels ?? {};

    // Calculate derived values
    const highestLevel = getHighestLevel(currentLevels);
    const levelEmoji = LEVEL_EMOJIS[highestLevel] ?? '🌱';
    const streakEmoji = getStreakEmoji(currentStreak);
    const atRisk = lastActiveDate ? isStreakAtRisk(lastActiveDate) : currentStreak === 0;

    return (
        <header
            className={`
                sticky top-0 z-50 w-full
                bg-white/95 backdrop-blur-sm
                border-b border-gray-200
                shadow-sm
                ${className}
            `}
            role="banner"
        >
            <div className="max-w-4xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center justify-between gap-2">
                    {/* Left side: Gamification stats */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Stars */}
                        <div
                            className="flex items-center gap-1"
                            role="status"
                            aria-label={t('gamification.totalStars', {
                                count: totalStars,
                                defaultValue: `${totalStars} stars earned`,
                            })}
                        >
                            <span className="text-lg sm:text-xl" aria-hidden="true">
                                ⭐
                            </span>
                            <span className="font-bold text-gray-700 text-sm sm:text-base">
                                {totalStars}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-5 w-px bg-gray-200" aria-hidden="true" />

                        {/* Streak */}
                        <div
                            className="flex items-center gap-1"
                            role="status"
                            aria-label={t('gamification.currentStreak', {
                                count: currentStreak,
                                defaultValue: `${currentStreak} day streak`,
                            })}
                        >
                            <span
                                className={`text-lg sm:text-xl ${atRisk ? 'animate-pulse' : ''}`}
                                aria-hidden="true"
                            >
                                {streakEmoji}
                            </span>
                            <span className="font-bold text-gray-700 text-sm sm:text-base">
                                {currentStreak}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="h-5 w-px bg-gray-200 hidden sm:block" aria-hidden="true" />

                        {/* Level */}
                        <div
                            className="hidden sm:flex items-center gap-1"
                            role="status"
                            aria-label={t('gamification.currentLevel', {
                                level: highestLevel,
                                defaultValue: `Level ${highestLevel}`,
                            })}
                        >
                            <span className="text-lg sm:text-xl" aria-hidden="true">
                                {levelEmoji}
                            </span>
                            <span className="font-bold text-gray-700 text-sm sm:text-base">
                                {t('level.levelNumber', {
                                    level: highestLevel,
                                    defaultValue: `Lv.${highestLevel}`,
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Right side: Audio toggle */}
                    <button
                        type="button"
                        onClick={toggleSound}
                        className={`
                            p-2 rounded-lg
                            transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                            ${soundEnabled
                                ? 'text-blue-600 hover:bg-blue-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }
                        `}
                        aria-label={
                            soundEnabled
                                ? t('accessibility.soundOff', 'Turn sound off')
                                : t('accessibility.soundOn', 'Turn sound on')
                        }
                        aria-pressed={soundEnabled}
                    >
                        {soundEnabled ? (
                            // Speaker with sound waves icon
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                aria-hidden="true"
                            >
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                            </svg>
                        ) : (
                            // Speaker muted icon
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                aria-hidden="true"
                            >
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

export default GameHeader;
