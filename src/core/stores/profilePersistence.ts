/**
 * Profile persistence module for the Mini Trainer Engine.
 * 
 * Handles save game export/import and IndexedDB synchronization.
 * Separated from profileStore to maintain single responsibility.
 * 
 * Security features:
 * - Trainer isolation via trainerId
 * - Save file integrity via SHA-256 checksum
 * - Value range validation on import
 */

import type { UserProfile, ExerciseResult } from '@/types';
import {
    saveProfile,
    clearAllExerciseResults,
    saveExerciseResult,
    getAllExerciseResults,
    getTrainerId,
} from '@core/storage';

// ============================================================================
// Constants
// ============================================================================

/**
 * Current save game version.
 */
export const SAVE_GAME_VERSION = 3;

// ============================================================================
// Types
// ============================================================================

/**
 * Save game payload for export/import.
 * Version 3 adds trainerId for isolation and checksum for integrity.
 */
export interface SaveGamePayload {
    version: 3;
    savedAt: string;
    /** Trainer ID for isolation (e.g., 'mathematik', 'daz') */
    trainerId: string;
    /** SHA-256 checksum of the profile and results for integrity verification */
    checksum: string;
    profile: UserProfile;
    exerciseResults: ExerciseResult[];
}

/**
 * Result of a save game import operation.
 */
export type ImportResult =
    | { success: true }
    | { success: false; error: string };

// ============================================================================
// Value Validation Constants
// ============================================================================

/**
 * Valid ranges for imported values to prevent tampering.
 */
const VALIDATION_LIMITS = {
    totalStars: { min: 0, max: 1000000 },
    currentStreak: { min: 0, max: 365 },
    longestStreak: { min: 0, max: 365 },
    level: { min: 1, max: 100 },
    themeLevel: { min: 0, max: 10 },
    exercisesCompleted: { min: 0, max: 10000 },
    starsEarned: { min: 0, max: 10000 },
    maxStars: { min: 0, max: 10000 },
    stars: { min: 0, max: 3 },
} as const;

// ============================================================================
// Checksum Utilities
// ============================================================================

/**
 * Compute SHA-256 checksum of data.
 * Used to verify save file integrity.
 */
async function computeChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute checksum for a save game payload (without the checksum field itself).
 */
async function computePayloadChecksum(
    trainerId: string,
    profile: UserProfile,
    exerciseResults: ExerciseResult[]
): Promise<string> {
    const data = JSON.stringify({ trainerId, profile, exerciseResults });
    return computeChecksum(data);
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate a numeric value is within acceptable range.
 */
function validateNumeric(value: unknown, fieldName: string, limits: { min: number; max: number }): string | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return `Invalid ${fieldName}: must be a finite number`;
    }
    if (value < limits.min || value > limits.max) {
        return `Invalid ${fieldName}: must be between ${limits.min} and ${limits.max}, got ${value}`;
    }
    return null;
}

/**
 * Validate a profile's numeric values are within valid ranges.
 * This prevents tampered save files from setting unrealistic values.
 */
function validateProfileValues(profile: unknown): string[] {
    const errors: string[] = [];
    if (!profile || typeof profile !== 'object') {
        return ['Invalid profile: not an object'];
    }

    const p = profile as Record<string, unknown>;

    // Validate totalStars
    if (p.totalStars !== undefined) {
        const error = validateNumeric(p.totalStars, 'totalStars', VALIDATION_LIMITS.totalStars);
        if (error) errors.push(error);
    }

    // Validate currentStreak
    if (p.currentStreak !== undefined) {
        const error = validateNumeric(p.currentStreak, 'currentStreak', VALIDATION_LIMITS.currentStreak);
        if (error) errors.push(error);
    }

    // Validate longestStreak
    if (p.longestStreak !== undefined) {
        const error = validateNumeric(p.longestStreak, 'longestStreak', VALIDATION_LIMITS.longestStreak);
        if (error) errors.push(error);
    }

    // Validate currentLevels
    if (p.currentLevels && typeof p.currentLevels === 'object') {
        const levels = p.currentLevels as Record<string, unknown>;
        for (const [areaId, level] of Object.entries(levels)) {
            const error = validateNumeric(level, `currentLevels.${areaId}`, VALIDATION_LIMITS.level);
            if (error) errors.push(error);
        }
    }

    // Validate themeProgress
    if (p.themeProgress && typeof p.themeProgress === 'object') {
        const themeProgress = p.themeProgress as Record<string, Record<string, unknown>>;
        for (const [themeId, progress] of Object.entries(themeProgress)) {
            if (progress.exercisesCompleted !== undefined) {
                const error = validateNumeric(progress.exercisesCompleted, `themeProgress.${themeId}.exercisesCompleted`, VALIDATION_LIMITS.exercisesCompleted);
                if (error) errors.push(error);
            }
            if (progress.starsEarned !== undefined) {
                const error = validateNumeric(progress.starsEarned, `themeProgress.${themeId}.starsEarned`, VALIDATION_LIMITS.starsEarned);
                if (error) errors.push(error);
            }
            if (progress.maxStars !== undefined) {
                const error = validateNumeric(progress.maxStars, `themeProgress.${themeId}.maxStars`, VALIDATION_LIMITS.maxStars);
                if (error) errors.push(error);
            }
        }
    }

    // Validate themeLevels
    if (p.themeLevels && typeof p.themeLevels === 'object') {
        const themeLevels = p.themeLevels as Record<string, unknown>;
        for (const [themeId, level] of Object.entries(themeLevels)) {
            const error = validateNumeric(level, `themeLevels.${themeId}`, VALIDATION_LIMITS.themeLevel);
            if (error) errors.push(error);
        }
    }

    return errors;
}

