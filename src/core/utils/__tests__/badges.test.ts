/**
 * Tests for badge utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    checkAllBadges,
    getBadgeProgress,
    getAllBadgesWithProgress,
    sortBadgesByType,
    getNextBadges,
    checkStarMilestone,
    checkStreakMilestone,
    checkLevelMilestone,
    checkThemeCompletion,
    checkAreaMastery,
    DEFAULT_BADGES,
    STAR_MILESTONE_BADGES,
    STREAK_MILESTONE_BADGES,
    LEVEL_MILESTONE_BADGES,
} from '../badges';
import type { UserProfile, Badge } from '@/types/profile';
import type { ThemeProgress } from '@/types/config';

// Helper to create mock theme progress
function createMockThemeProgress(overrides: Partial<ThemeProgress> = {}): ThemeProgress {
    return {
        unlocked: true,
        exercisesCompleted: 0,
        exercisesTotal: 10,
        starsEarned: 0,
        maxStars: 30,
        ...overrides,
    };
}

// Helper to create a mock profile
function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
        id: 'test-profile',
        nickname: 'Test User',
        avatarId: 'avatar-1',
        createdAt: '2024-01-01T00:00:00Z',
        totalStars: 0,
        currentLevels: {},
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '2024-01-15',
        themeProgress: {},
        badges: [],
        ...overrides,
    };
}

describe('checkStarMilestone', () => {
    it('returns true when total stars meets threshold', () => {
        const profile = createMockProfile({ totalStars: 10 });
        expect(checkStarMilestone(10, profile)).toBe(true);
    });

    it('returns true when total stars exceeds threshold', () => {
        const profile = createMockProfile({ totalStars: 25 });
        expect(checkStarMilestone(10, profile)).toBe(true);
    });

    it('returns false when total stars below threshold', () => {
        const profile = createMockProfile({ totalStars: 5 });
        expect(checkStarMilestone(10, profile)).toBe(false);
    });
});

describe('checkStreakMilestone', () => {
    it('returns true when longest streak meets threshold', () => {
        const profile = createMockProfile({ longestStreak: 7, currentStreak: 7 });
        expect(checkStreakMilestone(7, profile)).toBe(true);
    });

    it('returns true when longest streak exceeds threshold', () => {
        const profile = createMockProfile({ longestStreak: 14, currentStreak: 14 });
        expect(checkStreakMilestone(7, profile)).toBe(true);
    });

    it('returns false when longest streak below threshold', () => {
        const profile = createMockProfile({ longestStreak: 3, currentStreak: 3 });
        expect(checkStreakMilestone(7, profile)).toBe(false);
    });
});

describe('checkLevelMilestone', () => {
    it('returns true when any area reaches threshold level', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 5, writing: 3 },
        });
        expect(checkLevelMilestone(5, profile)).toBe(true);
    });

    it('returns true when any area exceeds threshold level', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 10, writing: 3 },
        });
        expect(checkLevelMilestone(5, profile)).toBe(true);
    });

    it('returns false when no area reaches threshold', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 3, writing: 4 },
        });
        expect(checkLevelMilestone(5, profile)).toBe(false);
    });

    it('returns false when currentLevels is empty', () => {
        const profile = createMockProfile();
        expect(checkLevelMilestone(5, profile)).toBe(false);
    });
});

describe('checkThemeCompletion', () => {
    it('returns true when theme is fully completed', () => {
        const profile = createMockProfile({
            themeProgress: {
                'theme-1': createMockThemeProgress({ exercisesCompleted: 10, exercisesTotal: 10 }),
            },
        });
        expect(checkThemeCompletion('theme-1', profile)).toBe(true);
    });

    it('returns false when theme is partially completed', () => {
        const profile = createMockProfile({
            themeProgress: {
                'theme-1': createMockThemeProgress({ exercisesCompleted: 5, exercisesTotal: 10 }),
            },
        });
        expect(checkThemeCompletion('theme-1', profile)).toBe(false);
    });

    it('returns false when theme progress does not exist', () => {
        const profile = createMockProfile();
        expect(checkThemeCompletion('unknown-theme', profile)).toBe(false);
    });

    it('returns false when exercisesTotal is 0', () => {
        const profile = createMockProfile({
            themeProgress: {
                'theme-1': createMockThemeProgress({ exercisesCompleted: 0, exercisesTotal: 0 }),
            },
        });
        expect(checkThemeCompletion('theme-1', profile)).toBe(false);
    });
});

describe('checkAreaMastery', () => {
    it('returns true when area level is 10 or higher', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 10 },
        });
        expect(checkAreaMastery('reading', profile)).toBe(true);
    });

    it('returns true when area level exceeds 10', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 15 },
        });
        expect(checkAreaMastery('reading', profile)).toBe(true);
    });

    it('returns false when area level below 10', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 9 },
        });
        expect(checkAreaMastery('reading', profile)).toBe(false);
    });

    it('returns false when area does not exist', () => {
        const profile = createMockProfile();
        expect(checkAreaMastery('unknown-area', profile)).toBe(false);
    });
});

describe('checkAllBadges', () => {
    it('returns empty array when no badges are earned', () => {
        const profile = createMockProfile({ totalStars: 0 });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result).toEqual([]);
    });

    it('returns stars_10 badge when totalStars >= 10', () => {
        const profile = createMockProfile({ totalStars: 10 });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result.some(b => b.id === 'stars_10')).toBe(true);
    });

    it('returns multiple star badges when totalStars is high', () => {
        const profile = createMockProfile({ totalStars: 50 });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result.some(b => b.id === 'stars_10')).toBe(true);
        expect(result.some(b => b.id === 'stars_25')).toBe(true);
        expect(result.some(b => b.id === 'stars_50')).toBe(true);
    });

    it('returns streak badge when longest streak meets threshold', () => {
        const profile = createMockProfile({ longestStreak: 7, currentStreak: 7 });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result.some(b => b.id === 'streak_3')).toBe(true);
        expect(result.some(b => b.id === 'streak_7')).toBe(true);
    });

    it('returns level badge when any area reaches threshold', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 5 },
        });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result.some(b => b.id === 'level_5')).toBe(true);
    });

    it('excludes already earned badges', () => {
        const existingBadge: Badge = {
            id: 'stars_10',
            name: 'Star Collector',
            description: 'Earn 10 stars',
            icon: '⭐',
            earnedAt: '2024-01-10T00:00:00Z',
        };
        const profile = createMockProfile({ totalStars: 15, badges: [existingBadge] });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result.some(b => b.id === 'stars_10')).toBe(false);
    });

    it('includes earnedAt timestamp for new badges', () => {
        const profile = createMockProfile({ totalStars: 10 });
        const result = checkAllBadges(profile, DEFAULT_BADGES);
        expect(result[0]?.earnedAt).toBeDefined();
        expect(typeof result[0]?.earnedAt).toBe('string');
    });
});

describe('getBadgeProgress', () => {
    it('calculates progress for star milestone badge', () => {
        const profile = createMockProfile({ totalStars: 5 });
        const badgeDef = STAR_MILESTONE_BADGES[0]!; // stars_10
        const progress = getBadgeProgress(badgeDef, profile);
        expect(progress.current).toBe(5);
        expect(progress.target).toBe(10);
        expect(progress.percentage).toBe(50);
    });

    it('calculates progress for streak milestone badge', () => {
        const profile = createMockProfile({ longestStreak: 3, currentStreak: 3 });
        const badgeDef = STREAK_MILESTONE_BADGES[1]!; // streak_7
        const progress = getBadgeProgress(badgeDef, profile);
        expect(progress.current).toBe(3);
        expect(progress.target).toBe(7);
    });

    it('calculates progress for level milestone badge', () => {
        const profile = createMockProfile({
            currentLevels: { reading: 3, writing: 7 },
        });
        const badgeDef = LEVEL_MILESTONE_BADGES[0]!; // level_5
        const progress = getBadgeProgress(badgeDef, profile);
        expect(progress.current).toBe(7); // Max level across areas
        expect(progress.target).toBe(5);
        expect(progress.percentage).toBe(100); // 7 >= 5
    });

    it('caps percentage at 100', () => {
        const profile = createMockProfile({ totalStars: 100 });
        const badgeDef = STAR_MILESTONE_BADGES[0]!; // stars_10
        const progress = getBadgeProgress(badgeDef, profile);
        expect(progress.percentage).toBe(100);
    });
});

describe('getAllBadgesWithProgress', () => {
    it('returns all badges with progress information', () => {
        const profile = createMockProfile({ totalStars: 15 });
        const result = getAllBadgesWithProgress(profile, DEFAULT_BADGES);
        expect(result.length).toBe(DEFAULT_BADGES.length);
        expect(result[0]?.progress).toBeDefined();
        expect(result[0]?.earned).toBeDefined();
    });

    it('marks earned badges correctly', () => {
        const existingBadge: Badge = {
            id: 'stars_10',
            name: 'Star Collector',
            description: 'Earn 10 stars',
            icon: '⭐',
            earnedAt: '2024-01-10T00:00:00Z',
        };
        const profile = createMockProfile({ totalStars: 15, badges: [existingBadge] });
        const result = getAllBadgesWithProgress(profile, DEFAULT_BADGES);
        const stars10Badge = result.find(b => b.badge.id === 'stars_10');
        expect(stars10Badge?.earned).toBe(true);
    });
});

describe('sortBadgesByType', () => {
    it('sorts badges by type order', () => {
        const sorted = sortBadgesByType(DEFAULT_BADGES);
        const types = sorted.map(b => b.type);

        // Star milestones should come first
        expect(types[0]).toBe('star_milestone');

        // Find indices for type changes
        const starEnd = types.lastIndexOf('star_milestone');
        const streakStart = types.indexOf('streak_milestone');
        const streakEnd = types.lastIndexOf('streak_milestone');
        const levelStart = types.indexOf('level_milestone');

        expect(streakStart).toBeGreaterThan(starEnd);
        expect(levelStart).toBeGreaterThan(streakEnd);
    });

    it('sorts badges by threshold within same type', () => {
        const sorted = sortBadgesByType(STAR_MILESTONE_BADGES);
        const thresholds = sorted.map(b => b.threshold);

        for (let i = 1; i < thresholds.length; i++) {
            expect(thresholds[i]!).toBeGreaterThanOrEqual(thresholds[i - 1]!);
        }
    });
});

describe('getNextBadges', () => {
    it('returns next unearned badge for each category', () => {
        const profile = createMockProfile({ totalStars: 5 });
        const result = getNextBadges(profile, DEFAULT_BADGES);

        // Should have one badge per category
        const types = new Set(result.map(b => b.type));
        expect(types.size).toBe(result.length);
    });

    it('returns empty array when all badges earned', () => {
        // Create profile with all badges earned
        const allBadgeIds = DEFAULT_BADGES.map(b => b.badge.id);
        const earnedBadges: Badge[] = allBadgeIds.map(id => ({
            id,
            name: 'Earned',
            description: 'Already earned',
            icon: '✓',
            earnedAt: '2024-01-01T00:00:00Z',
        }));

        const profile = createMockProfile({
            totalStars: 1000,
            badges: earnedBadges,
            longestStreak: 30,
            currentStreak: 30,
            currentLevels: { reading: 20 },
        });

        const result = getNextBadges(profile, DEFAULT_BADGES);
        expect(result.length).toBe(0);
    });

    it('returns first star badge for new user', () => {
        const profile = createMockProfile({ totalStars: 0 });
        const result = getNextBadges(profile, DEFAULT_BADGES);

        const starBadge = result.find(b => b.type === 'star_milestone');
        expect(starBadge?.badge.id).toBe('stars_10');
    });
});

describe('DEFAULT_BADGES', () => {
    it('contains all star milestone badges', () => {
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_10')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_25')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_50')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_100')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_250')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'stars_500')).toBe(true);
    });

    it('contains all streak milestone badges', () => {
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'streak_3')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'streak_7')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'streak_14')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'streak_30')).toBe(true);
    });

    it('contains all level milestone badges', () => {
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'level_5')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'level_10')).toBe(true);
        expect(DEFAULT_BADGES.some(b => b.badge.id === 'level_20')).toBe(true);
    });

    it('each badge has required properties', () => {
        for (const badge of DEFAULT_BADGES) {
            expect(badge.badge.id).toBeDefined();
            expect(badge.badge.name).toBeDefined();
            expect(badge.badge.description).toBeDefined();
            expect(badge.badge.icon).toBeDefined();
            expect(badge.type).toBeDefined();
        }
    });
});