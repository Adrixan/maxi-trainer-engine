/**
 * Level calculation utilities for the Mini Trainer Engine.
 * 
 * Provides functions for calculating levels, progress, and theme progression.
 */

import type { LevelProgress } from '@/types/gamification';

// ============================================================================
// Constants
// ============================================================================

/**
 * Default stars required per level.
 */
export const DEFAULT_STARS_PER_LEVEL = 10;

/**
 * Level thresholds for vocabulary level progression.
 * These thresholds are intentionally low for quick progress.
 * Based on original mini-daz-trainer-kids implementation.
 */
export const VOCABULARY_LEVEL_THRESHOLDS = {
    LEVEL_2: 4,   // >= 4 stars -> Level 2
    LEVEL_3: 12,  // >= 12 stars -> Level 3
    LEVEL_4: 20,  // >= 20 stars -> Level 4
} as const;

/**
 * Maximum level per theme.
 */
export const MAX_THEME_LEVEL = 4;

// ============================================================================
// Level Calculations
// ============================================================================

/**
 * Calculate vocabulary level from total stars.
 * Uses fixed thresholds from the original app:
 * - >= 4 stars -> Level 2
 * - >= 12 stars -> Level 3
 * - >= 20 stars -> Level 4
 * 
 * @param totalStars - Total stars earned
 * @returns Vocabulary level (1-4)
 */
export function levelFromStars(totalStars: number): number {
    if (totalStars >= VOCABULARY_LEVEL_THRESHOLDS.LEVEL_4) return 4;
    if (totalStars >= VOCABULARY_LEVEL_THRESHOLDS.LEVEL_3) return 3;
    if (totalStars >= VOCABULARY_LEVEL_THRESHOLDS.LEVEL_2) return 2;
    return 1;
}

/**
 * Calculate level from total stars.
 * 
 * @param totalStars - Total stars earned
 * @param starsPerLevel - Stars required per level (default: 10)
 * @returns Current level (1-based)
 */
export function calculateLevel(totalStars: number, starsPerLevel: number = DEFAULT_STARS_PER_LEVEL): number {
    return Math.floor(totalStars / starsPerLevel) + 1;
}

/**
 * Get stars needed to reach the next level.
 * 
 * @param currentStars - Current total stars
 * @param starsPerLevel - Stars required per level (default: 10)
 * @returns Stars needed for next level
 */
export function getStarsForNextLevel(currentStars: number, starsPerLevel: number = DEFAULT_STARS_PER_LEVEL): number {
    const currentLevelStars = currentStars % starsPerLevel;
    return starsPerLevel - currentLevelStars;
}

/**
 * Get progress percentage toward next level.
 * 
 * @param currentStars - Current total stars
 * @param starsPerLevel - Stars required per level (default: 10)
 * @returns Progress percentage (0-100)
 */
export function getProgressPercentage(currentStars: number, starsPerLevel: number = DEFAULT_STARS_PER_LEVEL): number {
    const currentLevelStars = currentStars % starsPerLevel;
    return (currentLevelStars / starsPerLevel) * 100;
}

/**
 * Get complete level progress information.
 * 
 * @param totalStars - Total stars earned
 * @param starsPerLevel - Stars required per level (default: 10)
 * @param previousLevel - Previous level before this calculation (for justLeveledUp)
 * @returns Level progress information
 */
export function getLevelProgress(
    totalStars: number,
    starsPerLevel: number = DEFAULT_STARS_PER_LEVEL,
    previousLevel?: number
): LevelProgress {
    const currentLevel = calculateLevel(totalStars, starsPerLevel);
    const currentStars = totalStars % starsPerLevel;
    const starsToNextLevel = starsPerLevel - currentStars;
    const progressPercentage = getProgressPercentage(totalStars, starsPerLevel);
    const justLeveledUp = previousLevel !== undefined && currentLevel > previousLevel;

    return {
        currentLevel,
        currentStars,
        starsToNextLevel,
        progressPercentage,
        justLeveledUp,
    };
}

// ============================================================================
// Theme Level Progression
// ============================================================================

