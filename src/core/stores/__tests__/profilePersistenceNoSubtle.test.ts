/**
 * Save games must round-trip where crypto.subtle is unavailable
 * (file:// on some browsers, plain http, old WebViews), and files written with
 * the native implementation must verify with the fallback and vice versa.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { exportSaveGame, validateAndVerifySaveGame } from '../profilePersistence';
import type { UserProfile } from '@/types';

vi.mock('@core/storage', async () => {
    const actual = await vi.importActual('@core/storage');
    return {
        ...actual,
        getTrainerId: () => 'daz',
        getAllExerciseResults: vi.fn().mockResolvedValue([]),
    };
});

const profile: UserProfile = {
    id: 'p1',
    nickname: 'Größe 🦊',
    avatarId: '🦊',
    createdAt: '2024-01-01T00:00:00.000Z',
    currentLevels: { grammar: 1 },
    totalStars: 3,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDate: '2024-01-02',
    themeProgress: {},
    themeLevels: {},
    badges: [],
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('save game checksum without crypto.subtle', () => {
    it('exports and verifies with the JavaScript fallback', async () => {
        vi.stubGlobal('crypto', undefined);
        const payload = await exportSaveGame(profile);
        expect(payload.checksum).toMatch(/^[0-9a-f]{64}$/);
        expect(await validateAndVerifySaveGame(payload)).toEqual({ valid: true });
    });

    it('produces the same checksum as the native implementation', async () => {
        const native = await exportSaveGame(profile);
        vi.stubGlobal('crypto', undefined);
        const fallback = await exportSaveGame(profile);
        expect(fallback.checksum).toBe(native.checksum);
    });

    it('still rejects an edited file', async () => {
        vi.stubGlobal('crypto', undefined);
        const payload = await exportSaveGame(profile);
        const result = await validateAndVerifySaveGame({ ...payload, profile: { ...profile, totalStars: 99 } });
        expect(result.valid).toBe(false);
        expect(result.error).toContain('checksum mismatch');
    });
});

describe('profile ids without crypto.randomUUID', () => {
    it('still creates profiles', async () => {
        vi.stubGlobal('crypto', undefined);
        const { useProfileStore } = await import('../profileStore');
        const created = useProfileStore.getState().createProfile('Ben', '🐻', []);
        expect(created.id).not.toBe('');
    });
});
