/**
 * Migration utilities for the Mini Trainer Engine.
 * 
 * Handles migration of data from single-app architecture to multi-app architecture.
 * Ensures backward compatibility for existing DAZ users.
 */

import { openDB } from 'idb';

// ============================================================================
// Migration Types
// ============================================================================

/**
 * Migration result status.
 */
export interface MigrationResult {
    /** Whether the migration was successful */
    success: boolean;
    /** Whether migration was needed */
    migrated: boolean;
    /** Error message if migration failed */
    error?: string;
    /** Number of localStorage keys migrated */
    localStorageKeysMigrated: number;
    /** Whether IndexedDB was migrated */
    indexedDBMigrated: boolean;
}

// ============================================================================
// Migration Functions
// ============================================================================

/**
 * Default app ID used when VITE_APP_ID is not set.
 */
const DEFAULT_APP_ID = 'daz';

/**
 * Get the current app ID from the build-time environment variable.
 */
function getAppId(): string {
    return import.meta.env.VITE_APP_ID || DEFAULT_APP_ID;
}

/**
 * Check if migration is needed for the current app.
 * Only DAZ app needs migration from the old single-app format.
 * 
 * @returns Whether migration is needed
 */
export function isMigrationNeeded(): boolean {
    const appId = getAppId();

    // Only DAZ app needs migration
    if (appId !== 'daz') {
        return false;
    }

    // Check if migration has already been done
    const migrationKey = `mte:daz:app:migrationComplete`;
    if (localStorage.getItem(migrationKey)) {
        return false;
    }

    // Check if there are old keys to migrate
    const oldPrefix = 'mte:';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(oldPrefix) && !key.startsWith('mte:daz:')) {
            return true;
        }
    }

    return false;
}

/**
 * Migrate localStorage keys from old format to new app-scoped format.
 * 
 * Old format: mte:{key}
 * New format: mte:{appId}:{key}
 * 
 * @returns Number of keys migrated
 */
function migrateLocalStorage(): number {
    const appId = getAppId();
    const oldPrefix = 'mte:';
    const newPrefix = `mte:${appId}:`;
    const keysMigrated: string[] = [];

    // Collect keys to migrate
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(oldPrefix) && !key.startsWith(newPrefix)) {
            keysToMigrate.push(key);
        }
    }

    // Migrate each key
    for (const oldKey of keysToMigrate) {
        const value = localStorage.getItem(oldKey);
        if (value !== null) {
            const keySuffix = oldKey.slice(oldPrefix.length);
            const newKey = `${newPrefix}${keySuffix}`;
            localStorage.setItem(newKey, value);
            localStorage.removeItem(oldKey);
            keysMigrated.push(oldKey);
        }
    }

    return keysMigrated.length;
}

/**
 * Migrate IndexedDB from old database name to new app-scoped name.
 * 
 * Old name: mini-trainer-db
 * New name: mini-trainer-{appId}-db
 * 
 * @returns Whether migration was performed
 */
async function migrateIndexedDB(): Promise<boolean> {
    const appId = getAppId();
    const oldDbName = 'mini-trainer-db';
    const newDbName = `mini-trainer-${appId}-db`;

    // Check if old database exists
    if (!indexedDB.databases) {
        // browsers without indexedDB.databases() support
        // Try to open the old database and check if it has data
        return false;
    }

    const databases = await indexedDB.databases();
    const oldDbExists = databases.some(db => db.name === oldDbName);

    if (!oldDbExists) {
        return false;
    }

    try {
        // Open old database and read all data
        const oldDb = await openDB(oldDbName);

        // Get all data from old stores
        const profiles = await oldDb.getAll('profiles').catch(() => []);
        const results = await oldDb.getAll('results').catch(() => []);
        const observations = await oldDb.getAll('observations').catch(() => []);
        const foerderplaene = await oldDb.getAll('foerderplaene').catch(() => []);
        const settings = await oldDb.getAll('settings').catch(() => []);

        oldDb.close();

        // If no data, just delete the old database
        if (profiles.length === 0 && results.length === 0) {
            await indexedDB.deleteDatabase(oldDbName);
            return true;
        }

        // Open new database (this will create it with the correct schema)
        // We use openDB directly to avoid circular dependencies with db.ts
        const newDb = await openDB(newDbName, 1, {
            upgrade(db) {
                // Create the same schema as in db.ts
                if (!db.objectStoreNames.contains('profiles')) {
                    db.createObjectStore('profiles', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('results')) {
                    const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
                    resultsStore.createIndex('by-profile', 'childProfileId');
                    resultsStore.createIndex('by-area', 'areaId');
                    resultsStore.createIndex('by-theme', 'themeId');
                }
                if (!db.objectStoreNames.contains('observations')) {
                    const observationsStore = db.createObjectStore('observations', { keyPath: 'id' });
                    observationsStore.createIndex('by-student', 'studentId');
                }
                if (!db.objectStoreNames.contains('foerderplaene')) {
                    const foerderplaeneStore = db.createObjectStore('foerderplaene', { keyPath: 'id' });
                    foerderplaeneStore.createIndex('by-student', 'studentId');
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            },
        });

        // Write all data to new database
        for (const profile of profiles) {
            await newDb.put('profiles', profile);
        }
        for (const result of results) {
            await newDb.put('results', result);
        }
        for (const observation of observations) {
            await newDb.put('observations', observation);
        }
        for (const foerderplan of foerderplaene) {
            await newDb.put('foerderplaene', foerderplan);
        }
        for (const setting of settings) {
            await newDb.put('settings', setting);
        }

        // Delete old database
        await indexedDB.deleteDatabase(oldDbName);

        return true;
    } catch (error) {
        console.error('[Migration] Failed to migrate IndexedDB:', error);
        return false;
    }
}

/**
 * Run the full migration for the current app.
 * This should be called once when the app starts.
 * 
 * @returns Migration result
 */
export async function runMigration(): Promise<MigrationResult> {
    const appId = getAppId();

    // Only DAZ app needs migration
    if (appId !== 'daz') {
        return {
            success: true,
            migrated: false,
            localStorageKeysMigrated: 0,
            indexedDBMigrated: false,
        };
    }

    // Check if already migrated
    const migrationKey = `mte:daz:app:migrationComplete`;
    const existingMigration = localStorage.getItem(migrationKey);
    if (existingMigration) {
        return {
            success: true,
            migrated: false,
            localStorageKeysMigrated: 0,
            indexedDBMigrated: false,
        };
    }

    try {
        // Migrate localStorage
        const localStorageKeysMigrated = migrateLocalStorage();

        // Migrate IndexedDB
        const indexedDBMigrated = await migrateIndexedDB();

        // Mark migration as complete
        localStorage.setItem(migrationKey, new Date().toISOString());

        return {
            success: true,
            migrated: true,
            localStorageKeysMigrated,
            indexedDBMigrated,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('[Migration] Migration failed:', errorMessage);

        return {
            success: false,
            migrated: false,
            error: errorMessage,
            localStorageKeysMigrated: 0,
            indexedDBMigrated: false,
        };
    }
}

/**
 * Initialize migration on app startup.
 * This is a convenience function that runs migration if needed.
 */
export async function initializeMigration(): Promise<void> {
    if (isMigrationNeeded()) {
        await runMigration();
    }
}
