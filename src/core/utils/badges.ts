/**
 * Badge system utilities for the Mini Trainer Engine.
 * 
 * Provides badge checking functions and badge management.
 */

import type { BadgeDefinition } from '@/types/config';
import type { Badge, UserProfile } from '@/types/profile';
import { checkBadgeById } from './gamification';

// ============================================================================
// Badge Type Definitions
// ============================================================================

/**
 * Types of badges available in the system.
 */
export type BadgeType =
    | 'star_milestone'
    | 'streak_milestone'
    | 'level_milestone'
    | 'theme_completion'
    | 'area_mastery';

/**
 * Badge definition with metadata for the UI.
 */
export interface BadgeDefinitionWithMeta extends BadgeDefinition {
    /** Type of badge */
    type: BadgeType;
    /** Threshold value for this badge */
    threshold?: number;
    /** Related entity ID (theme, area) */
    relatedId?: string;
}

// ============================================================================
// Star Milestone Badges
// ============================================================================

/**
 * Star milestone badge definitions.
 */
export const STAR_MILESTONE_BADGES: BadgeDefinitionWithMeta[] = [
    {
        badge: {
            id: 'stars_10',
            name: 'Star Collector',
            description: 'Earn 10 stars',
            icon: '⭐',
        },
        type: 'star_milestone',
        threshold: 10,
    },
    {
        badge: {
            id: 'stars_25',
            name: 'Star Hunter',
            description: 'Earn 25 stars',
            icon: '🌟',
        },
        type: 'star_milestone',
        threshold: 25,
    },
    {
        badge: {
            id: 'stars_50',
            name: 'Star Champion',
            description: 'Earn 50 stars',
            icon: '💫',
        },
        type: 'star_milestone',
        threshold: 50,
    },
    {
        badge: {
            id: 'stars_100',
            name: 'Star Master',
            description: 'Earn 100 stars',
            icon: '✨',
        },
        type: 'star_milestone',
        threshold: 100,
    },
    {
        badge: {
            id: 'stars_250',
            name: 'Star Legend',
            description: 'Earn 250 stars',
            icon: '🌠',
        },
        type: 'star_milestone',
        threshold: 250,
    },
    {
        badge: {
            id: 'stars_500',
            name: 'Star Supernova',
            description: 'Earn 500 stars',
            icon: '🎆',
        },
        type: 'star_milestone',
        threshold: 500,
    },
];

// ============================================================================
// Streak Milestone Badges
// ============================================================================

/**
 * Streak milestone badge definitions.
 */
export const STREAK_MILESTONE_BADGES: BadgeDefinitionWithMeta[] = [
    {
        badge: {
            id: 'streak_3',
            name: 'Getting Started',
            description: 'Practice 3 days in a row',
            icon: '🔥',
        },
        type: 'streak_milestone',
        threshold: 3,
    },
    {
        badge: {
            id: 'streak_7',
            name: 'Week Warrior',
            description: 'Practice 7 days in a row',
            icon: '💪',
        },
        type: 'streak_milestone',
        threshold: 7,
    },
    {
        badge: {
            id: 'streak_14',
            name: 'Fortnight Fighter',
            description: 'Practice 14 days in a row',
            icon: '⚡',
        },
        type: 'streak_milestone',
        threshold: 14,
    },
    {
        badge: {
            id: 'streak_30',
            name: 'Monthly Master',
            description: 'Practice 30 days in a row',
            icon: '🏆',
        },
        type: 'streak_milestone',
        threshold: 30,
    },
];

// ============================================================================
// Level Milestone Badges
// ============================================================================

/**
 * Level milestone badge definitions.
 */
export const LEVEL_MILESTONE_BADGES: BadgeDefinitionWithMeta[] = [
    {
        badge: {
            id: 'level_5',
            name: 'Rising Star',
            description: 'Reach level 5 in any area',
            icon: '📈',
        },
        type: 'level_milestone',
        threshold: 5,
    },
    {
        badge: {
            id: 'level_10',
            name: 'Expert Learner',
            description: 'Reach level 10 in any area',
            icon: '🎓',
        },
        type: 'level_milestone',
        threshold: 10,
    },
    {
        badge: {
            id: 'level_20',
            name: 'Grand Master',
            description: 'Reach level 20 in any area',
            icon: '👑',
        },
        type: 'level_milestone',
        threshold: 20,
    },
];

// ============================================================================
// All Default Badges
// ============================================================================

/**
 * All default badge definitions.
 */
export const DEFAULT_BADGES: BadgeDefinitionWithMeta[] = [
    ...STAR_MILESTONE_BADGES,
    ...STREAK_MILESTONE_BADGES,
    ...LEVEL_MILESTONE_BADGES,
];

// ============================================================================
// Badge Checking Functions
// ============================================================================

/**
 * Check if a star milestone badge is earned.
 */
export function checkStarMilestone(threshold: number, profile: UserProfile): boolean {
    return profile.totalStars >= threshold;
}

/**
 * Check if a streak milestone badge is earned.
 */
export function checkStreakMilestone(threshold: number, profile: UserProfile): boolean {
    return profile.longestStreak >= threshold;
}

/**
 * Check if a level milestone badge is earned.
 */
