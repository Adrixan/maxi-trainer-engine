/**
 * Tests for useGamification hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGamification, useLevelProgress, useStreak, useBadges } from '../useGamification';
import { useProfileStore } from '@core/stores/profileStore';
import type { UserProfile, Badge } from '@/types/profile';
import type { ExerciseResult } from '@/types/exercise';

// Helper to create mock profile
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

// Mock store state - defined at module level for access in mock
const mockStoreState: {
    activeProfile: UserProfile | null;
    addStars: ReturnType<typeof vi.fn>;
    incrementStreak: ReturnType<typeof vi.fn>;
    earnBadge: ReturnType<typeof vi.fn>;
} = {
    activeProfile: null,
    addStars: vi.fn(),
    incrementStreak: vi.fn(),
    earnBadge: vi.fn(),
};

// Mock the profile store
vi.mock('@core/stores/profileStore', () => ({
    useProfileStore: Object.assign(
        vi.fn((selector: (state: typeof mockStoreState) => unknown) => {
            if (typeof selector === 'function') {
                return selector(mockStoreState);
            }
            return mockStoreState;
        }),
        {
            getState: () => mockStoreState,
        }
    ),
}));

// Mock the gamification utils
vi.mock('@core/utils/gamification', () => ({
    calculateStars: (attempts: number) => {
        if (attempts === 1) return 3;
        if (attempts === 2) return 2;
        if (attempts === 3) return 1;
        return 0;
    },
    calculateLevel: (stars: number, starsPerLevel: number = 10) => {
        return Math.floor(stars / starsPerLevel) + 1;
    },
    getLevelProgress: (stars: number, starsPerLevel: number, _currentLevel?: number) => {
        const currentLevel = Math.floor(stars / starsPerLevel) + 1;
        const currentStars = stars % starsPerLevel;
        const progressPercentage = (currentStars / starsPerLevel) * 100;
        return {
            currentLevel,
            currentStars,
            starsToNextLevel: starsPerLevel - currentStars,
            progressPercentage,
            justLeveledUp: false,
        };
    },
    updateStreak: (currentStreak: number, _lastActiveDate: Date) => ({
        currentStreak: currentStreak + 1,
        longestStreak: currentStreak + 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
    }),
}));

// Mock the badges utils
vi.mock('@core/utils/badges', () => ({
    checkAllBadges: vi.fn(() => []),
    DEFAULT_BADGES: [],
}));

// Mock storage module
const mockExerciseResults: ExerciseResult[] = [];
vi.mock('@core/storage', () => ({
    getExerciseResultsByArea: vi.fn(async (areaId: string) => {
        return mockExerciseResults.filter(result => result.areaId === areaId);
    }),
}));

describe('useGamification', () => {
    beforeEach(() => {
        mockStoreState.activeProfile = createMockProfile();
        mockStoreState.addStars = vi.fn();
        mockStoreState.incrementStreak = vi.fn();
        mockStoreState.earnBadge = vi.fn();

        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('returns zero values when no active profile', () => {
            mockStoreState.activeProfile = null;

            const { result } = renderHook(() => useGamification());

            expect(result.current.totalStars).toBe(0);
            expect(result.current.currentLevel).toBe(1);
            expect(result.current.currentStreak).toBe(0);
            expect(result.current.longestStreak).toBe(0);
            expect(result.current.badges).toEqual([]);
        });

        it('returns profile values when active profile exists', () => {
            mockStoreState.activeProfile = createMockProfile({
                totalStars: 25,
                currentStreak: 5,
                longestStreak: 10,
                badges: [{ id: 'badge-1', name: 'Test Badge', description: 'A test badge', icon: '🏆', earnedAt: '2024-01-01T00:00:00Z' }],
            });

            const { result } = renderHook(() => useGamification());

            expect(result.current.totalStars).toBe(25);
            expect(result.current.currentStreak).toBe(5);
            expect(result.current.longestStreak).toBe(10);
            expect(result.current.badges).toHaveLength(1);
        });
    });

    describe('level progress', () => {
        it('calculates current level based on stars', () => {
            mockStoreState.activeProfile = createMockProfile({ totalStars: 25 });

            const { result } = renderHook(() => useGamification({ starsPerLevel: 10 }));

            expect(result.current.currentLevel).toBe(3);
        });

        it('calculates level progress correctly', () => {
            mockStoreState.activeProfile = createMockProfile({ totalStars: 15 });

            const { result } = renderHook(() => useGamification({ starsPerLevel: 10 }));

            expect(result.current.levelProgress.currentLevel).toBe(2);
            expect(result.current.levelProgress.currentStars).toBe(5);
            expect(result.current.levelProgress.starsToNextLevel).toBe(5);
            expect(result.current.levelProgress.progressPercentage).toBe(50);
        });
    });

    describe('processExerciseCompletion', () => {
        it('returns default values when no active profile', () => {
            mockStoreState.activeProfile = null;

            const { result } = renderHook(() => useGamification());

            let completionResult: ReturnType<typeof result.current.processExerciseCompletion> | undefined;
            act(() => {
                completionResult = result.current.processExerciseCompletion(1);
            });

            // Issue #10: Return 0 stars when no profile (not 1)
            expect(completionResult?.starsEarned).toBe(0);
            expect(completionResult?.leveledUp).toBe(false);
            expect(completionResult?.newBadges).toEqual([]);
        });

        it('calculates stars based on attempts', () => {
            const { result } = renderHook(() => useGamification());

            let completionResult: ReturnType<typeof result.current.processExerciseCompletion> | undefined;

            act(() => {
                completionResult = result.current.processExerciseCompletion(1);
            });
            expect(completionResult?.starsEarned).toBe(3);

            act(() => {
                completionResult = result.current.processExerciseCompletion(2);
            });
            expect(completionResult?.starsEarned).toBe(2);

            act(() => {
                completionResult = result.current.processExerciseCompletion(3);
            });
            expect(completionResult?.starsEarned).toBe(1);
        });

        it('calls addStars with correct amount', () => {
            const { result } = renderHook(() => useGamification());

            act(() => {
                result.current.processExerciseCompletion(1);
            });

            expect(mockStoreState.addStars).toHaveBeenCalledWith(3);
        });

        it('detects level up correctly', () => {
            mockStoreState.activeProfile = createMockProfile({ totalStars: 8 });

            const { result } = renderHook(() => useGamification({ starsPerLevel: 10 }));

            let completionResult: ReturnType<typeof result.current.processExerciseCompletion> | undefined;
            act(() => {
                completionResult = result.current.processExerciseCompletion(1);
            });

            expect(completionResult?.leveledUp).toBe(true);
            expect(completionResult?.newLevel).toBe(2);
        });

        it('does not level up when threshold not reached', () => {
            mockStoreState.activeProfile = createMockProfile({ totalStars: 5 });

            const { result } = renderHook(() => useGamification({ starsPerLevel: 10 }));

            let completionResult: ReturnType<typeof result.current.processExerciseCompletion> | undefined;
            act(() => {
                completionResult = result.current.processExerciseCompletion(1);
            });

            expect(completionResult?.leveledUp).toBe(false);
            expect(completionResult?.newLevel).toBeUndefined();
        });

        it('calls incrementStreak on completion', () => {
            const { result } = renderHook(() => useGamification());

            act(() => {
                result.current.processExerciseCompletion(1);
            });

            expect(mockStoreState.incrementStreak).toHaveBeenCalled();
        });
    });

    describe('checkForBadges', () => {
        it('returns empty array when no active profile', () => {
            mockStoreState.activeProfile = null;

            const { result } = renderHook(() => useGamification());

            let badges: Badge[] = [];
            act(() => {
                badges = result.current.checkForBadges();
            });

            expect(badges).toEqual([]);
        });
    });

    describe('getAreaStars', () => {
        it('returns 0 when no active profile', async () => {
            mockStoreState.activeProfile = null;

            const { result } = renderHook(() => useGamification());

            await expect(result.current.getAreaStars('area-1')).resolves.toBe(0);
        });

        it('returns sum of scores from exercise results filtered by area', async () => {
            mockStoreState.activeProfile = createMockProfile();

            // Setup mock exercise results
            mockExerciseResults.length = 0;
            mockExerciseResults.push(
                {
                    id: 'result-1',
                    childProfileId: 'profile-1',
                    exerciseId: 'ex-1',
                    areaId: 'area-1',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    score: 3,
                    attempts: 1,
                    timeSpentSeconds: 30,
                    completedAt: '2024-01-15T10:00:00Z',
                },
                {
                    id: 'result-2',
                    childProfileId: 'profile-1',
                    exerciseId: 'ex-2',
                    areaId: 'area-1',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    score: 2,
                    attempts: 2,
                    timeSpentSeconds: 45,
                    completedAt: '2024-01-15T10:05:00Z',
                },
                {
                    id: 'result-3',
                    childProfileId: 'profile-1',
                    exerciseId: 'ex-3',
                    areaId: 'area-2', // Different area
                    themeId: 'theme-2',
                    level: 1,
                    correct: true,
                    score: 3,
                    attempts: 1,
                    timeSpentSeconds: 20,
                    completedAt: '2024-01-15T10:10:00Z',
                },
                {
                    id: 'result-4',
                    childProfileId: 'profile-1',
                    exerciseId: 'ex-4',
                    areaId: 'area-1',
                    themeId: 'theme-1',
                    level: 1,
                    correct: false, // Incorrect - should not count
                    score: 0,
                    attempts: 3,
                    timeSpentSeconds: 60,
                    completedAt: '2024-01-15T10:15:00Z',
                },
                {
                    id: 'result-5',
                    childProfileId: 'other-profile', // Different profile
                    exerciseId: 'ex-5',
                    areaId: 'area-1',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    score: 3,
                    attempts: 1,
                    timeSpentSeconds: 25,
                    completedAt: '2024-01-15T10:20:00Z',
                }
            );

            const { result } = renderHook(() => useGamification());

            // area-1 should have 3 + 2 = 5 stars (only correct results for profile-1)
            await expect(result.current.getAreaStars('area-1')).resolves.toBe(5);
            // area-2 should have 3 stars
            await expect(result.current.getAreaStars('area-2')).resolves.toBe(3);
            // area-3 should have 0 stars (no results)
            await expect(result.current.getAreaStars('area-3')).resolves.toBe(0);
        });

        it('returns 0 when no results exist for area', async () => {
            mockStoreState.activeProfile = createMockProfile();
            mockExerciseResults.length = 0;

            const { result } = renderHook(() => useGamification());

            await expect(result.current.getAreaStars('nonexistent-area')).resolves.toBe(0);
        });
    });

    describe('getAreaLevel', () => {
        it('returns 1 when no active profile', () => {
            mockStoreState.activeProfile = null;

            const { result } = renderHook(() => useGamification());

            expect(result.current.getAreaLevel('area-1')).toBe(1);
        });

        it('returns level from currentLevels', () => {
            mockStoreState.activeProfile = createMockProfile({
                currentLevels: { 'area-1': 3, 'area-2': 5 },
            });

            const { result } = renderHook(() => useGamification());

            expect(result.current.getAreaLevel('area-1')).toBe(3);
            expect(result.current.getAreaLevel('area-2')).toBe(5);
        });
    });
});

describe('useLevelProgress', () => {
    beforeEach(() => {
        const mockProfile = createMockProfile({ totalStars: 15 });
        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: mockProfile });
                }
                return { activeProfile: mockProfile };
            }
        );
    });

    it('returns level progress based on total stars', () => {
        const { result } = renderHook(() => useLevelProgress(10));

        expect(result.current.currentLevel).toBe(2);
        expect(result.current.currentStars).toBe(5);
        expect(result.current.progressPercentage).toBe(50);
    });
});

describe('useStreak', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns streak info from profile', () => {
        const mockProfile = createMockProfile({
            currentStreak: 7,
            longestStreak: 14,
            lastActiveDate: '2024-01-15',
        });

        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: mockProfile });
                }
                return { activeProfile: mockProfile };
            }
        );

        const { result } = renderHook(() => useStreak());

        expect(result.current.current).toBe(7);
        expect(result.current.longest).toBe(14);
        expect(result.current.lastActiveDate).toBe('2024-01-15');
        expect(result.current.atRisk).toBe(false);
    });

    it('detects at-risk streak when not active today', () => {
        const mockProfile = createMockProfile({
            currentStreak: 5,
            longestStreak: 10,
            lastActiveDate: '2024-01-14',
        });

        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: mockProfile });
                }
                return { activeProfile: mockProfile };
            }
        );

        const { result } = renderHook(() => useStreak());

        expect(result.current.atRisk).toBe(true);
    });

    it('returns default values when no profile', () => {
        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: null });
                }
                return { activeProfile: null };
            }
        );

        const { result } = renderHook(() => useStreak());

        expect(result.current.current).toBe(0);
        expect(result.current.longest).toBe(0);
        expect(result.current.atRisk).toBe(true);
    });
});

describe('useBadges', () => {
    it('returns badges from profile', () => {
        const mockBadges: Badge[] = [
            { id: 'badge-1', name: 'First Badge', description: 'First badge earned', icon: '🏆', earnedAt: '2024-01-01T00:00:00Z' },
            { id: 'badge-2', name: 'Second Badge', description: 'Second badge earned', icon: '⭐', earnedAt: '2024-01-02T00:00:00Z' },
        ];
        const mockProfile = createMockProfile({ badges: mockBadges });

        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null; earnBadge: ReturnType<typeof vi.fn> }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: mockProfile, earnBadge: vi.fn() });
                }
                return { activeProfile: mockProfile, earnBadge: vi.fn() };
            }
        );

        const { result } = renderHook(() => useBadges());

        expect(result.current.badges).toEqual(mockBadges);
        expect(result.current.totalEarned).toBe(2);
    });

    it('returns empty badges when no profile', () => {
        (useProfileStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
            (selector: (state: { activeProfile: UserProfile | null; earnBadge: ReturnType<typeof vi.fn> }) => unknown) => {
                if (typeof selector === 'function') {
                    return selector({ activeProfile: null, earnBadge: vi.fn() });
                }
                return { activeProfile: null, earnBadge: vi.fn() };
            }
        );

        const { result } = renderHook(() => useBadges());

        expect(result.current.badges).toEqual([]);
        expect(result.current.totalEarned).toBe(0);
    });
});