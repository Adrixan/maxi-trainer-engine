/**
 * Gamification utility functions for the Mini Trainer Engine.
 * 
 * This module serves as the main entry point for gamification utilities.
 * It re-exports from focused sub-modules for backward compatibility and
 * cleaner import paths.
 * 
 * ## Module Structure
 * 
 * - **starCalculation.ts** - Star rating calculations (1-3 stars based on attempts)
 * - **levelCalculation.ts** - Level progression and theme level access
 * - **streakCalculation.ts** - Daily streak management
 * 
 * ## Usage
 * 
 * ```typescript
 * // Import from main module (recommended)
 * import { calculateStars, calculateLevel } from '@core/utils/gamification';
 * 
 * // Or import directly from sub-modules (for tree-shaking)
 * import { calculateStars } from '@core/utils/starCalculation';
 * ```
 * 
 * @module gamification
 * @see {@link ./starCalculation.ts} - Star calculations
 * @see {@link ./levelCalculation.ts} - Level calculations
 * @see {@link ./streakCalculation.ts} - Streak calculations
 */

// ============================================================================
// Re-exports from Star Calculations
// ============================================================================

export {
    calculateStars,
    getStarDisplay,
    getStarArray,
    calculateMaxStars,
} from './starCalculation';

// ============================================================================
// Re-exports from Level Calculations
// ============================================================================

export {
    DEFAULT_STARS_PER_LEVEL,
    VOCABULARY_LEVEL_THRESHOLDS,
    MAX_THEME_LEVEL,
    levelFromStars,
    calculateLevel,
    getStarsForNextLevel,
    getProgressPercentage,
    getLevelProgress,
    calculateGlobalLevel,
    getAccessibleLevelForTheme,
    isLevelAccessible,
    isLevelCompleted,
    getNextLevelRequirement,
} from './levelCalculation';

// ============================================================================
// Re-exports from Streak Calculations
// ============================================================================

export {
    updateStreak,
    isStreakAtRisk,
    getStreakDisplay,
    type StreakResult,
} from './streakCalculation';

// ============================================================================
// Badge Checking
// ============================================================================

import type { BadgeDefinition } from '@/types/config';
import type { UserProfile } from '@/types/profile';

/**
 * Check if a badge is earned based on profile.
 * 
 * @param badge - Badge definition with check function
 * @param profile - User profile to check against
 * @returns Whether the badge is earned
 */
export function checkBadge(badge: BadgeDefinition, profile: UserProfile): boolean {
    // If there's a runtime check function, use it
    if (badge.check) {
        return badge.check(profile);
    }

    // Otherwise, check by badge ID pattern
    return checkBadgeById(badge.badge.id, profile);
}

/**
 * Check badge by ID pattern.
 * Handles standard badge types: star_milestone, streak_milestone, level_milestone.
 * 
 * @param badgeId - Badge identifier
 * @param profile - User profile
 * @returns Whether the badge is earned
 */
export function checkBadgeById(badgeId: string, profile: UserProfile): boolean {
    // Star milestones: stars_10, stars_25, stars_50, stars_100, stars_250, stars_500
    if (badgeId.startsWith('stars_')) {
        const threshold = parseInt(badgeId.replace('stars_', ''), 10);
        return profile.totalStars >= threshold;
    }

    // Streak milestones: streak_3, streak_7, streak_14, streak_30
    if (badgeId.startsWith('streak_')) {
        const threshold = parseInt(badgeId.replace('streak_', ''), 10);
        return profile.longestStreak >= threshold;
    }

    // Level milestones: level_5, level_10, level_20
    if (badgeId.startsWith('level_')) {
        const threshold = parseInt(badgeId.replace('level_', ''), 10);
        // Check if any area has reached this level
        return Object.values(profile.currentLevels).some(level => level >= threshold);
    }

    // Theme completion: theme_complete_<themeId>
    if (badgeId.startsWith('theme_complete_')) {
        const themeId = badgeId.replace('theme_complete_', '');
        const progress = profile.themeProgress[themeId];
        return progress ? progress.exercisesCompleted >= progress.exercisesTotal && progress.exercisesTotal > 0 : false;
    }

    // Area mastery: area_mastery_<areaId>
    if (badgeId.startsWith('area_mastery_')) {
        const areaId = badgeId.replace('area_mastery_', '');
        const level = profile.currentLevels[areaId as keyof typeof profile.currentLevels];
        // Max level is typically 10
        return (level ?? 0) >= 10;
    }

    return false;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a number with ordinal suffix (1st, 2nd, 3rd, etc.).
 * 
 * @param n - Number to format
 * @returns Formatted string with ordinal suffix
 */
export function formatOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    const idx = v < 20 ? v : (v - 20) % 10;
    return n + (s[idx] ?? 'th');
}

/**
 * Get a motivational message based on performance.
 * 
 * @param stars - Stars earned (0-3)
 * @param streak - Current streak
 * @returns Motivational message
 */
export function getMotivationalMessage(stars: number, streak?: number): string {
    if (stars === 3) {
        if (streak && streak >= 7) {
            return 'Perfect! Your streak is on fire! 🔥';
        }
        return 'Perfect! Amazing work! 🌟';
    }

    if (stars === 2) {
        return 'Great job! Keep it up! 👏';
    }

    if (stars === 1) {
        return 'Good effort! Try again for more stars! 💪';
    }

    return 'Keep practicing! You\'ll get it next time! 🎯';
}
