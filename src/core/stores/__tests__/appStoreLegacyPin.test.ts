/**
 * Migration of teacher PINs that older versions stored in plain text.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AppState } from '../appStore';

beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('legacy teacher PIN migration', () => {
    it('hashes a PIN stored by the old PIN page and removes the plain text entry', async () => {
        vi.stubEnv('VITE_APP_ID', 'daz');
        localStorage.setItem('mte:daz:app:teacherPin', JSON.stringify({ value: '4321', version: 1, updatedAt: '2025-01-01' }));
        localStorage.setItem('mte:daz:app:teacherPinEnabled', JSON.stringify({ value: true, version: 1, updatedAt: '2025-01-01' }));

        const { useAppStore } = await import('../appStore');

        expect(localStorage.getItem('mte:daz:app:teacherPin')).toBeNull();
        expect(localStorage.getItem('mte:daz:app:teacherPinEnabled')).toBeNull();
        expect(useAppStore.getState().teacherAuth.pinHash).toMatch(/^[0-9a-f]{64}$/);
        expect(useAppStore.getState().verifyPin('4321')).toEqual({ status: 'ok' });
        expect(JSON.stringify(localStorage)).not.toContain('4321');
    });

    it('ignores corrupt legacy values', async () => {
        vi.stubEnv('VITE_APP_ID', 'daz');
        localStorage.setItem('mte:daz:app:teacherPin', 'not json');

        const { useAppStore } = await import('../appStore');

        expect(useAppStore.getState().teacherAuth.pinHash).toBe('');
        expect(localStorage.getItem('mte:daz:app:teacherPin')).toBeNull();
    });

    it('does not touch the PIN of another app', async () => {
        vi.stubEnv('VITE_APP_ID', 'daz');
        localStorage.setItem('mte:mathematik:app:teacherPin', JSON.stringify({ value: '1111', version: 1, updatedAt: '' }));

        await import('../appStore');

        expect(localStorage.getItem('mte:mathematik:app:teacherPin')).not.toBeNull();
    });

    it('converts a plain PIN inside persisted settings and drops the old fields', async () => {
        const { useAppStore } = await import('../appStore');
        const merge = useAppStore.persist.getOptions().merge;
        const merged = merge?.(
            { settings: { locale: 'en', teacherPin: '2468', teacherPinEnabled: true } },
            useAppStore.getState(),
        ) as AppState;

        expect(merged.settings.locale).toBe('en');
        expect(merged.settings).not.toHaveProperty('teacherPin');
        expect(merged.settings).not.toHaveProperty('teacherPinEnabled');
        expect(merged.teacherAuth.pinHash).toMatch(/^[0-9a-f]{64}$/);
        expect(merged.teacherAuthenticated).toBe(false);
        expect(JSON.stringify(merged)).not.toContain('2468');
    });
});
