/**
 * IndexedDB storage wrapper for the Mini Trainer Engine.
 * 
 * Provides a type-safe interface for storing and retrieving
 * profiles, exercise results, and other persistent data.
 * 
 * Security features:
 * - Trainer isolation via separate databases per trainer
 * - Each trainer gets their own IndexedDB database
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
    UserProfile,
    ExerciseResult,
    ObservationRecord,
    Foerderplan,
    StoreName,
} from '@/types';

// ============================================================================
// Trainer ID Configuration
// ============================================================================

/**
 * Get the trainer ID from environment or use default.
 * This ensures each trainer (mathematik, daz, etc.) has isolated storage.
 */
function getTrainerId(): string {
    const envTrainerId = import.meta.env?.VITE_APP_ID as string | undefined;
    return envTrainerId || 'daz';
}

/**
 * Get the trainer-specific database name.
 * Each trainer gets their own IndexedDB database for isolation.
 */
export function getDatabaseName(): string {
    const trainerId = getTrainerId();
    return `mini-trainer-${trainerId}`;
}

/**
 * Export the trainer ID for use in other modules.
 */
export { getTrainerId };

// ============================================================================
// Database Schema
// ============================================================================

/**
 * Database schema definition for type-safe IndexedDB access.
 */
interface TrainerDB extends DBSchema {
    profiles: {
        key: string;
        value: UserProfile & { _version: number; _updatedAt: string };
    };
    results: {
        key: string;
        value: ExerciseResult & { _version: number };
        indexes: {
            'by-profile': string;
            'by-area': string;
            'by-theme': string;
        };
    };
    observations: {
        key: string;
        value: ObservationRecord & { _version: number };
        indexes: {
            'by-student': string;
        };
    };
    foerderplaene: {
        key: string;
        value: Foerderplan & { _version: number };
        indexes: {
            'by-student': string;
        };
    };
    settings: {
        key: string;
        value: {
            key: string;
            value: unknown;
            _version: number;
            _updatedAt: string;
        };
    };
}

// ============================================================================
// Database Configuration
// ============================================================================

/**
 * Database name - now trainer-specific.
 * 
 * Security: Each trainer (mathematik, daz) gets their own database
 * to prevent data leakage between trainers.
 */
const DB_NAME = getDatabaseName();

/**
 * Current database schema version.
 * Increment when adding/removing/modifying object stores.
 */
const DB_VERSION = 1;

// ============================================================================
// Database Connection
// ============================================================================

/**
 * Singleton promise for the database connection.
 */
let dbPromise: Promise<IDBPDatabase<TrainerDB>> | null = null;

/**
 * Get or create the database connection.
 * 
 * @returns Promise resolving to the database instance
 */
