/**
 * Tests for calendar-date helpers and the streak logic built on them.
 * vitest.config.ts runs the suite in Europe/Vienna (UTC+1 / UTC+2).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { addDays, daysBetweenKeys, localDateKey, localDateKeyOf } from '../date';
import { isStreakAtRisk, updateStreak } from '../streakCalculation';
import { useProfileStore } from '@core/stores';

// The profile store mirrors changes to IndexedDB, which jsdom does not provide.
vi.mock('@core/stores/profilePersistence', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@core/stores/profilePersistence')>()),
    syncProfileToIndexedDB: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
    vi.useRealTimers();
    useProfileStore.getState().clearProfile();
});

describe('localDateKey', () => {
    it('uses the local day shortly after midnight (UTC is still the previous day)', () => {
        expect(localDateKey(new Date(2026, 5, 15, 0, 30))).toBe('2026-06-15');
    });

    it('uses the local day shortly before midnight', () => {
        expect(localDateKey(new Date(2026, 0, 31, 23, 59))).toBe('2026-01-31');
    });

    it('pads month and day', () => {
        expect(localDateKey(new Date(2026, 0, 5, 12))).toBe('2026-01-05');
    });
});

describe('localDateKeyOf', () => {
    it('converts an ISO timestamp to the local day', () => {
        // 23:30 UTC on 14 June is 01:30 on 15 June in Vienna (UTC+2)
        expect(localDateKeyOf('2026-06-14T23:30:00.000Z')).toBe('2026-06-15');
    });

    it('returns an empty string for invalid input', () => {
        expect(localDateKeyOf('nonsense')).toBe('');
    });
});

describe('addDays', () => {
    it('moves across month borders without mutating the input', () => {
        const start = new Date(2026, 0, 31, 12);
        expect(localDateKey(addDays(start, 1))).toBe('2026-02-01');
        expect(localDateKey(start)).toBe('2026-01-31');
    });

    it('is not affected by the DST change', () => {
        expect(localDateKey(addDays(new Date(2026, 2, 28, 12), 1))).toBe('2026-03-29');
        expect(localDateKey(addDays(new Date(2026, 2, 29, 12), 1))).toBe('2026-03-30');
    });
});

describe('daysBetweenKeys', () => {
    it('counts calendar days over the spring DST change (23 hour day)', () => {
        expect(daysBetweenKeys('2026-03-28', '2026-03-29')).toBe(1);
        expect(daysBetweenKeys('2026-03-28', '2026-03-30')).toBe(2);
    });

    it('counts calendar days over the autumn DST change (25 hour day)', () => {
        expect(daysBetweenKeys('2026-10-24', '2026-10-26')).toBe(2);
    });

    it('is negative for earlier dates and zero for the same day', () => {
        expect(daysBetweenKeys('2026-06-15', '2026-06-14')).toBe(-1);
        expect(daysBetweenKeys('2026-06-15', '2026-06-15')).toBe(0);
    });
});

describe('streaks around midnight', () => {
    it('continues the streak when the learner practises just after midnight', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 15, 0, 10));
        const result = updateStreak(4, new Date(2026, 5, 14, 23, 30));
        expect(result.currentStreak).toBe(5);
        expect(result.lastActiveDate).toBe('2026-06-15');
    });

    it('keeps the streak across the DST change', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 29, 10, 0));
        expect(updateStreak(2, new Date(2026, 2, 28, 10, 0)).currentStreak).toBe(3);
    });

    it('breaks the streak after a missed day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 15, 9, 0));
        const result = updateStreak(6, new Date(2026, 5, 13, 9, 0));
        expect(result.broken).toBe(true);
        expect(result.currentStreak).toBe(1);
    });

    it('reports a streak as at risk only when today has no activity', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 15, 0, 30));
        expect(isStreakAtRisk('2026-06-15')).toBe(false);
        expect(isStreakAtRisk('2026-06-14')).toBe(true);
    });

    it('profile store increments the streak on the first activity after midnight', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 5, 14, 23, 50));
        const store = useProfileStore.getState();
        store.createProfile('Anna', '🦊');
        store.incrementStreak();
        expect(useProfileStore.getState().activeProfile?.lastActiveDate).toBe('2026-06-14');

        vi.setSystemTime(new Date(2026, 5, 15, 0, 20));
        useProfileStore.getState().incrementStreak();
        const profile = useProfileStore.getState().activeProfile;
        expect(profile?.lastActiveDate).toBe('2026-06-15');
        expect(profile?.currentStreak).toBe(2);
    });
});
