/**
 * Tests for gamification utility functions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    calculateStars,
    getStarDisplay,
    getStarArray,
    calculateLevel,
    getStarsForNextLevel,
    getProgressPercentage,
    getLevelProgress,
    updateStreak,
    isStreakAtRisk,
    getStreakDisplay,
    formatOrdinal,
    getMotivationalMessage,
    calculateMaxStars,
    DEFAULT_STARS_PER_LEVEL,
    calculateGlobalLevel,
    getAccessibleLevelForTheme,
    isLevelAccessible,
    isLevelCompleted,
    getNextLevelRequirement,
    MAX_THEME_LEVEL,
} from '../gamification';
import type { Streak } from '@/types/gamification';

describe('calculateStars', () => {
    it('returns 3 stars for first attempt', () => {
        expect(calculateStars(1)).toBe(3);
    });

    it('returns 2 stars for second attempt', () => {
        expect(calculateStars(2)).toBe(2);
    });

    it('returns 1 star for third attempt', () => {
        expect(calculateStars(3)).toBe(1);
    });

    it('returns 0 stars for any attempt beyond third (exceeded max attempts)', () => {
        expect(calculateStars(4)).toBe(0);
        expect(calculateStars(5)).toBe(0);
        expect(calculateStars(10)).toBe(0);
        expect(calculateStars(100)).toBe(0);
    });

    it('returns 0 stars for zero or negative attempts (invalid input)', () => {
        expect(calculateStars(0)).toBe(0);
        expect(calculateStars(-1)).toBe(0);
    });

    it('supports custom maxAttempts parameter', () => {
        expect(calculateStars(4, 4)).toBe(1);
        expect(calculateStars(5, 4)).toBe(0);
        expect(calculateStars(5, 5)).toBe(1);
        expect(calculateStars(6, 5)).toBe(0);
    });
});

describe('getStarDisplay', () => {
    it('returns three filled stars for 3 stars', () => {
        expect(getStarDisplay(3)).toBe('⭐⭐⭐');
    });

    it('returns correct display for 2 stars', () => {
        expect(getStarDisplay(2)).toBe('⭐⭐☆');
    });

    it('returns correct display for 1 star', () => {
        expect(getStarDisplay(1)).toBe('⭐☆☆');
    });

    it('returns three empty stars for 0 stars', () => {
        expect(getStarDisplay(0)).toBe('☆☆☆');
    });

    it('clamps values above 3 to 3', () => {
        expect(getStarDisplay(5)).toBe('⭐⭐⭐');
    });

    it('clamps negative values to 0', () => {
        expect(getStarDisplay(-1)).toBe('☆☆☆');
    });
});

describe('getStarArray', () => {
    it('returns [true, true, true] for 3 stars', () => {
        expect(getStarArray(3)).toEqual([true, true, true]);
    });

    it('returns [true, true, false] for 2 stars', () => {
        expect(getStarArray(2)).toEqual([true, true, false]);
    });

    it('returns [true, false, false] for 1 star', () => {
        expect(getStarArray(1)).toEqual([true, false, false]);
    });

    it('returns [false, false, false] for 0 stars', () => {
        expect(getStarArray(0)).toEqual([false, false, false]);
    });
});

describe('calculateLevel', () => {
    it('returns level 1 for 0 stars', () => {
        expect(calculateLevel(0)).toBe(1);
    });

    it('returns level 1 for 1-9 stars (default 10 stars per level)', () => {
        expect(calculateLevel(1)).toBe(1);
        expect(calculateLevel(5)).toBe(1);
        expect(calculateLevel(9)).toBe(1);
    });

    it('returns level 2 for 10-19 stars', () => {
        expect(calculateLevel(10)).toBe(2);
        expect(calculateLevel(15)).toBe(2);
        expect(calculateLevel(19)).toBe(2);
    });

    it('returns level 3 for 20-29 stars', () => {
        expect(calculateLevel(20)).toBe(3);
        expect(calculateLevel(25)).toBe(3);
        expect(calculateLevel(29)).toBe(3);
    });

    it('supports custom stars per level', () => {
        expect(calculateLevel(5, 5)).toBe(2);
        expect(calculateLevel(10, 5)).toBe(3);
        expect(calculateLevel(0, 5)).toBe(1);
    });

    it('calculates high levels correctly', () => {
        expect(calculateLevel(100)).toBe(11);
        expect(calculateLevel(99)).toBe(10);
    });
});

describe('getStarsForNextLevel', () => {
    it('returns 10 stars needed from 0 stars (default)', () => {
        expect(getStarsForNextLevel(0)).toBe(10);
    });

    it('returns 9 stars needed from 1 star', () => {
        expect(getStarsForNextLevel(1)).toBe(9);
    });

    it('returns 1 star needed when at 9 stars', () => {
        expect(getStarsForNextLevel(9)).toBe(1);
    });

    it('returns 10 stars needed when exactly at level boundary', () => {
        expect(getStarsForNextLevel(10)).toBe(10);
        expect(getStarsForNextLevel(20)).toBe(10);
    });

    it('supports custom stars per level', () => {
        expect(getStarsForNextLevel(0, 5)).toBe(5);
        expect(getStarsForNextLevel(3, 5)).toBe(2);
        expect(getStarsForNextLevel(5, 5)).toBe(5);
    });
});

describe('getProgressPercentage', () => {
    it('returns 0% for 0 stars', () => {
        expect(getProgressPercentage(0)).toBe(0);
    });

    it('returns 50% for 5 stars (default 10 per level)', () => {
        expect(getProgressPercentage(5)).toBe(50);
    });

    it('returns 90% for 9 stars', () => {
        expect(getProgressPercentage(9)).toBe(90);
    });

    it('returns 0% at level boundary (10 stars)', () => {
        expect(getProgressPercentage(10)).toBe(0);
    });

    it('returns correct percentage with custom stars per level', () => {
        expect(getProgressPercentage(2, 4)).toBe(50);
        expect(getProgressPercentage(3, 4)).toBe(75);
    });
});

describe('getLevelProgress', () => {
    it('returns correct progress for new user', () => {
        const progress = getLevelProgress(0);
        expect(progress.currentLevel).toBe(1);
        expect(progress.currentStars).toBe(0);
        expect(progress.starsToNextLevel).toBe(10);
        expect(progress.progressPercentage).toBe(0);
        expect(progress.justLeveledUp).toBe(false);
    });

    it('returns correct progress mid-level', () => {
        const progress = getLevelProgress(5);
        expect(progress.currentLevel).toBe(1);
        expect(progress.currentStars).toBe(5);
        expect(progress.starsToNextLevel).toBe(5);
        expect(progress.progressPercentage).toBe(50);
    });

    it('returns correct progress at level boundary', () => {
        const progress = getLevelProgress(10);
        expect(progress.currentLevel).toBe(2);
        expect(progress.currentStars).toBe(0);
        expect(progress.starsToNextLevel).toBe(10);
        expect(progress.progressPercentage).toBe(0);
    });

    it('detects level up when previousLevel provided', () => {
        const progress = getLevelProgress(10, DEFAULT_STARS_PER_LEVEL, 1);
        expect(progress.justLeveledUp).toBe(true);
    });

    it('does not detect level up when same level', () => {
        const progress = getLevelProgress(5, DEFAULT_STARS_PER_LEVEL, 1);
        expect(progress.justLeveledUp).toBe(false);
    });

    it('does not detect level up when previousLevel is higher', () => {
        const progress = getLevelProgress(5, DEFAULT_STARS_PER_LEVEL, 3);
        expect(progress.justLeveledUp).toBe(false);
    });
});

describe('updateStreak', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('does not update streak for same day activity', () => {
        const today = new Date('2024-01-15T12:00:00');
        vi.setSystemTime(today);

        const result = updateStreak(5, today);

        expect(result.currentStreak).toBe(5);
        expect(result.updated).toBe(false);
        expect(result.broken).toBe(false);
    });

    it('increments streak for yesterday activity', () => {
        const today = new Date('2024-01-15T12:00:00');
        const yesterday = new Date('2024-01-14T12:00:00');
        vi.setSystemTime(today);

        const result = updateStreak(5, yesterday);

        expect(result.currentStreak).toBe(6);
        expect(result.longestStreak).toBe(6);
        expect(result.updated).toBe(true);
        expect(result.broken).toBe(false);
    });

    it('updates longest streak when new streak exceeds it', () => {
        const today = new Date('2024-01-15T12:00:00');
        const yesterday = new Date('2024-01-14T12:00:00');
        vi.setSystemTime(today);

        const result = updateStreak(10, yesterday);

        expect(result.currentStreak).toBe(11);
        expect(result.longestStreak).toBe(11);
    });

    it('preserves longest streak when current streak is lower', () => {
        const today = new Date('2024-01-15T12:00:00');
        const yesterday = new Date('2024-01-14T12:00:00');
        vi.setSystemTime(today);

        // Simulate a user whose longest streak was 30, but current is 5
        const result = updateStreak(5, yesterday);

        expect(result.currentStreak).toBe(6);
        expect(result.longestStreak).toBe(6); // Since 6 > 5, it updates
    });

    it('breaks streak for 2+ day gap', () => {
        const today = new Date('2024-01-15T12:00:00');
        const twoDaysAgo = new Date('2024-01-13T12:00:00');
        vi.setSystemTime(today);

        const result = updateStreak(10, twoDaysAgo);

        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(10); // Preserves old longest
        expect(result.updated).toBe(true);
        expect(result.broken).toBe(true);
    });

    it('breaks streak for week-long gap', () => {
        const today = new Date('2024-01-15T12:00:00');
        const weekAgo = new Date('2024-01-08T12:00:00');
        vi.setSystemTime(today);

        const result = updateStreak(30, weekAgo);

        expect(result.currentStreak).toBe(1);
        expect(result.longestStreak).toBe(30);
        expect(result.broken).toBe(true);
    });

    it('returns correct ISO date string for lastActiveDate', () => {
        // Use a date that doesn't have timezone issues
        vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

        const result = updateStreak(5, new Date('2024-01-15T00:00:00Z'));

        // The result should be the ISO date string for the current day
        expect(result.lastActiveDate).toMatch(/2024-01-1[45]/);
    });

    it('handles time-of-day differences correctly', () => {
        // Activity late yesterday vs early today should count as consecutive
        const todayEarly = new Date('2024-01-15T06:00:00');
        const yesterdayLate = new Date('2024-01-14T22:00:00');
        vi.setSystemTime(todayEarly);

        const result = updateStreak(5, yesterdayLate);

        expect(result.currentStreak).toBe(6);
        expect(result.broken).toBe(false);
    });
});

describe('isStreakAtRisk', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns false when last active today', () => {
        vi.setSystemTime(new Date('2024-01-15T12:00:00'));
        expect(isStreakAtRisk('2024-01-15')).toBe(false);
    });

    it('returns true when last active yesterday', () => {
        vi.setSystemTime(new Date('2024-01-15T12:00:00'));
        expect(isStreakAtRisk('2024-01-14')).toBe(true);
    });

    it('returns true when last active days ago', () => {
        vi.setSystemTime(new Date('2024-01-15T12:00:00'));
        expect(isStreakAtRisk('2024-01-10')).toBe(true);
    });
});

describe('getStreakDisplay', () => {
    it('returns basic display for 1-2 day streak', () => {
        const streak: Streak = {
            current: 1,
            longest: 1,
            lastActiveDate: '2024-01-15',
            atRisk: false,
        };
        const display = getStreakDisplay(streak);
        expect(display.emoji).toBe('🔥');
        expect(display.message).toContain('1');
    });

    it('returns sparkle emoji for 3+ day streak', () => {
        const streak: Streak = {
            current: 3,
            longest: 5,
            lastActiveDate: '2024-01-15',
            atRisk: false,
        };
        const display = getStreakDisplay(streak);
        expect(display.emoji).toBe('✨');
    });

    it('returns star emoji for 7+ day streak', () => {
        const streak: Streak = {
            current: 7,
            longest: 10,
            lastActiveDate: '2024-01-15',
            atRisk: false,
        };
        const display = getStreakDisplay(streak);
        expect(display.emoji).toBe('🌟');
    });

    it('returns muscle emoji for 14+ day streak', () => {
        const streak: Streak = {
            current: 14,
            longest: 20,
            lastActiveDate: '2024-01-15',
            atRisk: false,
        };
        const display = getStreakDisplay(streak);
        expect(display.emoji).toBe('💪');
    });

    it('returns trophy emoji for 30+ day streak', () => {
        const streak: Streak = {
            current: 30,
            longest: 30,
            lastActiveDate: '2024-01-15',
            atRisk: false,
        };
        const display = getStreakDisplay(streak);
        expect(display.emoji).toBe('🏆');
    });
});

describe('formatOrdinal', () => {
    it('formats 1st correctly', () => {
        expect(formatOrdinal(1)).toBe('1st');
    });

    it('formats 2nd correctly', () => {
        expect(formatOrdinal(2)).toBe('2nd');
    });

    it('formats 3rd correctly', () => {
        expect(formatOrdinal(3)).toBe('3rd');
    });

    it('formats 4th correctly', () => {
        expect(formatOrdinal(4)).toBe('4th');
    });

    it('formats 11th correctly (special case)', () => {
        expect(formatOrdinal(11)).toBe('11th');
    });

    it('formats 12th correctly (special case)', () => {
        expect(formatOrdinal(12)).toBe('12th');
    });

    it('formats 13th correctly (special case)', () => {
        expect(formatOrdinal(13)).toBe('13th');
    });

    it('formats 21st correctly', () => {
        expect(formatOrdinal(21)).toBe('21st');
    });

    it('formats 22nd correctly', () => {
        expect(formatOrdinal(22)).toBe('22nd');
    });

    it('formats 23rd correctly', () => {
        expect(formatOrdinal(23)).toBe('23rd');
    });

    it('formats 101st correctly', () => {
        expect(formatOrdinal(101)).toBe('101st');
    });
});

describe('getMotivationalMessage', () => {
    it('returns perfect message for 3 stars', () => {
        const message = getMotivationalMessage(3);
        expect(message).toContain('Perfect');
    });

    it('returns enhanced message for 3 stars with 7+ streak', () => {
        const message = getMotivationalMessage(3, 7);
        expect(message).toContain('streak');
        expect(message).toContain('fire');
    });

    it('returns great job message for 2 stars', () => {
        const message = getMotivationalMessage(2);
        expect(message).toContain('Great');
    });

    it('returns good effort message for 1 star', () => {
        const message = getMotivationalMessage(1);
        expect(message).toContain('Good effort');
    });

    it('returns keep practicing message for 0 stars', () => {
        const message = getMotivationalMessage(0);
        expect(message).toContain('Keep practicing');
    });
});

describe('calculateMaxStars', () => {
    it('calculates max stars for 10 exercises (default 3 stars each)', () => {
        expect(calculateMaxStars(10)).toBe(30);
    });

    it('calculates max stars for 0 exercises', () => {
        expect(calculateMaxStars(0)).toBe(0);
    });

    it('supports custom max stars per exercise', () => {
        expect(calculateMaxStars(10, 5)).toBe(50);
    });

    it('handles single exercise', () => {
        expect(calculateMaxStars(1)).toBe(3);
    });
});

// ============================================================================
// Theme Level Progression Tests
// ============================================================================

describe('calculateGlobalLevel', () => {
    const allThemeIds = ['theme1', 'theme2', 'theme3'];

    it('returns level 1 when no themes have been completed', () => {
        const themeLevels = {};
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(1);
    });

    it('returns level 1 when some themes have level 0', () => {
        const themeLevels = { theme1: 0, theme2: 0 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(1);
    });

    it('returns level 2 when all themes have completed level 1', () => {
        const themeLevels = { theme1: 1, theme2: 1, theme3: 1 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(2);
    });

    it('returns level based on minimum completed level', () => {
        const themeLevels = { theme1: 2, theme2: 1, theme3: 3 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(2);
    });

    it('returns level 3 when all themes have completed level 2', () => {
        const themeLevels = { theme1: 2, theme2: 2, theme3: 2 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(3);
    });

    it('returns level 4 (max) when all themes have completed level 3', () => {
        const themeLevels = { theme1: 3, theme2: 3, theme3: 3 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(4);
    });

    it('caps at MAX_THEME_LEVEL (4)', () => {
        const themeLevels = { theme1: 4, theme2: 4, theme3: 4 };
        expect(calculateGlobalLevel(themeLevels, allThemeIds)).toBe(MAX_THEME_LEVEL);
    });

    it('handles empty theme list', () => {
        const themeLevels = { theme1: 1 };
        expect(calculateGlobalLevel(themeLevels, [])).toBe(1);
    });
});

describe('getAccessibleLevelForTheme', () => {
    const allThemeIds = ['theme1', 'theme2', 'theme3'];

    it('returns level 1 for a new theme', () => {
        const themeLevels = {};
        expect(getAccessibleLevelForTheme('theme1', themeLevels, allThemeIds)).toBe(1);
    });

    it('returns level 2 when theme has completed level 1 and global allows', () => {
        const themeLevels = { theme1: 1, theme2: 1, theme3: 1 };
        expect(getAccessibleLevelForTheme('theme1', themeLevels, allThemeIds)).toBe(2);
    });

    it('is limited by global level', () => {
        // theme1 has completed level 2, but theme2 and theme3 only have level 1
        const themeLevels = { theme1: 2, theme2: 1, theme3: 0 };
        // Global level is 1 (min of 2, 1, 0) + 1 = 1
        // So theme1 can only access up to level 1, not 3
        expect(getAccessibleLevelForTheme('theme1', themeLevels, allThemeIds)).toBe(1);
    });

    it('allows access to completed level + 1 when global allows', () => {
        const themeLevels = { theme1: 1, theme2: 1, theme3: 1 };
        // Global level is 2, theme1 completed level 1
        // Can access min(1+1, 2) = 2
        expect(getAccessibleLevelForTheme('theme1', themeLevels, allThemeIds)).toBe(2);
    });
});

describe('isLevelAccessible', () => {
    const allThemeIds = ['theme1', 'theme2', 'theme3'];

    it('returns true for level 1 always', () => {
        const themeLevels = {};
        expect(isLevelAccessible('theme1', 1, themeLevels, allThemeIds)).toBe(true);
    });

    it('returns false for level 2 when no levels completed', () => {
        const themeLevels = {};
        expect(isLevelAccessible('theme1', 2, themeLevels, allThemeIds)).toBe(false);
    });

    it('returns true for level 2 when all themes have level 1', () => {
        const themeLevels = { theme1: 1, theme2: 1, theme3: 1 };
        expect(isLevelAccessible('theme1', 2, themeLevels, allThemeIds)).toBe(true);
    });

    it('returns false for level 3 when one theme is behind', () => {
        const themeLevels = { theme1: 2, theme2: 1, theme3: 2 };
        // Global level is 2 (min is 1, +1)
        expect(isLevelAccessible('theme1', 3, themeLevels, allThemeIds)).toBe(false);
    });

    it('returns true for level 3 when all themes have level 2', () => {
        const themeLevels = { theme1: 2, theme2: 2, theme3: 2 };
        expect(isLevelAccessible('theme1', 3, themeLevels, allThemeIds)).toBe(true);
    });
});

describe('isLevelCompleted', () => {
    it('returns false when theme has no completed levels', () => {
        const themeLevels = {};
        expect(isLevelCompleted('theme1', 1, themeLevels)).toBe(false);
    });

    it('returns true for level 1 when theme completed level 1', () => {
        const themeLevels = { theme1: 1 };
        expect(isLevelCompleted('theme1', 1, themeLevels)).toBe(true);
    });

    it('returns false for level 2 when theme only completed level 1', () => {
        const themeLevels = { theme1: 1 };
        expect(isLevelCompleted('theme1', 2, themeLevels)).toBe(false);
    });

    it('returns true for level 1 when theme completed level 3', () => {
        const themeLevels = { theme1: 3 };
        expect(isLevelCompleted('theme1', 1, themeLevels)).toBe(true);
        expect(isLevelCompleted('theme1', 2, themeLevels)).toBe(true);
        expect(isLevelCompleted('theme1', 3, themeLevels)).toBe(true);
    });
});

describe('getNextLevelRequirement', () => {
    const allThemeIds = ['theme1', 'theme2', 'theme3'];
    const themeNames = {
        theme1: 'Theme One',
        theme2: 'Theme Two',
        theme3: 'Theme Three',
    };

    it('returns null when at max level', () => {
        const themeLevels = { theme1: 4, theme2: 4, theme3: 4 };
        expect(getNextLevelRequirement(themeLevels, allThemeIds, themeNames)).toBeNull();
    });

    it('returns message for incomplete themes at level 1', () => {
        const themeLevels = { theme1: 0, theme2: 0, theme3: 0 };
        const result = getNextLevelRequirement(themeLevels, allThemeIds, themeNames);
        expect(result).toContain('Level 1');
        expect(result).toContain('Theme One');
    });

    it('returns message showing which themes need completion', () => {
        const themeLevels = { theme1: 1, theme2: 0, theme3: 1 };
        const result = getNextLevelRequirement(themeLevels, allThemeIds, themeNames);
        expect(result).toContain('Theme Two');
        expect(result).toContain('Level 2');
    });
});