function getDB(): Promise<IDBPDatabase<TrainerDB>> {
    if (!dbPromise) {
        dbPromise = openDB<TrainerDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // Version 1: Initial schema
                if (oldVersion < 1) {
                    // User profiles store
                    if (!db.objectStoreNames.contains('profiles')) {
                        db.createObjectStore('profiles', { keyPath: 'id' });
                    }

                    // Exercise results store with indexes
                    if (!db.objectStoreNames.contains('results')) {
                        const resultsStore = db.createObjectStore('results', { keyPath: 'id' });
                        resultsStore.createIndex('by-profile', 'childProfileId');
                        resultsStore.createIndex('by-area', 'areaId');
                        resultsStore.createIndex('by-theme', 'themeId');
                    }

                    // Observation records store
                    if (!db.objectStoreNames.contains('observations')) {
                        const observationsStore = db.createObjectStore('observations', { keyPath: 'id' });
                        observationsStore.createIndex('by-student', 'studentId');
                    }

                    // Foerderplaene store
                    if (!db.objectStoreNames.contains('foerderplaene')) {
                        const foerderplaeneStore = db.createObjectStore('foerderplaene', { keyPath: 'id' });
                        foerderplaeneStore.createIndex('by-student', 'studentId');
                    }

                    // Settings store
                    if (!db.objectStoreNames.contains('settings')) {
                        db.createObjectStore('settings', { keyPath: 'key' });
                    }
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Reset the database connection (useful for testing).
 */
export function resetDBConnection(): void {
    dbPromise = null;
}

// ============================================================================
// Profile Operations
// ============================================================================

/**
 * Save a user profile to the database.
 * 
 * @param profile - The profile to save
 */
export async function saveProfile(profile: UserProfile): Promise<void> {
    const db = await getDB();
    const storedProfile = {
        ...profile,
        _version: 1,
        _updatedAt: new Date().toISOString(),
    };
    await db.put('profiles', storedProfile);
}

/**
 * Get a user profile by ID.
 * 
 * @param id - The profile ID
 * @returns The profile, or undefined if not found
 */
export async function getProfile(id: string): Promise<UserProfile | undefined> {
    const db = await getDB();
    const stored = await db.get('profiles', id);
    if (!stored) {
        return undefined;
    }

    // Remove internal fields before returning
    const { _version, _updatedAt, ...profile } = stored;
    return profile;
}

/**
 * Get all user profiles.
 * 
 * @returns Array of all profiles
 */
export async function getAllProfiles(): Promise<UserProfile[]> {
    const db = await getDB();
    const stored = await db.getAll('profiles');
    return stored.map(({ _version, _updatedAt, ...profile }) => profile);
}

/**
 * Delete a user profile by ID.
 * 
 * @param id - The profile ID to delete
 */
export async function deleteProfile(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('profiles', id);
}

/**
 * Clear all profiles from the database.
 */
export async function clearAllProfiles(): Promise<void> {
    const db = await getDB();
    await db.clear('profiles');
}

// ============================================================================
// Exercise Result Operations
// ============================================================================

/**
 * Save an exercise result to the database.
 * 
 * @param result - The result to save
 */
export async function saveExerciseResult(result: ExerciseResult): Promise<void> {
    const db = await getDB();
    const storedResult = {
        ...result,
        _version: 1,
    };
    await db.put('results', storedResult);
}

/**
 * Get all exercise results for a profile.
 * 
 * @param profileId - The profile ID
 * @returns Array of results for the profile
 */
export async function getExerciseResultsByProfile(profileId: string): Promise<ExerciseResult[]> {
    const db = await getDB();
    const stored = await db.getAllFromIndex('results', 'by-profile', profileId);
    return stored.map(({ _version, ...result }) => result);
}

/**
 * Get all exercise results for an observation area.
 * 
 * @param areaId - The observation area ID
 * @returns Array of results for the area
 */
export async function getExerciseResultsByArea(areaId: string): Promise<ExerciseResult[]> {
    const db = await getDB();
    const stored = await db.getAllFromIndex('results', 'by-area', areaId);
    return stored.map(({ _version, ...result }) => result);
}

/**
 * Get all exercise results for a theme.
 * 
 * @param themeId - The theme ID
 * @returns Array of results for the theme
 */
export async function getExerciseResultsByTheme(themeId: string): Promise<ExerciseResult[]> {
    const db = await getDB();
    const stored = await db.getAllFromIndex('results', 'by-theme', themeId);
    return stored.map(({ _version, ...result }) => result);
}

/**
 * Get all exercise results.
 * 
 * @returns Array of all results
 */
export async function getAllExerciseResults(): Promise<ExerciseResult[]> {
    const db = await getDB();
    const stored = await db.getAll('results');
    return stored.map(({ _version, ...result }) => result);
}

/**
 * Check if an exercise has been previously completed by a profile.
 * 
 * @param profileId - The profile ID
 * @param exerciseId - The exercise ID
 * @returns True if the exercise was previously completed correctly
 */
export async function hasExerciseBeenCompleted(
    profileId: string,
    exerciseId: string
): Promise<boolean> {
    const results = await getExerciseResultsByProfile(profileId);
    return results.some(result =>
        result.exerciseId === exerciseId && result.correct
    );
}

/**
 * Get all completed exercise IDs for a profile.
 * 
 * @param profileId - The profile ID
 * @returns Set of completed exercise IDs
 */
export async function getCompletedExerciseIds(profileId: string): Promise<Set<string>> {
    const results = await getExerciseResultsByProfile(profileId);
    return new Set(
        results
            .filter(result => result.correct)
            .map(result => result.exerciseId)
    );
}

/**
 * Clear all exercise results from the database.
 */
export async function clearAllExerciseResults(): Promise<void> {
    const db = await getDB();
    await db.clear('results');
}

/**
 * Delete all exercise results for a specific profile.
 * 
 * @param profileId - The profile ID to delete results for
 */
export async function deleteAllResultsForProfile(profileId: string): Promise<void> {
    const db = await getDB();
    const tx = db.transaction('results', 'readwrite');
    const index = tx.store.index('by-profile');
    let cursor = await index.openCursor(profileId);
    while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
    }
    await tx.done;
}

// ============================================================================
// Observation Record Operations
// ============================================================================

/**
 * Save an observation record to the database.
 * 
 * @param record - The observation record to save
 */
export async function saveObservationRecord(record: ObservationRecord): Promise<void> {
    const db = await getDB();
    const storedRecord = {
        ...record,
        _version: 1,
    };
    await db.put('observations', storedRecord);
}

/**
 * Get all observation records for a student.
 * 
 * @param studentId - The student ID
 * @returns Array of observation records for the student
 */
export async function getObservationRecordsByStudent(studentId: string): Promise<ObservationRecord[]> {
    const db = await getDB();
    const stored = await db.getAllFromIndex('observations', 'by-student', studentId);
    return stored.map(({ _version, ...record }) => record);
}

/**
 * Get all observation records.
 * 
 * @returns Array of all observation records
 */
export async function getAllObservationRecords(): Promise<ObservationRecord[]> {
    const db = await getDB();
    const stored = await db.getAll('observations');
    return stored.map(({ _version, ...record }) => record);
}

// ============================================================================
// Foerderplan Operations
// ============================================================================

/**
 * Save a Foerderplan to the database.
 * 
 * @param plan - The Foerderplan to save
 */
export async function saveFoerderplan(plan: Foerderplan): Promise<void> {
    const db = await getDB();
    const storedPlan = {
        ...plan,
        _version: 1,
    };
    await db.put('foerderplaene', storedPlan);
}

/**
 * Get all Foerderplaene for a student.
 * 
 * @param studentId - The student ID
 * @returns Array of Foerderplaene for the student
 */
export async function getFoerderplaeneByStudent(studentId: string): Promise<Foerderplan[]> {
    const db = await getDB();
    const stored = await db.getAllFromIndex('foerderplaene', 'by-student', studentId);
    return stored.map(({ _version, ...plan }) => plan);
}

/**
 * Get a Foerderplan by ID.
 * 
 * @param id - The Foerderplan ID
 * @returns The Foerderplan, or undefined if not found
 */
export async function getFoerderplan(id: string): Promise<Foerderplan | undefined> {
    const db = await getDB();
    const stored = await db.get('foerderplaene', id);
    if (!stored) return undefined;

    const { _version, ...plan } = stored;
    return plan;
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Save a setting to the database.
 * 
 * @param key - The setting key
 * @param value - The setting value
 */
export async function saveSetting<T>(key: string, value: T): Promise<void> {
    const db = await getDB();
    await db.put('settings', {
        key,
        value,
        _version: 1,
        _updatedAt: new Date().toISOString(),
    });
}

/**
 * Get a setting from the database.
 * 
 * @param key - The setting key
 * @returns The setting value, or undefined if not found
 */
export async function getSetting<T>(key: string): Promise<T | undefined> {
    const db = await getDB();
    const stored = await db.get('settings', key);
    return stored?.value as T | undefined;
}

/**
 * Delete a setting from the database.
 * 
 * @param key - The setting key
 */
export async function deleteSetting(key: string): Promise<void> {
    const db = await getDB();
    await db.delete('settings', key);
}

// ============================================================================
// Export/Import Operations
// ============================================================================

/**
 * Export all data from the database.
 * 
 * @param trainerId - The trainer identifier
 * @param trainerVersion - The trainer version
 * @returns Export data object
 */
export async function exportAllData(trainerId: string, trainerVersion: string) {
    const [profiles, results] = await Promise.all([
        getAllProfiles(),
        getAllExerciseResults(),
    ]);

    return {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        trainerId,
        trainerVersion,
        profiles,
        results,
    };
}

/**
 * Import data into the database.
 * 
 * @param data - The data to import
 * @returns Import result with counts and any errors
 */
export async function importData(data: {
    profiles?: UserProfile[];
    results?: ExerciseResult[];
}): Promise<{
    success: boolean;
    profilesImported: number;
    resultsImported: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let profilesImported = 0;
    let resultsImported = 0;

    try {
        // Import profiles
        if (data.profiles) {
            for (const profile of data.profiles) {
                try {
                    await saveProfile(profile);
                    profilesImported++;
                } catch (error) {
                    errors.push(`Failed to import profile ${profile.id}: ${error}`);
                }
            }
        }

        // Import results
        if (data.results) {
            for (const result of data.results) {
                try {
                    await saveExerciseResult(result);
                    resultsImported++;
                } catch (error) {
                    errors.push(`Failed to import result ${result.id}: ${error}`);
                }
            }
        }

        return {
            success: errors.length === 0,
            profilesImported,
            resultsImported,
            errors,
        };
    } catch (error) {
        return {
            success: false,
            profilesImported,
            resultsImported,
            errors: [...errors, `Import failed: ${error}`],
        };
    }
}

// ============================================================================
// Database Utilities
// ============================================================================

/**
 * Clear all data from all stores.
 */
export async function clearAllData(): Promise<void> {
    const db = await getDB();
    const storeNames: StoreName[] = ['profiles', 'results', 'observations', 'foerderplaene', 'settings'];

    await Promise.all(
        storeNames.map((storeName) => db.clear(storeName))
    );
}

/**
 * Get database statistics.
 */
export async function getDatabaseStats(): Promise<{
    profileCount: number;
    resultCount: number;
    observationCount: number;
    foerderplanCount: number;
}> {
    const db = await getDB();

    const [profiles, results, observations, foerderplaene] = await Promise.all([
        db.count('profiles'),
        db.count('results'),
        db.count('observations'),
        db.count('foerderplaene'),
    ]);

    return {
        profileCount: profiles,
        resultCount: results,
        observationCount: observations,
        foerderplanCount: foerderplaene,
    };
}
