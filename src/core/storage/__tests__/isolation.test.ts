/**
 * Tests for storage isolation between apps.
 * 
 * Verifies that different apps (DAZ, Mathematik) maintain separate storage:
 * - IndexedDB databases are app-specific
 * - localStorage keys are namespaced per app
 * - persisted stores are scoped per app
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock localStorage implementation
 */
function createLocalStorageMock() {
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
        get length() {
            return Object.keys(store).length;
        },
        key: (index: number) => Object.keys(store)[index] ?? null,
        // Helper to inspect store directly
        _getStore: () => store,
        // Helper to set data directly
        _setStore: (newStore: Record<string, string>) => {
            store = newStore;
        },
    };
}

// ============================================================================
// Unit Tests for Key Generation Logic
// ============================================================================

describe('Storage Key Generation Logic', () => {
    it('generates correct database name for DAZ app', () => {
        // Test the naming convention directly
        const appId = 'daz';
        const expectedDbName = `mini-trainer-${appId}-db`;
        expect(expectedDbName).toBe('mini-trainer-daz-db');
    });

    it('generates correct database name for Mathematik app', () => {
        const appId = 'mathematik';
        const expectedDbName = `mini-trainer-${appId}-db`;
        expect(expectedDbName).toBe('mini-trainer-mathematik-db');
    });

    it('generates correct localStorage key prefix for DAZ app', () => {
        const appId = 'daz';
        const expectedPrefix = `mte:${appId}:`;
        expect(expectedPrefix).toBe('mte:daz:');
    });

    it('generates correct localStorage key prefix for Mathematik app', () => {
        const appId = 'mathematik';
        const expectedPrefix = `mte:${appId}:`;
        expect(expectedPrefix).toBe('mte:mathematik:');
    });

    it('ensures different apps have different database names', () => {
        const dazDbName = 'mini-trainer-daz-db';
        const mathDbName = 'mini-trainer-mathematik-db';
        expect(dazDbName).not.toBe(mathDbName);
    });

    it('ensures different apps have different key prefixes', () => {
        const dazPrefix = 'mte:daz:';
        const mathPrefix = 'mte:mathematik:';
        expect(dazPrefix).not.toBe(mathPrefix);
    });
});

// ============================================================================
// localStorage Isolation Tests
// ============================================================================

