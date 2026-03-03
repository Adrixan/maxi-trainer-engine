/**
 * Streak Counter component.
 * 
 * Displays current streak with fire icon and visual feedback.
 */

import { isStreakAtRisk } from '@core/utils/gamification';

interface StreakCounterProps {
    /** Current streak count */
    streak: number;
    /** Longest streak achieved */
    longestStreak?: number;
    /** ISO 8601 date string of last activity */
    lastActiveDate?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show the longest streak */
    showLongest?: boolean;
    /** Whether to show at-risk indicator */
    showAtRisk?: boolean;
    /** Additional CSS classes */
    className?: string;
}

const SIZE_CONFIG = {
    sm: {
        icon: 'text-xl',
        count: 'text-lg font-bold',
        label: 'text-xs',
    },
    md: {
        icon: 'text-3xl',
        count: 'text-2xl font-bold',
        label: 'text-sm',
    },
    lg: {
        icon: 'text-5xl',
        count: 'text-4xl font-bold',
        label: 'text-base',
    },
};

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
 * Get streak message based on streak length.
 */
function getStreakMessage(streak: number): string {
    if (streak >= 30) return 'Amazing! 30+ day streak!';
    if (streak >= 14) return 'Incredible! 14+ day streak!';
    if (streak >= 7) return 'Great! 7+ day streak!';
    if (streak >= 3) return 'Nice! 3+ day streak!';
    if (streak >= 1) return `${streak} day streak!`;
    return 'Start your streak!';
}

/**
 * Streak counter display component.
 * Shows current streak with fire icon and optional at-risk indicator.
 */
export function StreakCounter({
    streak,
    longestStreak,
    lastActiveDate,
    size = 'md',
    showLongest = false,
    showAtRisk = true,
    className = '',
}: StreakCounterProps) {
    const config = SIZE_CONFIG[size];
    const emoji = getStreakEmoji(streak);
    const atRisk = lastActiveDate ? isStreakAtRisk(lastActiveDate) : streak === 0;

    return (
        <div
            className={`flex items-center gap-2 ${className}`}
            role="status"
            aria-live="polite"
            aria-label={`Current streak: ${streak} days`}
        >
            {/* Streak icon */}
            <div
                className={`${config.icon} ${atRisk && showAtRisk ? 'animate-pulse' : ''}`}
                aria-hidden="true"
            >
                {emoji}
            </div>

            {/* Streak info */}
            <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                    <span className={config.count}>
                        {streak}
                    </span>
                    <span className={`${config.label} text-gray-500`}>
                        day{streak !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* At-risk indicator */}
                {atRisk && showAtRisk && streak > 0 && (
                    <span className="text-xs text-orange-500 font-medium">
                        ⚠️ Practice today to keep your streak!
                    </span>
                )}

                {/* Longest streak */}
                {showLongest && longestStreak !== undefined && longestStreak > 0 && (
                    <span className="text-xs text-gray-400">
                        Best: {longestStreak} days
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Compact streak display for headers/navigation.
 */
export function StreakCounterCompact({
    streak,
    lastActiveDate,
    className = '',
}: {
    streak: number;
    lastActiveDate?: string;
    className?: string;
}) {
    const atRisk = lastActiveDate ? isStreakAtRisk(lastActiveDate) : streak === 0;
    const emoji = getStreakEmoji(streak);

    return (
        <div
            className={`flex items-center gap-1 ${className}`}
            role="status"
            aria-label={`${streak} day streak`}
        >
            <span
                className={`text-lg ${atRisk ? 'animate-pulse' : ''}`}
                aria-hidden="true"
            >
                {emoji}
            </span>
            <span className="font-bold text-gray-700">
                {streak}
            </span>
        </div>
    );
}

/**
 * Streak display with detailed information.
 */
export function StreakCounterDetailed({
    streak,
    longestStreak,
    lastActiveDate,
    className = '',
}: {
    streak: number;
    longestStreak: number;
    lastActiveDate?: string;
    className?: string;
}) {
    const atRisk = lastActiveDate ? isStreakAtRisk(lastActiveDate) : streak === 0;
    const emoji = getStreakEmoji(streak);
    const message = getStreakMessage(streak);

    return (
        <div
            className={`bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 ${className}`}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-3">
                {/* Large emoji */}
                <div
                    className={`text-5xl ${atRisk ? 'animate-pulse' : ''}`}
                    aria-hidden="true"
                >
                    {emoji}
                </div>

                {/* Streak details */}
                <div className="flex-1">
                    <div className="text-2xl font-bold text-gray-800">
                        {streak} Day{streak !== 1 ? 's' : ''}
                    </div>
                    <div className="text-sm text-gray-600">
                        {message}
                    </div>

                    {/* At-risk warning */}
                    {atRisk && streak > 0 && (
                        <div className="mt-2 text-sm text-orange-600 font-medium flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Practice today to maintain your streak!</span>
                        </div>
                    )}
                </div>

                {/* Longest streak badge */}
                {longestStreak > 0 && (
                    <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                            Best
                        </div>
                        <div className="text-lg font-bold text-gray-700">
                            {longestStreak}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default StreakCounter;
