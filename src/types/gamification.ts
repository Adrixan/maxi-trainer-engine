/**
 * Gamification type definitions for the Mini Trainer Engine.
 * 
 * This module defines types for the reward and progression system,
 * including stars, levels, streaks, and scoring.
 */

// ============================================================================
// Star Rating Types
// ============================================================================

/**
 * Star rating type (1-3 stars).
 * Represents the quality of completion for an exercise.
 */
export type StarRating = 1 | 2 | 3;

/**
 * Possible score values (0-3 stars).
 * 0 indicates incorrect, 1-3 indicate varying degrees of success.
 */
export type Score = 0 | StarRating;

// ============================================================================
// Level Types
// ============================================================================

/**
 * Numeric level type.
 * Represents progression within an observation area.
 */
export type Level = number;

/**
 * Level range constraint.
 * Levels are typically 1-10 in the diagnostic framework.
 */
export type LevelRange = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// ============================================================================
// Streak Types
// ============================================================================

/**
 * Streak information.
 * Tracks consecutive days of activity.
 */
export interface Streak {
    /** Current streak count (consecutive days) */
    current: number;
    /** Longest streak achieved */
    longest: number;
    /** ISO 8601 date of last activity */
    lastActiveDate: string;
    /** Whether the streak is at risk (no activity today) */
    atRisk: boolean;
}

/**
 * Streak milestone definition.
 * Defines rewards for achieving streak lengths.
 */
export interface StreakMilestone {
    /** Number of days required */
    days: number;
    /** Badge ID awarded for reaching this milestone */
    badgeId: string;
    /** Bonus stars awarded */
    bonusStars?: number;
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Strategy for calculating star ratings.
 */
export type ScoringStrategy = 'attempts' | 'time' | 'custom';

/**
 * Result of scoring an exercise attempt.
 */
export interface ScoringResult {
    /** Star rating earned (0-3) */
    stars: Score;
    /** Whether the answer was correct */
    correct: boolean;
    /** Number of attempts made */
    attempts: number;
    /** Time spent in seconds */
    timeSpentSeconds: number;
    /** Points earned (if using point-based system) */
    points?: number;
    /** Bonus points from multipliers */
    bonusPoints?: number;
    /** Feedback message key */
    feedbackKey: string;
}

/**
 * Parameters for scoring calculation.
 */
export interface ScoringParams {
    /** Whether the answer was correct */
    correct: boolean;
    /** Number of attempts made */
    attempts: number;
    /** Time spent in seconds */
    timeSpentSeconds: number;
    /** Maximum allowed attempts */
    maxAttempts: number;
    /** Expected time for the exercise */
    expectedTimeSeconds?: number;
    /** Difficulty level of the exercise */
    difficulty: 1 | 2 | 3;
}

/**
 * Star threshold configuration.
 * Defines attempts/time thresholds for star ratings.
 */
export interface StarThresholds {
    /** Thresholds for attempts-based scoring */
    attempts: {
        /** Maximum attempts for 3 stars */
        three: number;
        /** Maximum attempts for 2 stars */
        two: number;
        /** Maximum attempts for 1 star */
        one: number;
    };
    /** Thresholds for time-based scoring (in seconds) */
    time?: {
        /** Maximum time for 3 stars */
        three: number;
        /** Maximum time for 2 stars */
        two: number;
        /** Maximum time for 1 star */
        one: number;
    };
}

// ============================================================================
// Progress Types
// ============================================================================

/**
 * Level progress information.
 */
export interface LevelProgress {
    /** Current level */
    currentLevel: Level;
    /** Total stars earned toward next level */
    currentStars: number;
    /** Stars required to reach next level */
    starsToNextLevel: number;
    /** Progress percentage (0-100) */
    progressPercentage: number;
    /** Whether a level up just occurred */
    justLeveledUp: boolean;
}

/**
 * Experience/points information.
 */
export interface ExperienceInfo {
    /** Total points earned */
    totalPoints: number;
    /** Points earned today */
    todayPoints: number;
    /** Points earned this week */
    weekPoints: number;
    /** Multiplier for current session */
    multiplier: number;
}

// ============================================================================
// Achievement Types
// ============================================================================

/**
 * Achievement category.
 */
export type AchievementCategory =
    | 'streak'
    | 'stars'
    | 'exercises'
    | 'themes'
    | 'levels'
    | 'special';

/**
 * Achievement progress.
 */
export interface AchievementProgress {
    /** Achievement/badge ID */
    id: string;
    /** Current progress value */
    current: number;
    /** Target value to unlock */
    target: number;
    /** Whether this achievement is unlocked */
    unlocked: boolean;
    /** ISO 8601 timestamp when unlocked */
    unlockedAt?: string;
}

// ============================================================================
// Leaderboard Types
// ============================================================================

/**
 * Leaderboard entry.
 */
export interface LeaderboardEntry {
    /** User profile ID */
    profileId: string;
    /** Display name */
    nickname: string;
    /** Avatar identifier */
    avatarId: string;
    /** Total stars */
    stars: number;
    /** Current level */
    level: Level;
    /** Rank position */
    rank: number;
}

/**
 * Leaderboard time frame.
 */
export type LeaderboardTimeFrame = 'daily' | 'weekly' | 'monthly' | 'all-time';

/**
 * Leaderboard configuration.
 */
export interface LeaderboardConfig {
    /** Time frame for the leaderboard */
    timeFrame: LeaderboardTimeFrame;
    /** Maximum number of entries to show */
    maxEntries: number;
    /** Whether to include current user even if not in top */
    includeCurrentUser: boolean;
}