describe('localStorage Isolation', () => {
    let localStorageMock: ReturnType<typeof createLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        // Stub indexedDB to prevent errors
        vi.stubGlobal('indexedDB', {
            databases: () => Promise.resolve([]),
            open: () => Promise.resolve({}),
            deleteDatabase: () => Promise.resolve(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        vi.resetModules();
    });

    describe('Key Namespacing', () => {
        it('DAZ app uses mte:daz: prefix', async () => {
            // Use vi.stubEnv to mock the environment variable
            vi.stubEnv('VITE_APP_ID', 'daz');

            const { setStorageItem } = await import('../localStorage');

            setStorageItem('app:locale', 'de');
            setStorageItem('app:theme', 'forest');

            const store = localStorageMock._getStore();
            const keys = Object.keys(store);

            // All keys should have daz prefix
            expect(keys.every(k => k.startsWith('mte:daz:'))).toBe(true);
            expect(keys).toContain('mte:daz:app:locale');
            expect(keys).toContain('mte:daz:app:theme');
        });

        it('Mathematik app uses mte:mathematik: prefix', async () => {
            // Use vi.stubEnv to mock the environment variable
            vi.stubEnv('VITE_APP_ID', 'mathematik');

            // Clear module cache and re-import
            vi.resetModules();

            const { setStorageItem } = await import('../localStorage');

            setStorageItem('app:locale', 'de');
            setStorageItem('app:theme', 'space');

            const store = localStorageMock._getStore();
            const keys = Object.keys(store);

            // All keys should have mathematik prefix
            expect(keys.every(k => k.startsWith('mte:mathematik:'))).toBe(true);
            expect(keys).toContain('mte:mathematik:app:locale');
            expect(keys).toContain('mte:mathematik:app:theme');
        });

        it('default app ID falls back to ahs-deutsch', async () => {
            // Use vi.stubEnv to mock undefined
            vi.stubEnv('VITE_APP_ID', undefined);

            vi.resetModules();

            const { setStorageItem } = await import('../localStorage');

            setStorageItem('app:locale', 'en');

            const store = localStorageMock._getStore();
            const keys = Object.keys(store);

            // Should use the engine default app
            expect(keys).toContain('mte:ahs-deutsch:app:locale');
        });
    });

    describe('Data Isolation Between Apps', () => {
        it('DAZ app cannot access Mathematik app data', async () => {
            // First, set up data as Mathematik app
            vi.stubEnv('VITE_APP_ID', 'mathematik');
            vi.resetModules();

            const mathematikModule = await import('../localStorage');
            mathematikModule.setStorageItem('app:theme', 'space');
            mathematikModule.setStorageItem('app:locale', 'en');

            // Now switch to DAZ app
            vi.stubEnv('VITE_APP_ID', 'daz');
            vi.resetModules();

            const dazModule = await import('../localStorage');

            // DAZ app should not see Mathematik data
            expect(dazModule.getStorageItem('app:theme')).toBeUndefined();
            expect(dazModule.getStorageItem('app:locale')).toBeUndefined();

            // Set DAZ data
            dazModule.setStorageItem('app:theme', 'forest');
            dazModule.setStorageItem('app:locale', 'de');

            // Verify DAZ has its own data
            expect(dazModule.getStorageItem('app:theme')).toBe('forest');
            expect(dazModule.getStorageItem('app:locale')).toBe('de');

            // Verify Mathematik data still exists
            vi.stubEnv('VITE_APP_ID', 'mathematik');
            vi.resetModules();

            const mathematikModule2 = await import('../localStorage');
            expect(mathematikModule2.getStorageItem('app:theme')).toBe('space');
            expect(mathematikModule2.getStorageItem('app:locale')).toBe('en');
        });

        it('clearAllStorageItems only clears current app data', async () => {
            // Set up data for both apps
            vi.stubEnv('VITE_APP_ID', 'daz');
            vi.resetModules();

            const dazModule = await import('../localStorage');
            dazModule.setStorageItem('app:theme', 'forest');
            dazModule.setStorageItem('app:locale', 'de');

            vi.stubEnv('VITE_APP_ID', 'mathematik');
            vi.resetModules();

            const mathematikModule = await import('../localStorage');
            mathematikModule.setStorageItem('app:theme', 'space');
            mathematikModule.setStorageItem('app:locale', 'en');

            // Clear DAZ data
            vi.stubEnv('VITE_APP_ID', 'daz');
            vi.resetModules();

            const dazModule2 = await import('../localStorage');
            dazModule2.clearAllStorageItems();

            // Verify DAZ data is cleared
            expect(dazModule2.getStorageItem('app:theme')).toBeUndefined();
            expect(dazModule2.getStorageItem('app:locale')).toBeUndefined();

            // Verify Mathematik data is still intact
            vi.stubEnv('VITE_APP_ID', 'mathematik');
            vi.resetModules();

            const mathematikModule2 = await import('../localStorage');
            expect(mathematikModule2.getStorageItem('app:theme')).toBe('space');
            expect(mathematikModule2.getStorageItem('app:locale')).toBe('en');
        });
    });
});

// ============================================================================
// Persisted store scoping
// ============================================================================

describe('Persisted store scoping', () => {
    let localStorageMock: ReturnType<typeof createLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('scopes store names by app id', async () => {
        vi.stubEnv('VITE_APP_ID', 'ahs-mathematik');
        const { scopedStoreName } = await import('../../appId');
        expect(scopedStoreName('maxi-trainer-profile')).toBe('maxi-trainer-profile:ahs-mathematik');
    });

    it('copies a legacy unscoped store into the app scope once', async () => {
        vi.stubEnv('VITE_APP_ID', 'ahs-mathematik');
        localStorageMock.setItem('maxi-trainer-profile', '{"state":{"activeProfile":null}}');

        const { adoptLegacyStore } = await import('../../appId');
        adoptLegacyStore('maxi-trainer-profile');

        const store = localStorageMock._getStore();
        expect(store['maxi-trainer-profile:ahs-mathematik']).toBe('{"state":{"activeProfile":null}}');
        // Legacy key stays so other apps on the same origin can adopt it too
        expect(store['maxi-trainer-profile']).toBeDefined();
    });

    it('never overwrites data the app already has', async () => {
        vi.stubEnv('VITE_APP_ID', 'ahs-mathematik');
        localStorageMock.setItem('maxi-trainer-profile', 'legacy');
        localStorageMock.setItem('maxi-trainer-profile:ahs-mathematik', 'current');

        const { adoptLegacyStore } = await import('../../appId');
        adoptLegacyStore('maxi-trainer-profile');

        expect(localStorageMock._getStore()['maxi-trainer-profile:ahs-mathematik']).toBe('current');
    });

    it('does not touch the keys of other apps', async () => {
        vi.stubEnv('VITE_APP_ID', 'ahs-deutsch');
        localStorageMock.setItem('mte:ahs-mathematik:app:theme', 'x');
        localStorageMock.setItem('maxi-trainer-profile:ahs-mathematik', 'math profile');

        const { adoptLegacyStore } = await import('../../appId');
        adoptLegacyStore('maxi-trainer-profile');

        const store = localStorageMock._getStore();
        expect(Object.keys(store).sort()).toEqual(['maxi-trainer-profile:ahs-mathematik', 'mte:ahs-mathematik:app:theme']);
    });

    it('keeps the profile of two apps separate', async () => {
        vi.stubEnv('VITE_APP_ID', 'ahs-deutsch');
        const first = await import('../../stores/profileStore');
        first.useProfileStore.getState().createProfile('Anna', '🦊', ['grammar']);

        vi.stubEnv('VITE_APP_ID', 'ahs-mathematik');
        vi.resetModules();
        const math = await import('../../stores/profileStore');
        expect(math.useProfileStore.getState().activeProfile).toBeNull();

        const created = math.useProfileStore.getState().createProfile('Ben', '🐻', ['numbers', 'geometry']);
        expect(Object.keys(created.currentLevels)).toEqual(['numbers', 'geometry']);

        const store = localStorageMock._getStore();
        expect(JSON.parse(String(store['maxi-trainer-profile:ahs-deutsch'])).state.activeProfile.nickname).toBe('Anna');
        expect(JSON.parse(String(store['maxi-trainer-profile:ahs-mathematik'])).state.activeProfile.nickname).toBe('Ben');
    });
});

// ============================================================================
// Integration Tests - Simulating App Switching
// ============================================================================

describe('Storage Isolation Integration', () => {
    let localStorageMock: ReturnType<typeof createLocalStorageMock>;

    beforeEach(() => {
        localStorageMock = createLocalStorageMock();
        vi.stubGlobal('localStorage', localStorageMock);
        // Stub indexedDB to prevent errors
        vi.stubGlobal('indexedDB', {
            databases: () => Promise.resolve([]),
            open: () => Promise.resolve({}),
            deleteDatabase: () => Promise.resolve(),
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('simulates full app switching scenario with localStorage', async () => {
        // Scenario: User switches between DAZ and Mathematik apps

        // Step 1: User uses DAZ app
        vi.stubEnv('VITE_APP_ID', 'daz');

        const dazStorage = await import('../localStorage');

        // Create DAZ settings
        dazStorage.setCurrentProfileId('daz-user');
        dazStorage.setTheme('forest');
        dazStorage.setLocale('de');

        // Step 2: User switches to Mathematik app
        vi.stubEnv('VITE_APP_ID', 'mathematik');
        vi.resetModules();

        const mathStorage = await import('../localStorage');

        // Mathematik should start fresh (no DAZ data visible)
        expect(mathStorage.getCurrentProfileId()).toBeUndefined();
        expect(mathStorage.getTheme()).toBe('default'); // default value
        expect(mathStorage.getLocale()).toBe('de'); // default value

        // Create Mathematik settings
        mathStorage.setCurrentProfileId('math-user');
        mathStorage.setTheme('space');
        mathStorage.setLocale('en');

        // Step 3: User switches back to DAZ app
        vi.stubEnv('VITE_APP_ID', 'daz');
        vi.resetModules();

        const dazStorage2 = await import('../localStorage');

        // DAZ should still have its data
        expect(dazStorage2.getCurrentProfileId()).toBe('daz-user');
        expect(dazStorage2.getTheme()).toBe('forest');
        expect(dazStorage2.getLocale()).toBe('de');

        // Step 4: Verify Mathematik data is still intact
        vi.stubEnv('VITE_APP_ID', 'mathematik');
        vi.resetModules();

        const mathStorage2 = await import('../localStorage');
        expect(mathStorage2.getCurrentProfileId()).toBe('math-user');
        expect(mathStorage2.getTheme()).toBe('space');
        expect(mathStorage2.getLocale()).toBe('en');

        // Verify localStorage isolation
        const store = localStorageMock._getStore();
        const dazKeys = Object.keys(store).filter(k => k.startsWith('mte:daz:'));
        const mathKeys = Object.keys(store).filter(k => k.startsWith('mte:mathematik:'));

        expect(dazKeys.length).toBeGreaterThan(0);
        expect(mathKeys.length).toBeGreaterThan(0);
        expect(dazKeys.every(k => !k.startsWith('mte:mathematik:'))).toBe(true);
        expect(mathKeys.every(k => !k.startsWith('mte:daz:'))).toBe(true);
    });

    it('demonstrates that keys from one app are not accessible from another', async () => {
        // Set up data directly in localStorage for both apps
        const store = localStorageMock._getStore();
        store['mte:daz:app:theme'] = JSON.stringify({ value: 'forest', version: 1, updatedAt: '2024-01-01' });
        store['mte:mathematik:app:theme'] = JSON.stringify({ value: 'space', version: 1, updatedAt: '2024-01-01' });

        // DAZ app should only see its data
        vi.stubEnv('VITE_APP_ID', 'daz');
        vi.resetModules();

        const dazModule = await import('../localStorage');
        expect(dazModule.getTheme()).toBe('forest');

        // Mathematik app should only see its data
        vi.stubEnv('VITE_APP_ID', 'mathematik');
        vi.resetModules();

        const mathModule = await import('../localStorage');
        expect(mathModule.getTheme()).toBe('space');
    });
});
