/**
 * Achievement Grid component.
 * 
 * Displays earned badges in a grid layout.
 */

import type { Badge } from '@/types/profile';
import type { BadgeDefinitionWithMeta } from '@core/utils/badges';
import { getAllBadgesWithProgress, DEFAULT_BADGES } from '@core/utils/badges';

interface AchievementGridProps {
    /** Earned badges to display */
    badges: Badge[];
    /** Badge definitions for showing locked badges */
    badgeDefinitions?: BadgeDefinitionWithMeta[];
    /** Whether to show locked badges */
    showLocked?: boolean;
    /** Grid columns */
    columns?: 2 | 3 | 4;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    className?: string;
}

const COLUMN_CLASSES = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
};

const SIZE_CONFIG = {
    sm: {
        icon: 'text-2xl',
        name: 'text-xs',
        container: 'p-2',
    },
    md: {
        icon: 'text-4xl',
        name: 'text-sm',
        container: 'p-4',
    },
    lg: {
        icon: 'text-5xl',
        name: 'text-base',
        container: 'p-6',
    },
};

/**
 * Achievement grid displaying earned badges.
 */
export function AchievementGrid({
    badges,
    badgeDefinitions = DEFAULT_BADGES,
    showLocked = false,
    columns = 3,
    size = 'md',
    className = '',
}: AchievementGridProps) {
    // Get all badges with progress if showing locked
    const allBadges = showLocked
        ? getAllBadgesWithProgress(
            {
                id: 'temp',
                nickname: '',
                avatarId: '',
                createdAt: new Date().toISOString(),
                badges,
                totalStars: 0,
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: new Date().toISOString(),
                currentLevels: {} as Record<string, number>,
                themeProgress: {} as Record<string, { unlocked: boolean; exercisesCompleted: number; exercisesTotal: number; starsEarned: number; maxStars: number }>,
            },
            badgeDefinitions
        )
        : null;

    return (
        <div
            className={`grid ${COLUMN_CLASSES[columns]} gap-3 ${className}`}
            role="list"
            aria-label="Erfolge"
        >
            {/* Earned badges */}
            {badges.map((badge) => (
                <AchievementCard
                    key={badge.id}
                    badge={badge}
                    earned={true}
                    size={size}
                />
            ))}

            {/* Locked badges */}
            {showLocked && allBadges?.filter(b => !b.earned).map((badgeDef) => (
                <AchievementCard
                    key={badgeDef.badge.id}
                    badge={{
                        id: badgeDef.badge.id,
                        name: badgeDef.badge.name,
                        description: badgeDef.badge.description,
                        icon: badgeDef.badge.icon,
                        earnedAt: '',
                    }}
                    earned={false}
                    progress={badgeDef.progress}
                    size={size}
                />
            ))}
        </div>
    );
}

interface AchievementCardProps {
    /** Badge to display */
    badge: Badge;
    /** Whether the badge is earned */
    earned: boolean;
    /** Progress for locked badges */
    progress?: { current: number; target: number; percentage: number };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Individual achievement card.
 */
function AchievementCard({
    badge,
    earned,
    progress,
    size = 'md'
}: AchievementCardProps) {
    const config = SIZE_CONFIG[size];

    return (
        <div
            className={`
                relative rounded-xl border-2 transition-all
                ${earned
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }
                ${config.container}
            `}
            role="listitem"
            aria-label={`${badge.name}${earned ? '' : ' (locked)'}`}
        >
            {/* Badge icon */}
            <div
                className={`
                    flex items-center justify-center mb-2
                    ${config.icon}
                    ${earned ? '' : 'grayscale'}
                `}
                aria-hidden="true"
            >
                {badge.icon}
            </div>

            {/* Badge name */}
            <div className={`font-semibold text-center text-gray-800 ${config.name}`}>
                {badge.name}
            </div>

            {/* Progress indicator for locked badges */}
            {!earned && progress && (
                <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gray-400 rounded-full"
                            style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                        {progress.current}/{progress.target}
                    </div>
                </div>
            )}

            {/* Earned checkmark */}
            {earned && (
                <div
                    className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center"
                    aria-hidden="true"
                >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {/* Tooltip on hover */}
            <div className="sr-only">
                {badge.description}
                {earned && ` Earned on ${new Date(badge.earnedAt).toLocaleDateString()}`}
            </div>
        </div>
    );
}

interface AchievementListProps {
    /** Earned badges to display */
    badges: Badge[];
    /** Whether to show earned date */
    showDate?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * List view of achievements.
 */
export function AchievementList({
    badges,
    showDate = true,
    className = '',
}: AchievementListProps) {
    // Sort by earned date (most recent first)
    const sortedBadges = [...badges].sort((a, b) =>
        new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
    );

    return (
        <div
            className={`space-y-3 ${className}`}
            role="list"
            aria-label="Erfolge"
        >
            {sortedBadges.map((badge) => (
                <div
                    key={badge.id}
                    className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm"
                    role="listitem"
                >
                    {/* Icon */}
                    <div className="text-3xl" aria-hidden="true">
                        {badge.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800">
                            {badge.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                            {badge.description}
                        </div>
                    </div>

                    {/* Date */}
                    {showDate && (
                        <div className="text-xs text-gray-400">
                            {new Date(badge.earnedAt).toLocaleDateString()}
                        </div>
                    )}
                </div>
            ))}

            {badges.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🏆</div>
                    <p>No achievements yet. Keep practicing!</p>
                </div>
            )}
        </div>
    );
}

interface AchievementSummaryProps {
    /** Total badges earned */
    totalEarned: number;
    /** Total possible badges */
    totalPossible: number;
    /** Recent badges */
    recentBadges?: Badge[];
    /** Additional CSS classes */
    className?: string;
}

/**
 * Summary view of achievements.
 */
export function AchievementSummary({
    totalEarned,
    totalPossible,
    recentBadges = [],
    className = '',
}: AchievementSummaryProps) {
    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

    return (
        <div className={`bg-white rounded-xl p-4 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Erfolge</h3>
                <span className="text-sm text-gray-500">
                    {totalEarned}/{totalPossible}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Recent badges */}
            {recentBadges.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Recent:</span>
                    {recentBadges.slice(0, 3).map((badge) => (
                        <span
                            key={badge.id}
                            className="text-xl"
                            title={badge.name}
                        >
                            {badge.icon}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AchievementGrid;