/**
 * Calculate the highest level that is accessible across ALL themes.
 * 
 * This represents the "global progression level" - the highest level number
 * that a user can access in every theme. It's determined by the theme with
 * the lowest completed level (the "weakest link" principle).
 * 
 * The global level determines what new level the user can unlock next.
 * To unlock level N globally, the user must have completed level N-1 in ALL themes.
 * 
 * @example
 * // User has completed:
 * // - Theme A: level 2
 * // - Theme B: level 1
 * // - Theme C: level 3
 * // Global level = min(2, 1, 3) + 1 = 2
 * // User can access level 2 in all themes, but level 3 only in themes A and C
 * 
 * @param themeLevels - Record of theme ID to highest completed level (0 if not started)
 * @param allThemeIds - All available theme IDs
 * @returns Global accessible level (1-4), where 1 means "can access level 1 in all themes"
 */
export function calculateGlobalLevel(
    themeLevels: Record<string, number>,
    allThemeIds: string[]
): number {
    if (allThemeIds.length === 0) return 1;

    // Get the minimum completed level across all themes
    const minCompletedLevel = Math.min(
        ...allThemeIds.map(themeId => themeLevels[themeId] ?? 0)
    );

    // Global level is min completed + 1 (capped at MAX_THEME_LEVEL)
    return Math.min(minCompletedLevel + 1, MAX_THEME_LEVEL);
}

/**
 * Calculate the highest accessible level for a specific theme.
 * A user can access level N in a theme if:
 * - N is 1 (always accessible)
 * - N <= their completed level for that theme + 1
 * - N <= global level
 * 
 * @param themeId - The theme to check
 * @param themeLevels - Record of theme ID to highest completed level
 * @param allThemeIds - All available theme IDs
 * @returns Highest accessible level for this theme (1-4)
 */
export function getAccessibleLevelForTheme(
    themeId: string,
    themeLevels: Record<string, number>,
    allThemeIds: string[]
): number {
    const globalLevel = calculateGlobalLevel(themeLevels, allThemeIds);
    const themeCompletedLevel = themeLevels[themeId] ?? 0;

    // Can access up to completed + 1, but not more than global level
    return Math.min(themeCompletedLevel + 1, globalLevel);
}

/**
 * Check if a specific level in a theme is accessible.
 * 
 * @param themeId - The theme to check
 * @param level - The level to check (1-4)
 * @param themeLevels - Record of theme ID to highest completed level
 * @param allThemeIds - All available theme IDs
 * @returns Whether the level is accessible
 */
export function isLevelAccessible(
    themeId: string,
    level: number,
    themeLevels: Record<string, number>,
    allThemeIds: string[]
): boolean {
    const accessibleLevel = getAccessibleLevelForTheme(themeId, themeLevels, allThemeIds);
    return level <= accessibleLevel;
}

/**
 * Check if a level is completed for a theme.
 * 
 * @param themeId - The theme to check
 * @param level - The level to check (1-4)
 * @param themeLevels - Record of theme ID to highest completed level
 * @returns Whether the level is completed
 */
export function isLevelCompleted(
    themeId: string,
    level: number,
    themeLevels: Record<string, number>
): boolean {
    const completedLevel = themeLevels[themeId] ?? 0;
    return level <= completedLevel;
}

/**
 * Get a description of what needs to be done to unlock the next global level.
 * 
 * @param themeLevels - Record of theme ID to highest completed level
 * @param allThemeIds - All available theme IDs
 * @param themeNames - Record of theme ID to theme name for display
 * @returns Description of requirements or null if at max level
 */
export function getNextLevelRequirement(
    themeLevels: Record<string, number>,
    allThemeIds: string[],
    themeNames: Record<string, string>
): string | null {
    const globalLevel = calculateGlobalLevel(themeLevels, allThemeIds);

    if (globalLevel >= MAX_THEME_LEVEL) {
        return null; // Already at max level
    }

    // Find themes that need level N completed to unlock level N+1
    const targetLevel = globalLevel;
    const incompleteThemes = allThemeIds.filter(
        themeId => (themeLevels[themeId] ?? 0) < targetLevel
    );

    if (incompleteThemes.length === 0) {
        return null;
    }

    const themeNamesList = incompleteThemes
        .map(id => themeNames[id] ?? id)
        .join(', ');

    if (targetLevel === 1) {
        return `Complete Level 1 in all themes to unlock Level 2. Missing: ${themeNamesList}`;
    }

    return `Complete Level ${targetLevel} in: ${themeNamesList} to unlock Level ${globalLevel + 1}`;
}
