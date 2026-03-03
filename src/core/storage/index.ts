/**
 * Storage module exports for the Mini Trainer Engine.
 * 
 * Provides a unified API for both IndexedDB and localStorage storage.
 */

// Re-export types
export type {
    StorageKey,
    DatabaseName,
    StoreName,
    StoredProfile,
    StoredExerciseResult,
    StoredRecord,
    ExportVersion,
    ExportData,
    ImportResult,
    Migration,
    SchemaVersion,
    StorageConfig,
    StorageStats,
    CacheEntry,
    CacheConfig,
} from '@/types';

// IndexedDB operations
export {
    // Profile operations
    saveProfile,
    getProfile,
    getAllProfiles,
    deleteProfile,
    clearAllProfiles,

    // Exercise result operations
    saveExerciseResult,
    getExerciseResultsByProfile,
    getExerciseResultsByArea,
    getExerciseResultsByTheme,
    getAllExerciseResults,
    clearAllExerciseResults,
    hasExerciseBeenCompleted,
    getCompletedExerciseIds,

    // Observation record operations
    saveObservationRecord,
    getObservationRecordsByStudent,
    getAllObservationRecords,

    // Foerderplan operations
    saveFoerderplan,
    getFoerderplaeneByStudent,
    getFoerderplan,

    // Settings operations
    saveSetting,
    getSetting,
    deleteSetting,

    // Export/Import
    exportAllData,
    importData,

    // Trainer isolation
    getDatabaseName,
    getTrainerId,

    // Utilities
    clearAllData,
    getDatabaseStats,
    resetDBConnection,
} from './db';

// localStorage operations
export {
    // Core functions
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    hasStorageItem,
    getStorageItemWithDefault,
    clearAllStorageItems,

    // Typed accessors
    getLocale,
    setLocale,
    getTheme,
    setTheme,
    getFontSize,
    setFontSize,
    getHighContrast,
    setHighContrast,
    getAnimationsEnabled,
    setAnimationsEnabled,
    getSoundEnabled,
    setSoundEnabled,
    getCurrentProfileId,
    setCurrentProfileId,
    clearCurrentProfileId,
    hasSeenOnboarding,
    setHasSeenOnboarding,
} from './localStorage';
