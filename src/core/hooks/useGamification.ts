/**
 * Gamification hook for the Mini Trainer Engine.
 * 
 * Combines scoring, badge checking, level progression, and notification state.
 * 
 * Responsibilities:
 * - Star calculation and tracking
 * - Level progression
 * - Badge checking and earning
 * - Streak management
 * - Notification state (earned badges, level up celebrations)
 */

import { useCallback, useMemo, useState } from 'react';
import { useProfileStore } from '@core/stores/profileStore';
import { useAppStore } from '@core/stores/appStore';
import {
    calculateStars,
    calculateLevel,
    getLevelProgress,
    updateStreak,
    type StreakResult,
} from '@core/utils/gamification';
import {
    checkAllBadges,
    DEFAULT_BADGES,
    type BadgeDefinitionWithMeta,
} from '@core/utils/badges';
import { getExerciseResultsByArea } from '@core/storage';
import { playLevelUp, playBadge } from '@core/utils/sounds';
import type { Badge } from '@/types/profile';
import type { LevelProgress, Score } from '@/types/gamification';
import type { BadgeDefinition } from '@/types/config';
import { useGamificationNotifications } from './useGamificationNotifications';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of processing an exercise completion.
 */
export interface ExerciseCompletionResult {
    /** Stars earned for this exercise (0-3, where 0 means failed) */
    starsEarned: Score;
    /** Whether a level up occurred */
    leveledUp: boolean;
    /** New level if leveled up */
    newLevel: number | undefined;
    /** New badges earned */
    newBadges: Badge[];
    /** Streak update result */
    streakUpdate: StreakResult | null;
}

/**
 * Notification state for gamification events.
 */
export interface GamificationNotifications {
    /** Level up celebration state */
    levelUpLevel: number | null;
    /** Badges earned during session */
    earnedBadges: Badge[];
    /** Current badge index for display */
    currentBadgeIndex: number;
}

/**
 * Gamification state returned by the hook.
 */
export interface GamificationState {
    /** Total stars earned */
    totalStars: number;
    /** Current level */
    currentLevel: number;
    /** Level progress information */
    levelProgress: LevelProgress;
    /** Current streak */
    currentStreak: number;
    /** Longest streak */
    longestStreak: number;
    /** All earned badges */
    badges: Badge[];
    /** Next badges to earn (one per category) */
    nextBadges: BadgeDefinitionWithMeta[];
    /** Notification state */
    notifications: GamificationNotifications;
}

/**
 * Gamification actions returned by the hook.
 */
export interface GamificationActions {
    /** Process exercise completion and return results */
    processExerciseCompletion: (attempts: number) => ExerciseCompletionResult;
    /** Manually check for new badges */
    checkForBadges: () => Badge[];
    /** Get stars for a specific area (async, reads from storage) */
    getAreaStars: (areaId: string) => Promise<number>;
    /** Get level for a specific area */
    getAreaLevel: (areaId: string) => number;
    /** Dismiss current badge notification */
    dismissBadge: () => void;
    /** Clear level up notification */
    clearLevelUp: () => void;
}

/**
 * Hook return type.
 */
export type UseGamificationReturn = GamificationState & GamificationActions;

/**
 * Hook options.
 */
