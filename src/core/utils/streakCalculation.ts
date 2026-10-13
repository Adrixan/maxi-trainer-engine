/**
 * Streak calculation utilities for the Mini Trainer Engine.
 * 
 * Provides functions for calculating and displaying streaks.
 */

import type { Streak } from '@/types/gamification';
import { daysBetweenKeys, localDateKey } from '@core/utils/date';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of updating a streak.
 */
export interface StreakResult {
    /** New current streak */
    currentStreak: number;
    /** New longest streak */
    longestStreak: number;
    /** Whether the streak was updated */
    updated: boolean;
    /** Whether the streak was broken */
    broken: boolean;
    /** ISO 8601 date string for last activity */
    lastActiveDate: string;
}

// ============================================================================
// Streak Calculations
// ============================================================================

/**
 * Update streak based on last activity date.
 * 
 * @param currentStreak - Current streak count
 * @param lastActivity - Date of last activity
 * @returns Streak update result
 */
export function updateStreak(currentStreak: number, lastActivity: Date): StreakResult {
    const todayStr = localDateKey();
    // Calendar-day difference (a plain ms/24h division breaks on DST changes)
    const diffDays = daysBetweenKeys(localDateKey(lastActivity), todayStr);

    // Same day - no change
    if (diffDays === 0) {
        return {
            currentStreak,
            longestStreak: currentStreak,
            updated: false,
            broken: false,
            lastActiveDate: todayStr,
        };
    }

    // Yesterday - increment streak
    if (diffDays === 1) {
        const newStreak = currentStreak + 1;
        return {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, currentStreak),
            updated: true,
            broken: false,
            lastActiveDate: todayStr,
        };
    }

    // More than 1 day gap - streak broken, restart at 1
    return {
        currentStreak: 1,
        longestStreak: currentStreak, // Keep the previous longest
        updated: true,
        broken: true,
        lastActiveDate: todayStr,
    };
}

/**
 * Check if a streak is at risk (no activity today yet).
 * 
 * @param lastActiveDate - ISO 8601 date string of last activity
 * @returns Whether the streak is at risk
 */
export function isStreakAtRisk(lastActiveDate: string): boolean {
    return lastActiveDate !== localDateKey();
}

/**
 * Get streak display information.
 * 
 * @param streak - Streak information
 * @returns Display-friendly streak data
 */
export function getStreakDisplay(streak: Streak): {
    current: number;
    longest: number;
    atRisk: boolean;
    emoji: string;
    message: string;
} {
    const atRisk = isStreakAtRisk(streak.lastActiveDate);

    let emoji = '🔥';
    let message = `${streak.current} day streak!`;

    if (streak.current >= 30) {
        emoji = '🏆';
        message = 'Amazing! 30+ day streak!';
    } else if (streak.current >= 14) {
        emoji = '💪';
        message = 'Incredible! 14+ day streak!';
    } else if (streak.current >= 7) {
        emoji = '🌟';
        message = 'Great! 7+ day streak!';
    } else if (streak.current >= 3) {
        emoji = '✨';
        message = 'Nice! 3+ day streak!';
    }

    return {
        current: streak.current,
        longest: streak.longest,
        atRisk,
        emoji,
        message,
    };
}