export function checkLevelMilestone(threshold: number, profile: UserProfile): boolean {
    return Object.values(profile.currentLevels).some(level => level >= threshold);
}

/**
 * Check if a theme completion badge is earned.
 */
export function checkThemeCompletion(themeId: string, profile: UserProfile): boolean {
    const progress = profile.themeProgress[themeId];
    if (!progress) return false;
    return progress.exercisesCompleted >= progress.exercisesTotal && progress.exercisesTotal > 0;
}

/**
 * Check if an area mastery badge is earned.
 */
export function checkAreaMastery(areaId: string, profile: UserProfile): boolean {
    const level = profile.currentLevels[areaId as keyof typeof profile.currentLevels];
    return (level ?? 0) >= 10;
}

/**
 * Check all badges and return newly earned ones.
 * 
 * @param profile - User profile
 * @param badgeDefinitions - Badge definitions to check
 * @returns Array of newly earned badges
 */
export function checkAllBadges(
    profile: UserProfile,
    badgeDefinitions: BadgeDefinition[] = DEFAULT_BADGES
): Badge[] {
    const earnedBadges: Badge[] = [];
    const existingBadgeIds = new Set(profile.badges.map(b => b.id));

    for (const badgeDef of badgeDefinitions) {
        // Skip if already earned
        if (existingBadgeIds.has(badgeDef.badge.id)) continue;

        // Check if badge is earned
        if (checkBadgeById(badgeDef.badge.id, profile)) {
            const earnedBadge: Badge = {
                id: badgeDef.badge.id,
                name: badgeDef.badge.name,
                description: badgeDef.badge.description,
                icon: badgeDef.badge.icon,
                earnedAt: new Date().toISOString(),
            };
            earnedBadges.push(earnedBadge);
        }
    }

    return earnedBadges;
}

/**
 * Get badge progress for a specific badge.
 * 
 * @param badgeDef - Badge definition
 * @param profile - User profile
 * @returns Progress percentage (0-100) and current/target values
 */
export function getBadgeProgress(
    badgeDef: BadgeDefinitionWithMeta,
    profile: UserProfile
): { current: number; target: number; percentage: number } {
    const { type, threshold, relatedId } = badgeDef;

    let current = 0;
    let target = threshold ?? 1;

    switch (type) {
        case 'star_milestone':
            current = profile.totalStars;
            break;
        case 'streak_milestone':
            current = profile.longestStreak;
            break;
        case 'level_milestone':
            current = Math.max(...Object.values(profile.currentLevels), 0);
            break;
        case 'theme_completion':
            if (relatedId) {
                const progress = profile.themeProgress[relatedId];
                if (progress) {
                    current = progress.exercisesCompleted;
                    target = progress.exercisesTotal || 1;
                }
            }
            break;
        case 'area_mastery':
            if (relatedId) {
                current = profile.currentLevels[relatedId as keyof typeof profile.currentLevels] ?? 0;
                target = 10;
            }
            break;
    }

    return {
        current,
        target,
        percentage: Math.min((current / target) * 100, 100),
    };
}

/**
 * Get all badges with their progress.
 * 
 * @param profile - User profile
 * @param badgeDefinitions - Badge definitions
 * @returns Badges with progress information
 */
export function getAllBadgesWithProgress(
    profile: UserProfile,
    badgeDefinitions: BadgeDefinitionWithMeta[] = DEFAULT_BADGES
): Array<BadgeDefinitionWithMeta & { progress: { current: number; target: number; percentage: number }; earned: boolean }> {
    const earnedBadgeIds = new Set(profile.badges.map(b => b.id));

    return badgeDefinitions.map(badgeDef => ({
        ...badgeDef,
        progress: getBadgeProgress(badgeDef, profile),
        earned: earnedBadgeIds.has(badgeDef.badge.id),
    }));
}

/**
 * Sort badges by type and threshold.
 */
export function sortBadgesByType(badges: BadgeDefinitionWithMeta[]): BadgeDefinitionWithMeta[] {
    const typeOrder: BadgeType[] = ['star_milestone', 'streak_milestone', 'level_milestone', 'theme_completion', 'area_mastery'];

    return [...badges].sort((a, b) => {
        const typeDiff = typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
        if (typeDiff !== 0) return typeDiff;
        return (a.threshold ?? 0) - (b.threshold ?? 0);
    });
}

/**
 * Get next unearned badge for each category.
 */
export function getNextBadges(
    profile: UserProfile,
    badgeDefinitions: BadgeDefinitionWithMeta[] = DEFAULT_BADGES
): BadgeDefinitionWithMeta[] {
    const earnedBadgeIds = new Set(profile.badges.map(b => b.id));
    const nextBadges: BadgeDefinitionWithMeta[] = [];
    const seenTypes = new Set<BadgeType>();

    const sorted = sortBadgesByType(badgeDefinitions);

    for (const badgeDef of sorted) {
        if (seenTypes.has(badgeDef.type)) continue;
        if (!earnedBadgeIds.has(badgeDef.badge.id)) {
            nextBadges.push(badgeDef);
            seenTypes.add(badgeDef.type);
        }
    }

    return nextBadges;
}
