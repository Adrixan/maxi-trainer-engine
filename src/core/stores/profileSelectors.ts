/**
 * Selectors for the profile store.
 * 
 * These selectors extract and derive specific data from the profile state
 * to avoid redundant computations and keep components clean.
 * 
 * Import these instead of directly accessing activeProfile properties.
 */

import type { ProfileState } from './profileStore';
import type { ThemeId, ObservationAreaId, Badge, ThemeProgress } from '@/types';

// ============================================================================
// Base Selectors
// ============================================================================

/**
 * Selector for active profile.
 */
export const selectActiveProfile = (state: ProfileState) => state.activeProfile;

/**
 * Selector for profile nickname.
 */
export const selectNickname = (state: ProfileState) => state.activeProfile?.nickname;

/**
 * Selector for profile avatar.
 */
export const selectAvatar = (state: ProfileState) => state.activeProfile?.avatarId;

/**
 * Selector for total stars.
 */
export const selectTotalStars = (state: ProfileState) => state.activeProfile?.totalStars ?? 0;

/**
 * Selector for current streak.
 */
export const selectCurrentStreak = (state: ProfileState) => state.activeProfile?.currentStreak ?? 0;

/**
 * Selector for longest streak.
 */
export const selectLongestStreak = (state: ProfileState) => state.activeProfile?.longestStreak ?? 0;

/**
 * Selector for badges.
 */
export const selectBadges = (state: ProfileState): Badge[] => state.activeProfile?.badges ?? [];

/**
 * Selector for theme progress.
 */
export const selectThemeProgress = (themeId: ThemeId) => (state: ProfileState): ThemeProgress | undefined =>
    state.activeProfile?.themeProgress[themeId];

/**
 * Selector for level in an area.
 */
export const selectLevel = (areaId: ObservationAreaId) => (state: ProfileState): number =>
    state.activeProfile?.currentLevels[areaId] ?? 1;

/**
 * Selector for theme levels (highest completed level per theme).
 */
export const selectThemeLevels = (state: ProfileState): Record<ThemeId, number> =>
    state.activeProfile?.themeLevels ?? {};

/**
 * Selector for a specific theme's completed level.
 */
export const selectThemeLevel = (themeId: ThemeId) => (state: ProfileState): number =>
    state.activeProfile?.themeLevels?.[themeId] ?? 0;

// ============================================================================
// Derived Selectors (simple functions)
// ============================================================================

/**
 * Selector for checking if user has any profile.
 */
export const selectHasProfile = (state: ProfileState): boolean => state.activeProfile !== null;

/**
 * Selector for getting profile display name (nickname or default).
 */
export const selectDisplayName = (state: ProfileState): string => state.activeProfile?.nickname ?? 'Player';

/**
 * Selector for checking if user has earned any badges.
 */
export const selectHasBadges = (state: ProfileState): boolean => (state.activeProfile?.badges?.length ?? 0) > 0;

/**
 * Selector for counting total badges earned.
 */
export const selectBadgeCount = (state: ProfileState): number => state.activeProfile?.badges?.length ?? 0;

/**
 * Selector for checking if user has any stars.
 */
export const selectHasStars = (state: ProfileState): boolean => (state.activeProfile?.totalStars ?? 0) > 0;

/**
 * Selector for checking if user has an active streak.
 */
export const selectHasActiveStreak = (state: ProfileState): boolean => (state.activeProfile?.currentStreak ?? 0) > 0;

/**
 * Selector for getting streak status.
 */
export const selectStreakStatus = (state: ProfileState): { current: number; longest: number; isLongest: boolean } => {
    const current = state.activeProfile?.currentStreak ?? 0;
    const longest = state.activeProfile?.longestStreak ?? 0;
    return {
        current,
        longest,
        isLongest: current >= longest && current > 0,
    };
};

/**
 * Selector for getting a specific badge by ID.
 */
export const selectBadgeById = (badgeId: string) => (state: ProfileState): Badge | undefined =>
    state.activeProfile?.badges?.find((b: Badge) => b.id === badgeId);

/**
 * Selector for getting theme progress with completion percentage.
 */
export const selectThemeProgressWithPercentage = (themeId: ThemeId) => (state: ProfileState): (ThemeProgress & { percentage: number }) | null => {
    const progress = state.activeProfile?.themeProgress[themeId];
    if (!progress) return null;
    const percentage = progress.exercisesTotal > 0
        ? Math.round((progress.exercisesCompleted / progress.exercisesTotal) * 100)
        : 0;
    return { ...progress, percentage };
};

/**
 * Selector for getting overall progress.
 */
export const selectOverallProgress = (state: ProfileState): { stars: number; badges: number; hasProfile: boolean } => ({
    stars: state.activeProfile?.totalStars ?? 0,
    badges: state.activeProfile?.badges?.length ?? 0,
    hasProfile: state.activeProfile !== null,
});
