/**
 * Progress Bar component.
 * 
 * Visual progress bar for level progression and other metrics.
 */

import { getStarsForNextLevel } from '@core/utils/gamification';

interface ProgressBarProps {
    /** Current progress value */
    current: number;
    /** Target/maximum value */
    target: number;
    /** Progress percentage (overrides current/target calculation) */
    percentage?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Color variant */
    color?: 'primary' | 'success' | 'warning' | 'gradient';
    /** Whether to show percentage label */
    showLabel?: boolean;
    /** Whether to animate on mount */
    animate?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    ariaLabel?: string;
}

const SIZE_CLASSES = {
    sm: 'h-1.5',
    md: 'h-3',
    lg: 'h-5',
};

const COLOR_CLASSES = {
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    gradient: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500',
};

/**
 * Generic progress bar component.
 */
export function ProgressBar({
    current,
    target,
    percentage,
    size = 'md',
    color = 'primary',
    showLabel = false,
    animate = true,
    className = '',
    ariaLabel,
}: ProgressBarProps) {
    const calculatedPercentage = percentage ?? (target > 0 ? (current / target) * 100 : 0);
    const clampedPercentage = Math.min(Math.max(0, calculatedPercentage), 100);

    const label = ariaLabel ?? `Progress: ${Math.round(clampedPercentage)}%`;

    return (
        <div className={className}>
            {/* Progress bar container */}
            <div
                className={`w-full bg-gray-200 rounded-full overflow-hidden ${SIZE_CLASSES[size]}`}
                role="progressbar"
                aria-valuenow={Math.round(clampedPercentage)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={label}
            >
                {/* Progress fill */}
                <div
                    className={`
                        ${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} rounded-full
                        ${animate ? 'transition-all duration-500 ease-out' : ''}
                    `}
                    style={{ width: `${clampedPercentage}%` }}
                />
            </div>

            {/* Optional label */}
            {showLabel && (
                <div className="mt-1 text-sm text-gray-600 text-center">
                    {Math.round(clampedPercentage)}%
                </div>
            )}
        </div>
    );
}

interface LevelProgressBarProps {
    /** Total stars earned */
    totalStars: number;
    /** Stars required per level */
    starsPerLevel?: number;
    /** Current level (optional, will be calculated if not provided) */
    currentLevel?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether to show detailed labels */
    showDetails?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Level progress bar with star count and level information.
 */
export function LevelProgressBar({
    totalStars,
    starsPerLevel = 10,
    currentLevel,
    size = 'md',
    showDetails = true,
    className = '',
}: LevelProgressBarProps) {
    const level = currentLevel ?? Math.floor(totalStars / starsPerLevel) + 1;
    const currentLevelStars = totalStars % starsPerLevel;
    const starsToNext = getStarsForNextLevel(totalStars, starsPerLevel);

    return (
        <div className={className}>
            {/* Level header */}
            {showDetails && (
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                            Level {level}
                        </span>
                        <span className="text-xs text-gray-500">
                            ({currentLevelStars}/{starsPerLevel} stars)
                        </span>
                    </div>
                    <span className="text-xs text-gray-500">
                        {starsToNext} stars to Level {level + 1}
                    </span>
                </div>
            )}

            {/* Progress bar */}
            <ProgressBar
                current={currentLevelStars}
                target={starsPerLevel}
                size={size}
                color="gradient"
                ariaLabel={`Level ${level} progress: ${currentLevelStars} of ${starsPerLevel} stars`}
            />

            {/* Star indicators */}
            {showDetails && size === 'lg' && (
                <div className="flex justify-between mt-2">
                    {Array.from({ length: starsPerLevel }, (_, i) => (
                        <div
                            key={i}
                            className={`
                                w-2 h-2 rounded-full transition-colors
                                ${i < currentLevelStars ? 'bg-yellow-400' : 'bg-gray-200'}
                            `}
                            aria-hidden="true"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface CircularProgressProps {
    /** Progress percentage (0-100) */
    percentage: number;
    /** Size in pixels */
    size?: number;
    /** Stroke width in pixels */
    strokeWidth?: number;
    /** Color variant */
    color?: 'primary' | 'success' | 'warning' | 'gradient';
    /** Whether to show percentage in center */
    showPercentage?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Circular progress indicator.
 */
export function CircularProgress({
    percentage,
    size = 80,
    strokeWidth = 8,
    color = 'primary',
    showPercentage = true,
    className = '',
}: CircularProgressProps) {
    const clampedPercentage = Math.min(Math.max(0, percentage), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (clampedPercentage / 100) * circumference;

    const colorClass = {
        primary: '#3B82F6',
        success: '#22C55E',
        warning: '#EAB308',
        gradient: '#8B5CF6',
    }[color];

    return (
        <div
            className={`relative inline-flex items-center justify-center ${className}`}
            role="progressbar"
            aria-valuenow={Math.round(clampedPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
        >
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colorClass}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>

            {/* Percentage text */}
            {showPercentage && (
                <span className="absolute text-sm font-bold text-gray-700">
                    {Math.round(clampedPercentage)}%
                </span>
            )}
        </div>
    );
}

export default ProgressBar;
