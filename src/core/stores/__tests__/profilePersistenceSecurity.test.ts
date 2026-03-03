/**
 * Tests for security features in profile persistence.
 * 
 * Tests for:
 * - trainerId validation
 * - checksum verification
 * - value range validation
 * - badge validation
 */

import { describe, it, expect, vi } from 'vitest';
import {
    validateSaveGame,
    validateAndVerifySaveGame,
    exportSaveGame,
} from '../profilePersistence';
import type { UserProfile, ExerciseResult } from '@/types';

// Mock the storage module
vi.mock('@core/storage', async () => {
    const actual = await vi.importActual('@core/storage');
    return {
        ...actual,
        getTrainerId: () => 'daz',
        getAllExerciseResults: vi.fn().mockResolvedValue([]),
        saveProfile: vi.fn().mockResolvedValue(undefined),
        clearAllExerciseResults: vi.fn().mockResolvedValue(undefined),
        saveExerciseResult: vi.fn().mockResolvedValue(undefined),
    };
});

// Sample valid profile for testing
function createValidProfile(overrides: Partial<UserProfile> = {}): UserProfile {
    return {
        id: 'test-profile-123',
        nickname: 'TestUser',
        avatarId: '🦊',
        createdAt: '2024-01-01T00:00:00.000Z',
        currentLevels: {
            'woerter-und-saetze': 1,
            'klaenge-und-silben': 1,
            'kommunikation': 1,
            'textkompetenz': 1,
            'sprachbetrachtung': 1,
            'rechtschreibung': 1,
        },
        totalStars: 100,
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: '2024-01-15',
        themeProgress: {},
        themeLevels: {},
        badges: [],
        ...overrides,
    };
}

// Sample valid save game payload with checksum
async function createValidPayload(overrides: Record<string, unknown> = {}): Promise<ReturnType<typeof exportSaveGame>> {
    // Get base profile and results from overrides or use defaults
    const profile = (overrides.profile as UserProfile) ?? createValidProfile();
    const exerciseResults = (overrides.exerciseResults as ExerciseResult[]) ?? [];
    const trainerId = (overrides.trainerId as string) ?? 'daz';

    // Compute the correct checksum for the actual data
    const encoder = new TextEncoder();
    const data = JSON.stringify({ trainerId, profile, exerciseResults });
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payload = {
        version: 3,
        savedAt: new Date().toISOString(),
        trainerId,
        checksum,
        profile,
        exerciseResults,
        ...overrides,
    } as const;

    return payload;
}

describe('validateSaveGame', () => {
    it('should reject non-object data', () => {
        expect(validateSaveGame(null).valid).toBe(false);
        expect(validateSaveGame(undefined).valid).toBe(false);
        expect(validateSaveGame('string').valid).toBe(false);
        expect(validateSaveGame(123).valid).toBe(false);
    });

    it('should reject data with wrong version', async () => {
        const payload = await createValidPayload({ version: 1 });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('version');
    });

    it('should reject data without trainerId', async () => {
        const payload = await createValidPayload({ trainerId: undefined });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('trainerId');
    });

    it('should reject data without checksum', async () => {
        const payload = await createValidPayload({ checksum: undefined });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('checksum');
    });

    it('should reject data without profile', async () => {
        const payload = await createValidPayload({ profile: undefined });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('profile');
    });

    it('should reject profile without id', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), id: undefined as unknown as string },
        });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
    });

    it('should reject profile without nickname', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), nickname: undefined as unknown as string },
        });
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(false);
    });

    it('should accept valid payload', async () => {
        const payload = await createValidPayload();
        const result = validateSaveGame(payload);
        expect(result.valid).toBe(true);
    });
});

describe('Value Range Validation', () => {
    it('should reject profile with invalid totalStars (negative)', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), totalStars: -100 },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('totalStars');
    });

    it('should reject profile with invalid totalStars (too large)', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), totalStars: 2000000 },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('totalStars');
    });

    it('should reject profile with invalid currentStreak (negative)', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), currentStreak: -1 },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('currentStreak');
    });

    it('should reject profile with invalid currentStreak (too large)', async () => {
        const payload = await createValidPayload({
            profile: { ...createValidProfile(), currentStreak: 500 },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('currentStreak');
    });

    it('should reject profile with invalid level (too high)', async () => {
        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                currentLevels: {
                    'woerter-und-saetze': 200,
                } as UserProfile['currentLevels'],
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('currentLevels');
    });

    it('should accept valid profile values', async () => {
        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                totalStars: 5000,
                currentStreak: 30,
                longestStreak: 45,
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(true);
    });
});

