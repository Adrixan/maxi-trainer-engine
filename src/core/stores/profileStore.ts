/**
 * User profile store for the Mini Trainer Engine.
 * 
 * Manages the active user profile and provides actions for
 * updating progress, streaks, and achievements.
 * 
 * Persistence logic is handled by profilePersistence module.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adoptLegacyStore, scopedStoreName } from '@core/appId';
import {
    exportSaveGame,
    importSaveGame,
    syncProfileToIndexedDB,
    type SaveGamePayload,
    type ImportResult,
} from './profilePersistence';
import {
    selectActiveProfile,
    selectNickname,
    selectAvatar,
    selectTotalStars,
    selectCurrentStreak,
    selectLongestStreak,
    selectBadges,
    selectThemeProgress,
    selectLevel,
    selectThemeLevels,
    selectThemeLevel,
} from './profileSelectors';
// Re-export constants for backwards compatibility
export { AVATAR_EMOJIS, MAX_NICKNAME_LENGTH } from './profileConstants';
import type {
    UserProfile,
    Badge,
    ObservationAreaId,
    ThemeId,
    ThemeProgress,
} from '@/types';
import { addDays, localDateKey } from '@core/utils/date';

// ============================================================================
// Constants (imported from profileConstants.ts)
// ============================================================================

// Note: AVATAR_EMOJIS and MAX_NICKNAME_LENGTH are now imported from profileConstants.ts

// ============================================================================
// Types
// ============================================================================

/**
 * Profile state interface.
 */
export interface ProfileState {
    /** Currently active user profile */
    activeProfile: UserProfile | null;

    // Actions
    /** Set the active profile */
    setActiveProfile: (profile: UserProfile | null) => void;
    /**
     * Create a new profile with nickname and avatar.
     * `areaIds` are the observation areas of the running app; each starts at level 1.
     */
    createProfile: (nickname: string, avatarId: string, areaIds?: readonly string[]) => UserProfile;
    /** Update the nickname */
    setNickname: (nickname: string) => void;
    /** Update the avatar */
    setAvatar: (avatarId: string) => void;
    /** Update level for an observation area */
    updateLevel: (areaId: ObservationAreaId, level: number) => void;
    /** Add stars to the total */
    addStars: (count: number) => void;
    /** Increment the streak */
    incrementStreak: () => void;
    /** Reset the streak */
    resetStreak: () => void;
    /** Update theme progress */
    updateThemeProgress: (themeId: ThemeId, progress: Partial<ThemeProgress>) => void;
    /** Update theme level (highest completed level for a theme) */
    updateThemeLevel: (themeId: ThemeId, level: number) => void;
    /** Earn a badge */
    earnBadge: (badge: Badge) => void;
    /** Clear the active profile */
    clearProfile: () => void;
    /** Export profile and results as JSON */
    exportSaveGame: () => Promise<SaveGamePayload | null>;
    /** Import profile and results from JSON */
    importSaveGame: (data: SaveGamePayload) => Promise<ImportResult>;
}

// ============================================================================
// Store
// ============================================================================

/** Name of the persisted store (scoped per app, see appId.ts). */
const PROFILE_STORE_BASE = 'maxi-trainer-profile';
adoptLegacyStore(PROFILE_STORE_BASE);

/**
 * Create initial levels: every observation area of the app starts at level 1.
 */
function createInitialLevels(areaIds: readonly string[]): Record<ObservationAreaId, number> {
    return Object.fromEntries(areaIds.map((id) => [id, 1]));
}

/**
 * User profile store.
 * 
 * Persists the active profile to localStorage and syncs to IndexedDB.
 */
