/**
 * Gamification notifications hook for the Mini Trainer Engine.
 * 
 * Manages notification state for gamification events:
 * - Badge earned toasts
 * - Level up celebrations
 * 
 * This hook isolates UI notification logic from the core gamification business logic.
 */

import { useCallback, useState } from 'react';
import type { Badge } from '@/types/profile';

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
 * Hook return type.
 */
export interface UseGamificationNotificationsReturn extends GamificationNotifications {
    /** Set earned badges (for triggering badge notification) */
    setEarnedBadges: (badges: Badge[]) => void;
    /** Set level up (for triggering level up notification) */
    setLevelUpLevel: (level: number | null) => void;
    /** Set current badge index */
    setCurrentBadgeIndex: (index: number) => void;
    /** Dismiss current badge notification */
    dismissBadge: () => void;
    /** Clear level up notification */
    clearLevelUp: () => void;
    /** Check if there's any active notification */
    hasActiveNotification: boolean;
}

/**
 * Hook for managing gamification notification state.
 * 
 * Provides state and actions for displaying badge earned toasts
 * and level up celebrations.
 * 
 * @example
 * ```typescript
 * const {
 *     earnedBadges,
 *     levelUpLevel,
 *     dismissBadge,
 *     clearLevelUp,
 * } = useGamificationNotifications();
 * ```
 */
export function useGamificationNotifications(): UseGamificationNotificationsReturn {
    // Notification state for gamification events
    const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
    const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
    const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

    // Dismiss current badge notification
    const dismissBadge = useCallback(() => {
        const nextIndex = currentBadgeIndex + 1;
        if (nextIndex >= earnedBadges.length) {
            setEarnedBadges([]);
            setCurrentBadgeIndex(0);
        } else {
            setCurrentBadgeIndex(nextIndex);
        }
    }, [currentBadgeIndex, earnedBadges.length]);

    // Clear level up notification
    const clearLevelUp = useCallback(() => {
        setLevelUpLevel(null);
    }, []);

    // Check if there's any active notification
    const hasActiveNotification = earnedBadges.length > 0 || levelUpLevel !== null;

    return {
        // State
        earnedBadges,
        levelUpLevel,
        currentBadgeIndex,
        // Actions
        setEarnedBadges,
        setLevelUpLevel,
        setCurrentBadgeIndex,
        dismissBadge,
        clearLevelUp,
        // Computed
        hasActiveNotification,
    };
}

export default useGamificationNotifications;
