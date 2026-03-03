/**
 * ID generation utilities for the Mini Trainer Engine.
 * 
 * Provides functions for generating unique identifiers.
 */

// ============================================================================
// ID Generation
// ============================================================================

/**
 * Generate a unique identifier using crypto.randomUUID if available,
 * falling back to a timestamp-based implementation.
 * 
 * @returns A unique string identifier
 */
export function generateId(): string {
    // Use crypto.randomUUID if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    // Fallback: timestamp + random string
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).slice(2, 11);
    return `${timestamp}-${randomPart}`;
}

/**
 * Generate a short ID suitable for display purposes.
 * 
 * @param length - The desired length (default: 6)
 * @returns A short alphanumeric string
 */
export function generateShortId(length: number = 6): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    // Use crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const values = new Uint32Array(length);
        crypto.getRandomValues(values);
        for (let i = 0; i < length; i++) {
            const value = values[i];
            result += chars[(value ?? 0) % chars.length];
        }
    } else {
        // Fallback to Math.random
        for (let i = 0; i < length; i++) {
            result += chars[Math.floor(Math.random() * chars.length)];
        }
    }

    return result;
}

/**
 * Generate a profile ID with a specific prefix.
 * 
 * @returns A profile identifier
 */
export function generateProfileId(): string {
    return `profile-${generateId()}`;
}

/**
 * Generate an exercise result ID.
 * 
 * @returns An exercise result identifier
 */
export function generateResultId(): string {
    return `result-${generateId()}`;
}

/**
 * Generate an observation record ID.
 * 
 * @returns An observation record identifier
 */
export function generateObservationId(): string {
    return `obs-${generateId()}`;
}

/**
 * Generate a Foerderplan ID.
 * 
 * @returns A Foerderplan identifier
 */
export function generateFoerderplanId(): string {
    return `fp-${generateId()}`;
}

/**
 * Check if a string is a valid UUID format.
 * 
 * @param id - The string to check
 * @returns Whether the string is a valid UUID
 */
export function isValidUuid(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Check if a string is a valid ID (UUID or custom format).
 * 
 * @param id - The string to check
 * @returns Whether the string is a valid ID
 */
export function isValidId(id: string): boolean {
    // Allow UUIDs or custom format IDs (prefix-uuid or prefix-timestamp-random)
    return id.length > 0 && id.length <= 100;
}
