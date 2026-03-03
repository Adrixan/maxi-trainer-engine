/**
 * Star Display component.
 * 
 * Visual star rating display for exercise results.
 */

import { useEffect } from 'react';
import type { StarRating } from '@/types/gamification';
import { useAppStore } from '@core/stores/appStore';
import { playStar } from '@core/utils/sounds';

interface StarDisplayProps {
    /** Number of filled stars (0-3) */
    stars: number;
    /** Maximum number of stars (default: 3) */
    maxStars?: number;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /** Whether to animate on mount */
    animate?: boolean;
    /** Whether to show empty stars */
    showEmpty?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Accessible label */
    ariaLabel?: string;
}

const SIZE_CLASSES = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
};

/**
 * Visual star rating display component.
 * Shows filled and empty stars with optional animation.
 */
export function StarDisplay({
    stars,
    maxStars = 3,
    size = 'md',
    animate = false,
    showEmpty = true,
    className = '',
    ariaLabel,
}: StarDisplayProps) {
    const filledStars = Math.min(Math.max(0, stars), maxStars);
    const emptyStars = showEmpty ? maxStars - filledStars : 0;

    const label = ariaLabel ?? `${filledStars} out of ${maxStars} stars`;

    // Play star sound when stars are animated
    useEffect(() => {
        if (animate && filledStars > 0) {
            const soundEnabled = useAppStore.getState().settings.soundEnabled;
            // Play sound for each star with staggered delay
            for (let i = 0; i < filledStars; i++) {
                setTimeout(() => {
                    playStar(i, soundEnabled);
                }, i * 200);
            }
        }
    }, [filledStars, animate]);

    return (
        <div
            className={`flex items-center gap-1 ${className}`}
            role="img"
            aria-label={label}
        >
            {/* Filled stars */}
            {Array.from({ length: filledStars }, (_, i) => (
                <span
                    key={`filled-${i}`}
                    className={`${SIZE_CLASSES[size]} ${animate ? 'animate-starPop' : ''}`}
                    style={animate ? { animationDelay: `${i * 0.15}s` } : undefined}
                    aria-hidden="true"
                >
                    ⭐
                </span>
            ))}

            {/* Empty stars */}
            {Array.from({ length: emptyStars }, (_, i) => (
                <span
                    key={`empty-${i}`}
                    className={`${SIZE_CLASSES[size]} text-gray-300`}
                    aria-hidden="true"
                >
                    ☆
                </span>
            ))}

            {/* Animation styles */}
            {animate && (
                <style>{`
                    @keyframes starPop {
                        0% { transform: scale(0); opacity: 0; }
                        50% { transform: scale(1.3); }
                        100% { transform: scale(1); opacity: 1; }
                    }
                    
                    .animate-starPop {
                        animation: starPop 0.5s ease-out both;
                    }
                `}</style>
            )}
        </div>
    );
}

/**
 * Compact star display with numeric value.
 */
export function StarDisplayCompact({
    stars,
    maxStars = 3,
    className = '',
}: {
    stars: number;
    maxStars?: number;
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <span className="text-yellow-500" aria-hidden="true">⭐</span>
            <span className="font-semibold text-gray-700">
                {stars}/{maxStars}
            </span>
        </div>
    );
}

/**
 * Star display with label for results.
 */
export function StarDisplayWithLabel({
    stars,
    label,
    size = 'lg',
    className = '',
}: {
    stars: StarRating;
    label?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}) {
    const defaultLabel = stars === 3 ? 'Perfect!' : stars === 2 ? 'Great!' : stars === 1 ? 'Good!' : 'Try again!';

    return (
        <div className={`text-center ${className}`}>
            <StarDisplay
                stars={stars}
                size={size}
                animate
                ariaLabel={`${stars} stars`}
            />
            <p className="mt-2 text-lg font-semibold text-gray-700">
                {label ?? defaultLabel}
            </p>
        </div>
    );
}

export default StarDisplay;
