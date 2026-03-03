/**
 * Level card component for the level selection screen.
 * 
 * Displays a single difficulty level with its icon, name, exercise count,
 * completion status, and locked/unlocked states.
 */

import { useTranslation } from 'react-i18next';

// ============================================================================
// Constants
// ============================================================================

/**
 * Level configuration with emojis and colors.
 * Based on the original mini-daz-trainer-kids implementation.
 */
export const LEVEL_CONFIG = {
    1: {
        emoji: 'seedling',
        emojiChar: '🌱',
        labelKey: 'level.beginner',
        defaultLabel: 'Anfänger',
        color: '#4CAF50', // Green
        descriptionKey: 'level.beginnerDesc',
        defaultDescription: 'Einfache Übungen für Anfänger',
    },
    2: {
        emoji: 'herb',
        emojiChar: '🌿',
        labelKey: 'level.elementary',
        defaultLabel: 'Grundschule',
        color: '#2196F3', // Blue
        descriptionKey: 'level.elementaryDesc',
        defaultDescription: 'Grundlegende Übungen mit mehr Abwechslung',
    },
    3: {
        emoji: 'tree',
        emojiChar: '🌳',
        labelKey: 'level.intermediate',
        defaultLabel: 'Mittelstufe',
        color: '#FF9800', // Orange
        descriptionKey: 'level.intermediateDesc',
        defaultDescription: 'Anspruchsvollere Übungen',
    },
    4: {
        emoji: 'trophy',
        emojiChar: '🏆',
        labelKey: 'level.advanced',
        defaultLabel: 'Fortgeschritten',
        color: '#9C27B0', // Purple
        descriptionKey: 'level.advancedDesc',
        defaultDescription: 'Komplexe Übungen für Experten',
    },
} as const;

/**
 * Level emojis for display.
 */
export const LEVEL_EMOJIS: Record<number, string> = {
    1: '🌱',
    2: '🌿',
    3: '🌳',
    4: '🏆',
};

// ============================================================================
// Types
// ============================================================================

export interface LevelCardProps {
    /** Level number (1-4) */
    level: number;
    /** Total exercises available at this level */
    exerciseCount: number;
    /** Number of completed exercises at this level */
    completedCount: number;
    /** Whether this level is unlocked based on user's vocabulary level */
    isUnlocked: boolean;
    /** Whether this level has been started */
    isStarted?: boolean;
    /** Callback when the card is clicked */
    onClick?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Level card that displays level information and progress.
 * Shows locked state with lock icon when user level is too low.
 */
export function LevelCard({
    level,
    exerciseCount,
    completedCount,
    isUnlocked,
    isStarted = false,
    onClick,
}: LevelCardProps) {
    const { t } = useTranslation();

    // Get level configuration
    const config = LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] ?? LEVEL_CONFIG[1];
    const emoji = LEVEL_EMOJIS[level] ?? '🌱';

    // Calculate completion percentage
    const completionPercent = exerciseCount > 0
        ? Math.round((completedCount / exerciseCount) * 100)
        : 0;

    // Determine completion status text
    const getStatusText = () => {
        if (!isUnlocked) {
            return t('level.locked', 'Locked');
        }
        if (exerciseCount === 0) {
            return t('level.noExercises', 'No exercises');
        }
        if (completedCount === 0) {
            return t('level.notStarted', 'Not started');
        }
        if (completedCount >= exerciseCount) {
            return t('level.completed', 'Completed!');
        }
        return t('level.inProgress', '{{count}}/{{total}} exercises', {
            count: completedCount,
            total: exerciseCount,
        });
    };

    // Handle click
    const handleClick = () => {
        if (isUnlocked && exerciseCount > 0 && onClick) {
            onClick();
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (isUnlocked && exerciseCount > 0 && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClick?.();
        }
    };

    // Get aria label
    const getAriaLabel = () => {
        const levelName = t(config.labelKey, config.defaultLabel);
        if (!isUnlocked) {
            return t('level.lockedAria', {
                name: levelName,
                defaultValue: `${levelName} level is locked. Earn more stars to unlock.`,
            });
        }
        if (exerciseCount === 0) {
            return t('level.emptyAria', {
                name: levelName,
                defaultValue: `${levelName} level has no exercises available.`,
            });
        }
        return t('level.selectAria', {
            name: levelName,
            count: exerciseCount,
            defaultValue: `Select ${levelName} level with ${exerciseCount} exercises.`,
        });
    };

    const isClickable = isUnlocked && exerciseCount > 0;

    return (
        <button
            type="button"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            disabled={!isClickable}
            aria-disabled={!isClickable}
            aria-label={getAriaLabel()}
            className={`
                relative w-full p-4 rounded-xl text-left transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isClickable
                    ? 'bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md focus:ring-blue-500 cursor-pointer'
                    : 'bg-gray-100 border-2 border-gray-200 cursor-not-allowed opacity-60'
                }
            `}
            style={{
                borderLeftColor: isUnlocked ? config.color : undefined,
                borderLeftWidth: isUnlocked ? '4px' : undefined,
            }}
        >
            {/* Lock overlay for locked levels */}
            {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl z-10">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl" role="img" aria-hidden="true">
                            🔒
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                            {t('level.unlockAt', {
                                level,
                                defaultValue: `Level ${level} erforderlich`,
                            })}
                        </span>
                    </div>
                </div>
            )}

            {/* Level content */}
            <div className="flex items-start gap-3">
                {/* Icon */}
                <span
                    className="text-3xl flex-shrink-0"
                    role="img"
                    aria-hidden="true"
                >
                    {emoji}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Level number and name */}
                    <div className="flex items-center gap-2">
                        <span
                            className="text-sm font-bold px-2 py-0.5 rounded"
                            style={{
                                backgroundColor: `${config.color}20`,
                                color: config.color,
                            }}
                        >
                            {t('level.levelNumber', { level, defaultValue: `Level ${level}` })}
                        </span>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                            {t(config.labelKey, config.defaultLabel)}
                        </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mt-1">
                        {t(config.descriptionKey, config.defaultDescription)}
                    </p>

                    {/* Exercise count */}
                    <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-gray-600">
                            {t('level.exerciseCount', {
                                count: exerciseCount,
                                defaultValue: `${exerciseCount} exercises`,
                            })}
                        </span>
                    </div>

                    {/* Progress section (only for unlocked levels with exercises) */}
                    {isUnlocked && exerciseCount > 0 && isStarted && (
                        <div className="mt-3">
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${completionPercent}%`,
                                        backgroundColor: config.color,
                                    }}
                                    role="progressbar"
                                    aria-valuenow={completionPercent}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label={t('level.progressLabel', {
                                        percent: completionPercent,
                                        defaultValue: `${completionPercent}% complete`,
                                    })}
                                />
                            </div>

                            {/* Progress stats */}
                            <div className="flex justify-between items-center mt-1.5 text-xs text-gray-500">
                                <span>{getStatusText()}</span>
                                <span>{completionPercent}%</span>
                            </div>
                        </div>
                    )}

                    {/* Status for unlocked but not started */}
                    {isUnlocked && exerciseCount > 0 && !isStarted && (
                        <div className="mt-2 text-sm text-gray-500">
                            {getStatusText()}
                        </div>
                    )}

                    {/* No exercises message */}
                    {isUnlocked && exerciseCount === 0 && (
                        <div className="mt-2 text-sm text-gray-400 italic">
                            {t('level.noExercisesAvailable', 'No exercises available')}
                        </div>
                    )}
                </div>
            </div>
        </button>
    );
}

export default LevelCard;