/**
 * Validate exercise result values are within valid ranges.
 */
function validateExerciseResultValues(result: unknown): string[] {
    const errors: string[] = [];
    if (!result || typeof result !== 'object') {
        return ['Invalid exercise result: not an object'];
    }

    const r = result as Record<string, unknown>;

    // Validate stars
    if (r.stars !== undefined) {
        const error = validateNumeric(r.stars, 'stars', VALIDATION_LIMITS.stars);
        if (error) errors.push(error);
    }

    return errors;
}

/**
 * Validate badges are earned legitimately.
 * This is a basic check - in production, you'd verify against badge criteria.
 */
function validateBadges(badges: unknown): string[] {
    const errors: string[] = [];

    if (!Array.isArray(badges)) {
        return ['Invalid badges: must be an array'];
    }

    for (let i = 0; i < badges.length; i++) {
        const badge = badges[i];
        if (!badge || typeof badge !== 'object') {
            errors.push(`Invalid badge at index ${i}: must be an object`);
            continue;
        }

        const b = badge as Record<string, unknown>;

        // Validate required fields
        if (!b.id || typeof b.id !== 'string') {
            errors.push(`Invalid badge at index ${i}: missing or invalid id`);
        }
        if (!b.name || typeof b.name !== 'string') {
            errors.push(`Invalid badge at index ${i}: missing or invalid name`);
        }
        if (!b.earnedAt || typeof b.earnedAt !== 'string') {
            errors.push(`Invalid badge at index ${i}: missing or invalid earnedAt`);
        }

        // Validate earnedAt is a valid ISO date
        if (b.earnedAt && typeof b.earnedAt === 'string') {
            const date = new Date(b.earnedAt);
            if (isNaN(date.getTime())) {
                errors.push(`Invalid badge at index ${i}: earnedAt is not a valid date`);
            }
            // Don't allow future dates
            if (date.getTime() > Date.now()) {
                errors.push(`Invalid badge at index ${i}: earnedAt cannot be in the future`);
            }
        }
    }

    return errors;
}

/**
 * Validate a save game payload.
 * 
 * @param data - The data to validate
 * @returns Validation result with error message if invalid
 */
export function validateSaveGame(data: unknown): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid save game: not an object' };
    }

    const payload = data as Record<string, unknown>;

    // Check version
    if (payload.version !== SAVE_GAME_VERSION) {
        return {
            valid: false,
            error: `Invalid save game version. Expected ${SAVE_GAME_VERSION}, got ${payload.version}`,
        };
    }

    // Check required fields
    if (!payload.profile || typeof payload.profile !== 'object') {
        return { valid: false, error: 'Invalid save game: missing profile data' };
    }

    const profile = payload.profile as Record<string, unknown>;
    if (!profile.id || !profile.nickname) {
        return { valid: false, error: 'Invalid save game: missing profile id or nickname' };
    }

    // Check trainerId
    if (!payload.trainerId || typeof payload.trainerId !== 'string') {
        return { valid: false, error: 'Invalid save game: missing trainerId' };
    }

    // Check checksum
    if (!payload.checksum || typeof payload.checksum !== 'string') {
        return { valid: false, error: 'Invalid save game: missing checksum' };
    }

    // Note: Full checksum verification happens in importSaveGame via validateAndVerifySaveGame

    return { valid: true };
}

/**
 * Full validation with checksum verification and value range checks.
 * Used during import to ensure save file integrity.
 */
