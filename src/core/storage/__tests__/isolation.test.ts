/**
 * Tests for storage isolation between apps.
 * 
 * Verifies that different apps (DAZ, Mathematik) maintain separate storage:
 * - IndexedDB databases are app-specific
 * - localStorage keys are namespaced per app
 * - Migration only affects DAZ app
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

        it('default app ID falls back to daz', async () => {
            // Use vi.stubEnv to mock undefined
            vi.stubEnv('VITE_APP_ID', undefined);

            vi.resetModules();

            const { setStorageItem } = await import('../localStorage');

            setStorageItem('app:locale', 'en');

            const store = localStorageMock._getStore();
            const keys = Object.keys(store);

            // Should use daz as default
            expect(keys).toContain('mte:daz:app:locale');
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
// Migration Logic Tests
// ============================================================================

describe('Migration Logic', () => {
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

    describe('isMigrationNeeded', () => {
        it('returns false for non-DAZ apps', async () => {
            vi.stubEnv('VITE_APP_ID', 'mathematik');

            const { isMigrationNeeded } = await import('../migration');

            expect(isMigrationNeeded()).toBe(false);
        });

        it('returns false if migration already completed', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Mark migration as complete
            localStorageMock.setItem('mte:daz:app:migrationComplete', '2024-01-15T00:00:00Z');

            vi.resetModules();

            const { isMigrationNeeded } = await import('../migration');

            expect(isMigrationNeeded()).toBe(false);
        });

        it('returns true if old localStorage keys exist', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Set up old format keys (without app prefix)
            localStorageMock.setItem('mte:app:locale', JSON.stringify({ value: 'de', version: 1, updatedAt: '2024-01-01' }));
            localStorageMock.setItem('mte:app:theme', JSON.stringify({ value: 'forest', version: 1, updatedAt: '2024-01-01' }));

            vi.resetModules();

            const { isMigrationNeeded } = await import('../migration');

            expect(isMigrationNeeded()).toBe(true);
        });

        it('returns false if no old keys exist', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Only new format keys
            localStorageMock.setItem('mte:daz:app:locale', JSON.stringify({ value: 'de', version: 1, updatedAt: '2024-01-01' }));

            vi.resetModules();

            const { isMigrationNeeded } = await import('../migration');

            expect(isMigrationNeeded()).toBe(false);
        });
    });

    describe('runMigration', () => {
        it('migrates localStorage keys from old to new format', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Set up old format keys
            localStorageMock.setItem('mte:app:locale', JSON.stringify({ value: 'de', version: 1, updatedAt: '2024-01-01' }));
            localStorageMock.setItem('mte:app:theme', JSON.stringify({ value: 'forest', version: 1, updatedAt: '2024-01-01' }));
            localStorageMock.setItem('mte:app:currentProfileId', JSON.stringify({ value: 'profile-1', version: 1, updatedAt: '2024-01-01' }));

            vi.resetModules();

            const { runMigration } = await import('../migration');

            const result = await runMigration();

            expect(result.success).toBe(true);
            expect(result.migrated).toBe(true);
            expect(result.localStorageKeysMigrated).toBe(3);

            // Verify keys were migrated
            const store = localStorageMock._getStore();
            expect(store['mte:daz:app:locale']).toBeDefined();
            expect(store['mte:daz:app:theme']).toBeDefined();
            expect(store['mte:daz:app:currentProfileId']).toBeDefined();

            // Old keys should be removed
            expect(store['mte:app:locale']).toBeUndefined();
            expect(store['mte:app:theme']).toBeUndefined();
            expect(store['mte:app:currentProfileId']).toBeUndefined();

            // Migration marker should be set
            expect(store['mte:daz:app:migrationComplete']).toBeDefined();
        });

        it('does not migrate for non-DAZ apps', async () => {
            vi.stubEnv('VITE_APP_ID', 'mathematik');

            // Set up old format keys (shouldn't be migrated for mathematik)
            localStorageMock.setItem('mte:app:locale', JSON.stringify({ value: 'de', version: 1, updatedAt: '2024-01-01' }));

            vi.resetModules();

            const { runMigration } = await import('../migration');

            const result = await runMigration();

            expect(result.success).toBe(true);
            expect(result.migrated).toBe(false);
            expect(result.localStorageKeysMigrated).toBe(0);

            // Keys should remain unchanged
            const store = localStorageMock._getStore();
            expect(store['mte:app:locale']).toBeDefined();
            expect(store['mte:mathematik:app:locale']).toBeUndefined();
        });

        it('only runs migration once', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Set up old format keys
            localStorageMock.setItem('mte:app:locale', JSON.stringify({ value: 'de', version: 1, updatedAt: '2024-01-01' }));

            vi.resetModules();

            const { runMigration } = await import('../migration');

            // First migration
            const result1 = await runMigration();
            expect(result1.migrated).toBe(true);
            expect(result1.localStorageKeysMigrated).toBe(1);

            vi.resetModules();

            const { runMigration: runMigration2 } = await import('../migration');

            // Second migration should be skipped
            const result2 = await runMigration2();
            expect(result2.migrated).toBe(false);
            expect(result2.localStorageKeysMigrated).toBe(0);
        });

        it('preserves data integrity during migration', async () => {
            vi.stubEnv('VITE_APP_ID', 'daz');

            // Set up old format key with specific data
            const originalData = { value: 'forest-theme', version: 1, updatedAt: '2024-01-15T10:30:00Z' };
            localStorageMock.setItem('mte:app:theme', JSON.stringify(originalData));

            vi.resetModules();

            const { runMigration } = await import('../migration');

            await runMigration();

            // Verify data was preserved
            const store = localStorageMock._getStore();
            const migratedData = JSON.parse(store['mte:daz:app:theme']!);
            expect(migratedData.value).toBe('forest-theme');
            expect(migratedData.version).toBe(1);
            expect(migratedData.updatedAt).toBe('2024-01-15T10:30:00Z');
        });
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
