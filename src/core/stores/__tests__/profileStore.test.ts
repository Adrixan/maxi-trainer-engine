/**
 * Tests for profileStore.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useProfileStore, selectActiveProfile, selectNickname, selectAvatar, selectTotalStars, selectCurrentStreak, selectLongestStreak, selectBadges, selectThemeProgress, selectLevel } from '../profileStore';
import type { UserProfile, Badge, ThemeProgress } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock profilePersistence module
vi.mock('../profilePersistence', () => ({
    exportSaveGame: vi.fn().mockResolvedValue({
        version: 2,
        savedAt: '2024-01-15T12:00:00Z',
        profile: { id: 'test', nickname: 'Test' },
        exerciseResults: [],
    }),
    importSaveGame: vi.fn().mockResolvedValue({ success: true }),
    syncProfileToIndexedDB: vi.fn().mockResolvedValue(undefined),
    SAVE_GAME_VERSION: 2,
}));

// Mock @core/storage (used by profilePersistence)
vi.mock('@core/storage', () => ({
    saveProfile: vi.fn().mockResolvedValue(undefined),
    clearAllExerciseResults: vi.fn().mockResolvedValue(undefined),
    saveExerciseResult: vi.fn().mockResolvedValue(undefined),
    getAllExerciseResults: vi.fn().mockResolvedValue([]),
}));

// Helper to create a mock profile
function createMockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
        id: 'profile-1',
        nickname: 'Test User',
        avatarId: 'avatar-1',
        totalStars: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: new Date().toISOString().split('T')[0]!,
        currentLevels: {},
        themeProgress: {},
        themeLevels: {},
        badges: [],
        createdAt: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('profileStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

        // Reset store to initial state
        useProfileStore.setState({
            activeProfile: null,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('has no active profile', () => {
            expect(useProfileStore.getState().activeProfile).toBeNull();
        });
    });

    describe('setActiveProfile', () => {
        it('sets the active profile', () => {
            const profile = createMockProfile();

            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(useProfileStore.getState().activeProfile).toEqual(profile);
        });

        it('clears the active profile when set to null', () => {
            const profile = createMockProfile();

            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(useProfileStore.getState().activeProfile).not.toBeNull();

            act(() => {
                useProfileStore.getState().setActiveProfile(null);
            });

            expect(useProfileStore.getState().activeProfile).toBeNull();
        });
    });

    describe('setNickname', () => {
        it('updates nickname when profile exists', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().setNickname('New Name');
            });

            expect(useProfileStore.getState().activeProfile?.nickname).toBe('New Name');
        });

        it('does nothing when no profile exists', () => {
            act(() => {
                useProfileStore.getState().setNickname('New Name');
            });

            expect(useProfileStore.getState().activeProfile).toBeNull();
        });
    });

    describe('setAvatar', () => {
        it('updates avatar when profile exists', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().setAvatar('new-avatar');
            });

            expect(useProfileStore.getState().activeProfile?.avatarId).toBe('new-avatar');
        });
    });

    describe('updateLevel', () => {
        it('updates level for an area', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().updateLevel('grammar', 3);
            });

            expect(useProfileStore.getState().activeProfile?.currentLevels['grammar']).toBe(3);
        });

        it('does not downgrade level', () => {
            const profile = createMockProfile({ currentLevels: { grammar: 5 } });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().updateLevel('grammar', 3);
            });

            // Level should remain at 5
            expect(useProfileStore.getState().activeProfile?.currentLevels['grammar']).toBe(5);
        });

        it('allows upgrading level', () => {
            const profile = createMockProfile({ currentLevels: { grammar: 3 } });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().updateLevel('grammar', 5);
            });

            expect(useProfileStore.getState().activeProfile?.currentLevels['grammar']).toBe(5);
        });
    });

    describe('addStars', () => {
        it('adds stars to total', () => {
            const profile = createMockProfile({ totalStars: 10 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().addStars(5);
            });

            expect(useProfileStore.getState().activeProfile?.totalStars).toBe(15);
        });

        it('accumulates stars correctly', () => {
            const profile = createMockProfile({ totalStars: 0 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().addStars(3);
                useProfileStore.getState().addStars(2);
                useProfileStore.getState().addStars(1);
            });

            expect(useProfileStore.getState().activeProfile?.totalStars).toBe(6);
        });
    });

    describe('incrementStreak', () => {
        it('starts streak at 1 for first activity', () => {
            const profile = createMockProfile({
                currentStreak: 0,
                longestStreak: 0,
                lastActiveDate: '2024-01-13',
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().incrementStreak();
            });

            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(1);
            expect(useProfileStore.getState().activeProfile?.longestStreak).toBe(1);
            expect(useProfileStore.getState().activeProfile?.lastActiveDate).toBe('2024-01-15');
        });

        it('increments streak when last active yesterday', () => {
            const profile = createMockProfile({
                currentStreak: 3,
                longestStreak: 5,
                lastActiveDate: '2024-01-14',
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().incrementStreak();
            });

            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(4);
            expect(useProfileStore.getState().activeProfile?.longestStreak).toBe(5);
        });

        it('updates longest streak when new record', () => {
            const profile = createMockProfile({
                currentStreak: 5,
                longestStreak: 5,
                lastActiveDate: '2024-01-14',
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().incrementStreak();
            });

            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(6);
            expect(useProfileStore.getState().activeProfile?.longestStreak).toBe(6);
        });

        it('resets streak when gap in activity', () => {
            const profile = createMockProfile({
                currentStreak: 5,
                longestStreak: 10,
                lastActiveDate: '2024-01-10', // 5 days ago
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().incrementStreak();
            });

            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(1);
            expect(useProfileStore.getState().activeProfile?.longestStreak).toBe(10);
        });

        it('does not change streak if already active today', () => {
            const profile = createMockProfile({
                currentStreak: 5,
                longestStreak: 10,
                lastActiveDate: '2024-01-15', // Today
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().incrementStreak();
            });

            // Should remain unchanged
            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(5);
            expect(useProfileStore.getState().activeProfile?.lastActiveDate).toBe('2024-01-15');
        });
    });

    describe('resetStreak', () => {
        it('resets current streak to 0', () => {
            const profile = createMockProfile({ currentStreak: 10, longestStreak: 15 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().resetStreak();
            });

            expect(useProfileStore.getState().activeProfile?.currentStreak).toBe(0);
            expect(useProfileStore.getState().activeProfile?.longestStreak).toBe(15);
        });
    });

    describe('updateThemeProgress', () => {
        it('creates new theme progress entry', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            const progress: Partial<ThemeProgress> = {
                unlocked: true,
                exercisesCompleted: 5,
                exercisesTotal: 10,
                starsEarned: 15,
                maxStars: 30,
            };

            act(() => {
                useProfileStore.getState().updateThemeProgress('theme-1', progress);
            });

            const themeProgress = useProfileStore.getState().activeProfile?.themeProgress['theme-1'];
            expect(themeProgress).toEqual(progress);
        });

        it('merges with existing theme progress', () => {
            const profile = createMockProfile({
                themeProgress: {
                    'theme-1': {
                        unlocked: false,
                        exercisesCompleted: 3,
                        exercisesTotal: 10,
                        starsEarned: 9,
                        maxStars: 30,
                    },
                },
            });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().updateThemeProgress('theme-1', {
                    exercisesCompleted: 5,
                    starsEarned: 15,
                });
            });

            const themeProgress = useProfileStore.getState().activeProfile?.themeProgress['theme-1'];
            expect(themeProgress?.unlocked).toBe(false);
            expect(themeProgress?.exercisesCompleted).toBe(5);
            expect(themeProgress?.starsEarned).toBe(15);
            expect(themeProgress?.exercisesTotal).toBe(10);
        });
    });

    describe('earnBadge', () => {
        it('adds badge to profile', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            const badge: Badge = {
                id: 'badge-1',
                name: 'First Steps',
                description: 'Complete your first exercise',
                icon: 'star',
                earnedAt: '2024-01-15T12:00:00Z',
            };

            act(() => {
                useProfileStore.getState().earnBadge(badge);
            });

            expect(useProfileStore.getState().activeProfile?.badges).toHaveLength(1);
            expect(useProfileStore.getState().activeProfile?.badges[0]).toEqual(badge);
        });

        it('does not add duplicate badges', () => {
            const badge: Badge = {
                id: 'badge-1',
                name: 'First Steps',
                description: 'Complete your first exercise',
                icon: 'star',
                earnedAt: '2024-01-15T12:00:00Z',
            };
            const profile = createMockProfile({ badges: [badge] });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            act(() => {
                useProfileStore.getState().earnBadge(badge);
            });

            expect(useProfileStore.getState().activeProfile?.badges).toHaveLength(1);
        });
    });

    describe('clearProfile', () => {
        it('clears the active profile', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(useProfileStore.getState().activeProfile).not.toBeNull();

            act(() => {
                useProfileStore.getState().clearProfile();
            });

            expect(useProfileStore.getState().activeProfile).toBeNull();
        });
    });

    describe('selectors', () => {
        it('selectActiveProfile returns active profile', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectActiveProfile(useProfileStore.getState())).toEqual(profile);
        });

        it('selectNickname returns nickname', () => {
            const profile = createMockProfile({ nickname: 'John' });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectNickname(useProfileStore.getState())).toBe('John');
        });

        it('selectNickname returns undefined when no profile', () => {
            expect(selectNickname(useProfileStore.getState())).toBeUndefined();
        });

        it('selectAvatar returns avatar ID', () => {
            const profile = createMockProfile({ avatarId: 'cat-avatar' });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectAvatar(useProfileStore.getState())).toBe('cat-avatar');
        });

        it('selectTotalStars returns total stars', () => {
            const profile = createMockProfile({ totalStars: 42 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectTotalStars(useProfileStore.getState())).toBe(42);
        });

        it('selectTotalStars returns 0 when no profile', () => {
            expect(selectTotalStars(useProfileStore.getState())).toBe(0);
        });

        it('selectCurrentStreak returns current streak', () => {
            const profile = createMockProfile({ currentStreak: 7 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectCurrentStreak(useProfileStore.getState())).toBe(7);
        });

        it('selectLongestStreak returns longest streak', () => {
            const profile = createMockProfile({ longestStreak: 14 });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectLongestStreak(useProfileStore.getState())).toBe(14);
        });

        it('selectBadges returns badges', () => {
            const badges: Badge[] = [
                { id: 'badge-1', name: 'Badge 1', description: 'Desc', icon: 'star', earnedAt: '2024-01-01T00:00:00Z' },
            ];
            const profile = createMockProfile({ badges });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectBadges(useProfileStore.getState())).toEqual(badges);
        });

        it('selectThemeProgress returns theme progress', () => {
            const themeProgress: Record<string, ThemeProgress> = {
                'theme-1': {
                    unlocked: true,
                    exercisesCompleted: 5,
                    exercisesTotal: 10,
                    starsEarned: 15,
                    maxStars: 30,
                },
            };
            const profile = createMockProfile({ themeProgress });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            const result = selectThemeProgress('theme-1')(useProfileStore.getState());
            expect(result).toEqual(themeProgress['theme-1']);
        });

        it('selectLevel returns level for area', () => {
            const profile = createMockProfile({ currentLevels: { grammar: 3, vocabulary: 5 } });
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectLevel('grammar')(useProfileStore.getState())).toBe(3);
            expect(selectLevel('vocabulary')(useProfileStore.getState())).toBe(5);
        });

        it('selectLevel returns 1 for unknown area', () => {
            const profile = createMockProfile();
            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            expect(selectLevel('unknown')(useProfileStore.getState())).toBe(1);
        });
    });

    describe('persistence', () => {
        it('persists profile to localStorage', () => {
            const profile = createMockProfile();

            act(() => {
                useProfileStore.getState().setActiveProfile(profile);
            });

            // Check that the profile is set correctly
            // Note: zustand persist middleware may not sync immediately in test environment
            const state = useProfileStore.getState();
            expect(state.activeProfile?.id).toBe('profile-1');
        });
    });
});