export async function validateAndVerifySaveGame(
    data: unknown
): Promise<{ valid: boolean; error?: string }> {
    // First do basic validation
    const basicValidation = validateSaveGame(data);
    if (!basicValidation.valid) {
        return basicValidation;
    }

    const payload = data as SaveGamePayload;

    // Verify trainerId matches current trainer - block if different
    const currentTrainerId = getTrainerId();
    if (payload.trainerId !== currentTrainerId) {
        return {
            valid: false,
            error: `Invalid save game: This save file is from a different trainer (${payload.trainerId}) and cannot be imported into this app (${currentTrainerId}).`,
        };
    }

    // Verify checksum
    const profileData = payload.profile;
    const resultsData = payload.exerciseResults || [];
    const expectedChecksum = await computePayloadChecksum(
        payload.trainerId,
        profileData,
        resultsData
    );

    if (payload.checksum !== expectedChecksum) {
        return {
            valid: false,
            error: 'Invalid save game: checksum mismatch - file may have been tampered with',
        };
    }

    // Validate profile values are within acceptable ranges
    const profileErrors = validateProfileValues(payload.profile);
    if (profileErrors.length > 0) {
        return {
            valid: false,
            error: `Invalid save game: ${profileErrors.join(', ')}`,
        };
    }

    // Validate exercise results
    if (payload.exerciseResults) {
        for (let i = 0; i < payload.exerciseResults.length; i++) {
            const resultErrors = validateExerciseResultValues(payload.exerciseResults[i]);
            if (resultErrors.length > 0) {
                return {
                    valid: false,
                    error: `Invalid save game at result ${i}: ${resultErrors.join(', ')}`,
                };
            }
        }
    }

    // Validate badges
    const badgeErrors = validateBadges(payload.profile.badges);
    if (badgeErrors.length > 0) {
        return {
            valid: false,
            error: `Invalid save game badges: ${badgeErrors.join(', ')}`,
        };
    }

    return { valid: true };
}

// ============================================================================
// Export Operations
// ============================================================================

/**
 * Export profile and exercise results as a save game payload.
 * Includes trainerId and checksum for security.
 * 
 * @param profile - The user profile to export
 * @returns Promise resolving to the save game payload
 */
export async function exportSaveGame(profile: UserProfile): Promise<SaveGamePayload> {
    const exerciseResults = await getAllExerciseResults();
    const trainerId = getTrainerId();

    // Compute checksum for integrity
    const checksum = await computePayloadChecksum(trainerId, profile, exerciseResults);

    return {
        version: SAVE_GAME_VERSION,
        savedAt: new Date().toISOString(),
        trainerId,
        checksum,
        profile,
        exerciseResults,
    };
}

/**
 * Download a save game file.
 * 
 * @param payload - The save game data to download
 */
export function downloadSaveGame(payload: SaveGamePayload): void {
    const nickname = payload.profile.nickname || 'player';
    const date = new Date().toISOString().split('T')[0];
    const filename = `spielstand-${nickname}-${date}.json`;

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// Import Operations
// ============================================================================

/**
 * Import a save game payload.
 * Performs full validation including checksum verification and value range checks.
 * 
 * @param data - The save game data to import
 * @param setProfile - Callback to set the imported profile
 * @returns Promise resolving to the import result
 */
export async function importSaveGame(
    data: SaveGamePayload,
    setProfile: (profile: UserProfile) => void
): Promise<ImportResult> {
    try {
        // Full validation with checksum and value range checks
        const validation = await validateAndVerifySaveGame(data);
        if (!validation.valid) {
            return { success: false, error: validation.error ?? 'Unknown validation error' };
        }

        // Clear existing data
        await clearAllExerciseResults();

        // Import exercise results
        if (data.exerciseResults && Array.isArray(data.exerciseResults)) {
            for (const result of data.exerciseResults) {
                await saveExerciseResult(result);
            }
        }

        // Set the imported profile
        setProfile(data.profile);

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Parse and validate a save game file.
 * 
 * @param file - The file to parse
 * @returns Promise resolving to the save game payload or error
 */
export async function parseSaveGameFile(file: File): Promise<SaveGamePayload> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content) as SaveGamePayload;
                resolve(data);
            } catch {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// ============================================================================
// IndexedDB Sync
// ============================================================================

/**
 * Sync profile to IndexedDB.
 * Called when profile changes in the store.
 * 
 * @param profile - The profile to sync
 */
export async function syncProfileToIndexedDB(profile: UserProfile | null): Promise<void> {
    if (!profile) return;

    try {
        await saveProfile(profile);
    } catch (error) {
        console.error('[Storage] ❌ Failed to save profile to IndexedDB:', error);
        throw error;
    }
}