describe('Badge Validation', () => {
    it('should reject badge without id', async () => {
        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                badges: [
                    {
                        name: 'Test Badge',
                        description: 'Test',
                        icon: '🏆',
                        earnedAt: '2024-01-01T00:00:00.000Z',
                    },
                ],
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('badge');
    });

    it('should reject badge with invalid earnedAt date', async () => {
        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                badges: [
                    {
                        id: 'test-badge',
                        name: 'Test Badge',
                        description: 'Test',
                        icon: '🏆',
                        earnedAt: 'not-a-date',
                    },
                ],
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
    });

    it('should reject badge with future earnedAt date', async () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                badges: [
                    {
                        id: 'test-badge',
                        name: 'Test Badge',
                        description: 'Test',
                        icon: '🏆',
                        earnedAt: futureDate.toISOString(),
                    },
                ],
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('future');
    });

    it('should accept valid badges', async () => {
        const payload = await createValidPayload({
            profile: {
                ...createValidProfile(),
                badges: [
                    {
                        id: 'first-steps',
                        name: 'First Steps',
                        description: 'Complete your first exercise',
                        icon: '🎯',
                        earnedAt: '2024-01-01T00:00:00.000Z',
                    },
                ],
            },
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(true);
    });
});

describe('Checksum Verification', () => {
    it('should reject payload with invalid checksum', async () => {
        const payload = await createValidPayload({
            checksum: 'invalid-checksum-12345',
        });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('checksum');
    });

    it('should accept payload with valid checksum', async () => {
        // Create a profile and compute correct checksum
        const profile = createValidProfile();

        // The checksum is computed from JSON.stringify({ trainerId, profile, exerciseResults })
        // We need to compute the actual checksum for this to work
        const encoder = new TextEncoder();
        const data = JSON.stringify({ trainerId: 'daz', profile, exerciseResults: [] });
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const payload = await createValidPayload({ checksum });
        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(true);
    });

    it('should detect tampered profile data', async () => {
        // Create a payload, then modify the profile after checksum is computed
        const profile = createValidProfile({ totalStars: 100 });

        // Compute checksum for original
        const encoder = new TextEncoder();
        const data = JSON.stringify({ trainerId: 'daz', profile, exerciseResults: [] });
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const originalChecksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        // Now create payload with tampered stars (higher than original)
        const tamperedProfile = { ...profile, totalStars: 999999 };
        const payload = await createValidPayload({
            profile: tamperedProfile,
            checksum: originalChecksum, // Use original checksum
        });

        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('checksum');
    });
});

describe('Trainer ID Validation', () => {
    it('should reject save from different trainer', async () => {
        const profile = createValidProfile();

        // Compute checksum for mathematik trainer
        const encoder = new TextEncoder();
        const data = JSON.stringify({ trainerId: 'mathematik', profile, exerciseResults: [] });
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const payload = await createValidPayload({
            trainerId: 'mathematik',
            checksum,
        });

        // The validation should reject save from different trainer
        const result = await validateAndVerifySaveGame(payload);

        // Should fail validation because trainer IDs don't match
        expect(result.valid).toBe(false);
        expect(result.error).toContain('different trainer');
    });

    it('should allow save from same trainer', async () => {
        const profile = createValidProfile();

        // Compute checksum for daz trainer (same as current trainer in test)
        const encoder = new TextEncoder();
        const data = JSON.stringify({ trainerId: 'daz', profile, exerciseResults: [] });
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const checksum = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        const payload = await createValidPayload({
            trainerId: 'daz',
            checksum,
        });

        // The validation should pass for same trainer
        const result = await validateAndVerifySaveGame(payload);

        expect(result.valid).toBe(true);
    });
});

describe('Exercise Result Validation', () => {
    it('should reject result with invalid stars (negative)', async () => {
        const payload = await createValidPayload({
            exerciseResults: [
                {
                    id: 'result-1',
                    profileId: 'test-profile',
                    exerciseId: 'exercise-1',
                    areaId: 'woerter-und-saetze',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    stars: -1, // Invalid
                    completedAt: '2024-01-01T00:00:00.000Z',
                },
            ],
        });

        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('stars');
    });

    it('should reject result with invalid stars (too high)', async () => {
        const payload = await createValidPayload({
            exerciseResults: [
                {
                    id: 'result-1',
                    profileId: 'test-profile',
                    exerciseId: 'exercise-1',
                    areaId: 'woerter-und-saetze',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    stars: 5, // Max is 3
                    completedAt: '2024-01-01T00:00:00.000Z',
                },
            ],
        });

        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('stars');
    });

    it('should accept result with valid stars', async () => {
        const payload = await createValidPayload({
            exerciseResults: [
                {
                    id: 'result-1',
                    profileId: 'test-profile',
                    exerciseId: 'exercise-1',
                    areaId: 'woerter-und-saetze',
                    themeId: 'theme-1',
                    level: 1,
                    correct: true,
                    stars: 3,
                    completedAt: '2024-01-01T00:00:00.000Z',
                },
            ],
        });

        const result = await validateAndVerifySaveGame(payload);
        expect(result.valid).toBe(true);
    });
});
