/**
 * Storage type definitions for the Mini Trainer Engine.
 * 
 * This module defines types for localStorage and IndexedDB storage,
 * including keys, stored data structures, and migration support.
 */

import type { UserProfile } from './profile';
import type { ExerciseResult } from './exercise';

// ============================================================================
// Storage Key Types
// ============================================================================

/**
 * localStorage key identifiers.
 * Used for persisting application state and preferences.
 */
export type StorageKey =
    | 'app:locale'
    | 'app:theme'
    | 'app:fontSize'
    | 'app:highContrast'
    | 'app:animationsEnabled'
    | 'app:soundEnabled'
    | 'app:currentProfileId'
    | 'app:teacherPin'
    | 'app:teacherPinEnabled'
    | 'app:hasSeenOnboarding'
    | 'app:lastVersion'
    | 'app:installPromptDismissed';

/**
 * IndexedDB database name.
 */
export type DatabaseName = 'mini-trainer-db';

/**
 * IndexedDB store names.
 */
export type StoreName =
    | 'profiles'
    | 'results'
    | 'observations'
    | 'foerderplaene'
    | 'settings';

/**
 * IndexedDB store names as const array for runtime use.
 */
export const STORE_NAMES = [
    'profiles',
    'results',
    'observations',
    'foerderplaene',
    'settings',
] as const satisfies readonly StoreName[];

// ============================================================================
// Stored Data Types
// ============================================================================

/**
 * Profile as stored in IndexedDB.
 * Includes metadata for storage management.
 */
export interface StoredProfile extends UserProfile {
    /** Database record version for migrations */
    _version: number;
    /** Timestamp of last modification */
    _updatedAt: string;
}

/**
 * Exercise result as stored in IndexedDB.
 */
export interface StoredExerciseResult extends ExerciseResult {
    /** Database record version for migrations */
    _version: number;
}

/**
 * Generic stored record with metadata.
 */
export interface StoredRecord<T> {
    /** The actual data */
    data: T;
    /** Database record version for migrations */
    _version: number;
    /** Timestamp of creation */
    _createdAt: string;
    /** Timestamp of last modification */
    _updatedAt: string;
}

// ============================================================================
// Data Export Types
// ============================================================================

/**
 * Export data format version.
 */
export type ExportVersion = 1;

/**
 * Complete data export for backup/transfer.
 */
export interface ExportData {
    /** Export format version */
    version: ExportVersion;
    /** ISO 8601 timestamp of export */
    exportedAt: string;
    /** Trainer identifier */
    trainerId: string;
    /** Trainer version */
    trainerVersion: string;
    /** User profiles */
    profiles: UserProfile[];
    /** Exercise results */
    results: ExerciseResult[];
}

/**
 * Import result status.
 */
export interface ImportResult {
    /** Whether the import was successful */
    success: boolean;
    /** Number of profiles imported */
    profilesImported: number;
    /** Number of results imported */
    resultsImported: number;
    /** Errors encountered during import */
    errors: string[];
    /** Warnings during import */
    warnings: string[];
}

// ============================================================================
// Migration Types
// ============================================================================

/**
 * Database migration definition.
 */
export interface Migration {
    /** Migration version number */
    version: number;
    /** Migration description */
    description: string;
    /** Migration function to apply */
    migrate: (db: IDBDatabase) => Promise<void>;
}

/**
 * Schema version information.
 */
export interface SchemaVersion {
    /** Current schema version */
    current: number;
    /** Minimum supported version for import */
    minimumSupported: number;
    /** Latest schema version */
    latest: number;
}

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Storage configuration options.
 */
export interface StorageConfig {
    /** IndexedDB database name */
    databaseName: DatabaseName;
    /** Current schema version */
    schemaVersion: number;
    /** Whether to enable automatic backups */
    autoBackup: boolean;
    /** Backup interval in milliseconds */
    backupIntervalMs: number;
    /** Maximum number of backups to keep */
    maxBackups: number;
}

/**
 * Storage statistics.
 */
export interface StorageStats {
    /** Number of profiles stored */
    profileCount: number;
    /** Number of exercise results stored */
    resultCount: number;
    /** Estimated storage size in bytes */
    estimatedSizeBytes: number;
    /** Oldest result timestamp */
    oldestResult?: string;
    /** Newest result timestamp */
    newestResult?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Cache entry with expiration.
 */
export interface CacheEntry<T> {
    /** Cached data */
    data: T;
    /** ISO 8601 timestamp when cached */
    cachedAt: string;
    /** ISO 8601 timestamp when expires */
    expiresAt: string;
    /** Cache key */
    key: string;
}

/**
 * Cache configuration.
 */
export interface CacheConfig {
    /** Default time-to-live in milliseconds */
    defaultTtlMs: number;
    /** Maximum number of entries */
    maxEntries: number;
    /** Whether to persist to localStorage */
    persist: boolean;
}