export interface UseGamificationOptions {
    /** Stars required per level */
    starsPerLevel?: number;
    /** Badge definitions to use */
    badgeDefinitions?: BadgeDefinition[];
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing gamification state and actions.
 * 
 * Integrates with the profile store for persistence.
 */
export function useGamification(
    options: UseGamificationOptions = {}
): UseGamificationReturn {
    const {
        starsPerLevel = 10,
        badgeDefinitions = DEFAULT_BADGES,
    } = options;

    // Profile store
    const activeProfile = useProfileStore((state) => state.activeProfile);

    // App store for sound settings
    const soundEnabled = useAppStore((state) => state.settings.soundEnabled);

    // Local state for tracking level changes
    const [previousLevel, setPreviousLevel] = useState<number | null>(null);

    // Notification state (extracted to separate hook)
    const {
        earnedBadges,
        levelUpLevel,
        currentBadgeIndex,
        setEarnedBadges,
        setLevelUpLevel,
        setCurrentBadgeIndex,
        dismissBadge,
        clearLevelUp,
    } = useGamificationNotifications();

    // Calculate current gamification state
    const state = useMemo<GamificationState>(() => {
        const totalStars = activeProfile?.totalStars ?? 0;
        const currentLevel = calculateLevel(totalStars, starsPerLevel);
        const levelProgress = getLevelProgress(totalStars, starsPerLevel, previousLevel ?? currentLevel);
        const currentStreak = activeProfile?.currentStreak ?? 0;
        const longestStreak = activeProfile?.longestStreak ?? 0;
        const badges = activeProfile?.badges ?? [];

        // Get next badges to earn
        const earnedBadgeIds = new Set(badges.map(b => b.id));
        const nextBadges: BadgeDefinitionWithMeta[] = [];
        const seenTypes = new Set<string>();

        for (const badgeDef of badgeDefinitions as BadgeDefinitionWithMeta[]) {
            if (earnedBadgeIds.has(badgeDef.badge.id)) continue;
            if (seenTypes.has(badgeDef.type)) continue;
            nextBadges.push(badgeDef);
            seenTypes.add(badgeDef.type);
        }

        return {
            totalStars,
            currentLevel,
            levelProgress,
            currentStreak,
            longestStreak,
            badges,
            nextBadges,
            notifications: {
                levelUpLevel,
                earnedBadges,
                currentBadgeIndex,
            },
        };
    }, [activeProfile, starsPerLevel, previousLevel, badgeDefinitions, levelUpLevel, earnedBadges, currentBadgeIndex]);

    /**
     * Process exercise completion and update gamification state.
     * 
     * This function handles all gamification updates when an exercise is completed:
     * - Awards stars based on attempts (1st = 3★, 2nd = 2★, 3rd = 1★)
     * - Updates streak count
     * - Checks for level ups
     * - Checks for new badges
     * - Plays appropriate sound effects
     * - Updates notification state for UI display
     * 
     * **IMPORTANT: Caller Responsibilities**
     * This function should ONLY be called when:
     * 1. The exercise was completed correctly (answer is correct)
     * 2. This is the FIRST time completing this exercise (not previously completed)
     * 
     * The caller (typically `useExercisePageState`) is responsible for:
     * - Checking `hasExerciseBeenCompleted()` before calling
     * - Verifying `currentAnswer.correct` is true
     * 
     * @param attempts - Number of attempts made (1-3). Lower = more stars.
     * @returns ExerciseCompletionResult with stars earned, level up info, and new badges
     * 
     * @example
     * ```typescript
     * // In useExercisePageState handleNext:
     * const wasPreviouslyCompleted = await hasExerciseBeenCompleted(profileId, exerciseId);
     * if (!wasPreviouslyCompleted && currentAnswer.correct) {
     *     processExerciseCompletion(currentAnswer.attempts);
     * }
     * ```
     */
    const processExerciseCompletion = useCallback((
        attempts: number
    ): ExerciseCompletionResult => {
        // Get fresh profile state to avoid stale references (Issue #4)
        // Using getState() is the recommended Zustand pattern for getting latest state in callbacks
        const currentProfile = useProfileStore.getState().activeProfile;

        if (!currentProfile) {
            // Issue #10: Return 0 stars when no profile (not 1)
            return {
                starsEarned: 0 as Score,
                leveledUp: false,
                newLevel: undefined,
                newBadges: [],
                streakUpdate: null,
            };
        }

        // Calculate stars
        const starsEarned = calculateStars(attempts);

        // Get previous level
        const prevLevel = calculateLevel(currentProfile.totalStars, starsPerLevel);

        // Issue #1: Add stars to profile via store action
        // Note: exerciseStore also tracks stars in results, but that's for session stats
        // The profile's totalStars is the source of truth for progression
        useProfileStore.getState().addStars(starsEarned);

        // Calculate new level
        const newTotalStars = currentProfile.totalStars + starsEarned;
        const newLevel = calculateLevel(newTotalStars, starsPerLevel);
        const leveledUp = newLevel > prevLevel;

        // Update previous level for tracking
        if (leveledUp) {
            setPreviousLevel(prevLevel);
        }

        // Update streak
        useProfileStore.getState().incrementStreak();
        const streakUpdate = updateStreak(
            currentProfile.currentStreak,
            new Date(currentProfile.lastActiveDate)
        );

        // Issue #5: Get fresh profile after updates for badge checking
        const updatedProfileAfterChanges = useProfileStore.getState().activeProfile;

        // Check for new badges with fresh profile data
        const profileForBadgeCheck = updatedProfileAfterChanges || {
            ...currentProfile,
            totalStars: newTotalStars,
            currentStreak: streakUpdate.currentStreak,
            longestStreak: streakUpdate.longestStreak,
        };
        const newBadges = checkAllBadges(profileForBadgeCheck, badgeDefinitions);

        // Earn new badges
        for (const badge of newBadges) {
            useProfileStore.getState().earnBadge(badge);
        }

        // Update notification state and play sounds
        if (leveledUp && newLevel) {
            setLevelUpLevel(newLevel);
            playLevelUp(soundEnabled);
        }

        if (newBadges.length > 0) {
            setEarnedBadges(newBadges);
            setCurrentBadgeIndex(0);
            playBadge(soundEnabled);
        }

        return {
            starsEarned,
            leveledUp,
            newLevel: leveledUp ? newLevel : undefined,
            newBadges,
            streakUpdate,
        };
    }, [starsPerLevel, badgeDefinitions, soundEnabled]);

    // Check for new badges manually
    const checkForBadges = useCallback((): Badge[] => {
        if (!activeProfile) return [];
        return checkAllBadges(activeProfile, badgeDefinitions);
    }, [activeProfile, badgeDefinitions]);

    // Get stars for a specific area (from exercise results in storage)
    const getAreaStars = useCallback(async (areaId: string): Promise<number> => {
        if (!activeProfile) return 0;

        // Get exercise results filtered by area from storage
        const results = await getExerciseResultsByArea(areaId);

        // Filter by profile and correct answers, then sum scores
        return results
            .filter(result => result.childProfileId === activeProfile.id && result.correct)
            .reduce((sum, result) => sum + result.score, 0);
    }, [activeProfile]);

    // Get level for a specific area
    const getAreaLevel = useCallback((areaId: string): number => {
        if (!activeProfile) return 1;
        return activeProfile.currentLevels[areaId as keyof typeof activeProfile.currentLevels] ?? 1;
    }, [activeProfile]);

    return {
        ...state,
        processExerciseCompletion,
        checkForBadges,
        getAreaStars,
        getAreaLevel,
        dismissBadge,
        clearLevelUp,
    };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for tracking level progress only.
 */
export function useLevelProgress(starsPerLevel: number = 10): LevelProgress {
    const totalStars = useProfileStore((state) => state.activeProfile?.totalStars ?? 0);

    return useMemo(() =>
        getLevelProgress(totalStars, starsPerLevel),
        [totalStars, starsPerLevel]
    );
}

/**
 * Hook for tracking streak only.
 */
export function useStreak(): {
    current: number;
    longest: number;
    lastActiveDate: string;
    atRisk: boolean;
} {
    const profile = useProfileStore((state) => state.activeProfile);

    return useMemo(() => ({
        current: profile?.currentStreak ?? 0,
        longest: profile?.longestStreak ?? 0,
        lastActiveDate: profile?.lastActiveDate ?? '',
        atRisk: profile ? profile.lastActiveDate !== new Date().toISOString().split('T')[0] : true,
    }), [profile]);
}

/**
 * Hook for badge management.
 */
export function useBadges(badgeDefinitions: BadgeDefinition[] = DEFAULT_BADGES): {
    badges: Badge[];
    checkForNew: () => Badge[];
    totalEarned: number;
    totalPossible: number;
} {
    const activeProfile = useProfileStore((state) => state.activeProfile);
    const earnBadge = useProfileStore((state) => state.earnBadge);

    const badges = activeProfile?.badges ?? [];

    const checkForNew = useCallback(() => {
        if (!activeProfile) return [];
        const newBadges = checkAllBadges(activeProfile, badgeDefinitions);
        for (const badge of newBadges) {
            earnBadge(badge);
        }
        return newBadges;
    }, [activeProfile, badgeDefinitions, earnBadge]);

    return useMemo(() => ({
        badges,
        checkForNew,
        totalEarned: badges.length,
        totalPossible: badgeDefinitions.length,
    }), [badges, checkForNew, badgeDefinitions.length]);
}

export default useGamification;
