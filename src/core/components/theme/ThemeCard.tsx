/**
 * Theme card component for the theme selection screen.
 * 
 * Displays a single theme with its icon, name, description,
 * progress bar, and locked/unlocked states.
 */

import { useTranslation } from 'react-i18next';
import type { Theme, ThemeProgress } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ThemeCardProps {
    /** Theme data */
    theme: Theme;
    /** Progress data for this theme (optional if not started) */
    progress?: ThemeProgress;
    /** Whether the theme is unlocked based on user level */
    isUnlocked: boolean;
    /** Current vocabulary level of the user */
    vocabularyLevel: number;
    /** Callback when the card is clicked */
    onClick?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Theme card that displays theme information and progress.
 * Shows locked state with lock icon when user level is too low.
 */
export function ThemeCard({
    theme,
    progress,
    isUnlocked,
    vocabularyLevel: _vocabularyLevel,
    onClick,
}: ThemeCardProps) {
    const { t } = useTranslation();

    // Calculate progress percentage
    const progressPercent = progress && progress.exercisesTotal > 0
        ? Math.round((progress.exercisesCompleted / progress.exercisesTotal) * 100)
        : 0;

    // Get progress text
    const progressText = progress
        ? t('theme.progress', {
            completed: progress.exercisesCompleted,
            total: progress.exercisesTotal,
            defaultValue: `${progress.exercisesCompleted}/${progress.exercisesTotal} exercises`,
        })
        : t('theme.notStarted', 'Not started');

    // Handle click
    const handleClick = () => {
        if (isUnlocked && onClick) {
            onClick();
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (isUnlocked && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick?.();
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={!isUnlocked}
            aria-disabled={!isUnlocked}
            aria-label={
                isUnlocked
                    ? t('theme.selectTheme', {
                        name: theme.name,
                        defaultValue: `Select ${theme.name} theme`,
                    })
                    : t('theme.lockedTheme', {
                        name: theme.name,
                        level: theme.minLevel,
                        defaultValue: `${theme.name} theme locked. Requires level ${theme.minLevel}.`,
                    })
            }
            className={`
                relative w-full p-4 rounded-xl text-left transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isUnlocked
                    ? 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md focus:ring-blue-500 cursor-pointer'
                    : 'bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-60'
                }
            `}
            style={{
                borderLeftColor: isUnlocked ? theme.color : undefined,
                borderLeftWidth: isUnlocked ? '4px' : undefined,
            }}
        >
            {/* Lock overlay for locked themes */}
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl z-10">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl" role="img" aria-hidden="true">
                            🔒
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                            {t('theme.unlockAt', {
                                level: theme.minLevel,
                                defaultValue: `Level ${theme.minLevel} required`,
                            })}
                        </span>
                    </div>
                </div>
            )}

            {/* Theme content */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <span
                    className="text-3xl flex-shrink-0"
                    role="img"
                    aria-hidden="true"
                >
                    {theme.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {theme.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {theme.description}
                    </p>

                    {/* Min level badge (for unlocked themes) */}
                    {isUnlocked && theme.minLevel > 1 && (
                        <div className="mt-2">
                            <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: `${theme.color}20`,
                                    color: theme.color,
                                }}
                            >
                                {t('theme.minLevel', {
                                    level: theme.minLevel,
                                    defaultValue: `Level ${theme.minLevel}+`,
                                })}
                            </span>
                        </div>
                    )}

                    {/* Progress section (only for unlocked themes with progress) */}
                    {isUnlocked && progress && progress.exercisesTotal > 0 && (
                        <div className="mt-3">
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: theme.color,
                                    }}
                                    role="progressbar"
                                    aria-valuenow={progressPercent}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={t('theme.progressLabel', {
                                        percent: progressPercent,
                                        defaultValue: `${progressPercent}% complete`,
                                    })}
                                />
                            </div>

                            {/* Progress stats */}
                            <div className="flex justify-between items-center mt-1.5 text-xs text-gray-500">
                                <span>{progressText}</span>
                                <span className="flex items-center gap-1">
                                    <span role="img" aria-label={t('stats.stars', 'Stars')}>
                                        ⭐
                                    </span>
                                    {progress.starsEarned}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}

export default ThemeCard;