export const useProfileStore = create<ProfileState>()(
    persist(
        (set, get) => ({
            activeProfile: null,

            setActiveProfile: (profile) => set({ activeProfile: profile }),

            createProfile: (nickname, avatarId, areaIds = []) => {
                const profile: UserProfile = {
                    id: crypto.randomUUID(),
                    nickname: nickname.trim(),
                    avatarId,
                    createdAt: new Date().toISOString(),
                    currentLevels: createInitialLevels(areaIds),
                    totalStars: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    lastActiveDate: '',
                    themeProgress: {},
                    themeLevels: {},
                    badges: [],
                };
                set({ activeProfile: profile });
                return profile;
            },

            setNickname: (nickname) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            nickname,
                        },
                    };
                }),

            setAvatar: (avatarId) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            avatarId,
                        },
                    };
                }),

            updateLevel: (areaId, level) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    const current = state.activeProfile.currentLevels[areaId] ?? 1;
                    // Only keep highest level (no downgrade)
                    if (level <= current) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            currentLevels: {
                                ...state.activeProfile.currentLevels,
                                [areaId]: level,
                            },
                        },
                    };
                }),

            addStars: (count) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    // Validate count is positive (Issue #7 fix)
                    if (count <= 0) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            totalStars: state.activeProfile.totalStars + count,
                        },
                    };
                }),

            incrementStreak: () =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    const today = localDateKey();
                    const lastActive = state.activeProfile.lastActiveDate;

                    // If already active today, no change
                    if (lastActive === today) return state;

                    // Check if yesterday
                    const yesterdayStr = localDateKey(addDays(new Date(), -1));

                    const newStreak = lastActive === yesterdayStr
                        ? state.activeProfile.currentStreak + 1
                        : 1;

                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            currentStreak: newStreak,
                            longestStreak: Math.max(newStreak, state.activeProfile.longestStreak),
                            lastActiveDate: today,
                        },
                    };
                }),

            resetStreak: () =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            currentStreak: 0,
                        },
                    };
                }),

            updateThemeProgress: (themeId, progress) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    const existing = state.activeProfile.themeProgress[themeId] ?? {
                        unlocked: false,
                        exercisesCompleted: 0,
                        exercisesTotal: 0,
                        starsEarned: 0,
                        maxStars: 0,
                    };
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            themeProgress: {
                                ...state.activeProfile.themeProgress,
                                [themeId]: { ...existing, ...progress },
                            },
                        },
                    };
                }),

            updateThemeLevel: (themeId, level) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    const current = state.activeProfile.themeLevels?.[themeId] ?? 0;
                    // Only keep highest level (no downgrade)
                    if (level <= current) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            themeLevels: {
                                ...state.activeProfile.themeLevels,
                                [themeId]: level,
                            },
                        },
                    };
                }),

            earnBadge: (badge) =>
                set((state) => {
                    if (!state.activeProfile) return state;
                    // No duplicates
                    if (state.activeProfile.badges.some((b) => b.id === badge.id)) return state;
                    return {
                        activeProfile: {
                            ...state.activeProfile,
                            badges: [...state.activeProfile.badges, badge],
                        },
                    };
                }),

            clearProfile: () => set({ activeProfile: null }),

            exportSaveGame: async () => {
                const { activeProfile } = get();
                if (!activeProfile) return null;
                return exportSaveGame(activeProfile);
            },

            importSaveGame: async (data) => {
                return importSaveGame(data, (profile) => set({ activeProfile: profile }));
            },
        }),
        {
            name: scopedStoreName(PROFILE_STORE_BASE),
            version: 1,
            onRehydrateStorage: () => (_state) => {
                // Profile rehydration complete
            },
        },
    ),
);

// ============================================================================
// IndexedDB Sync
// ============================================================================

/**
 * Sync activeProfile to IndexedDB whenever it changes.
 * This ensures data survives localStorage clears as long as IndexedDB exists.
 */
useProfileStore.subscribe((state, prevState) => {
    if (state.activeProfile && state.activeProfile !== prevState.activeProfile) {
        syncProfileToIndexedDB(state.activeProfile).catch(() => {
            // Error already logged in syncProfileToIndexedDB
        });
    }
});

// ============================================================================
// Re-export Selectors
// ============================================================================

// Re-export selectors from profileSelectors for backwards compatibility
export {
    selectActiveProfile,
    selectNickname,
    selectAvatar,
    selectTotalStars,
    selectCurrentStreak,
    selectLongestStreak,
    selectBadges,
    selectThemeProgress,
    selectLevel,
    selectThemeLevels,
    selectThemeLevel,
};
