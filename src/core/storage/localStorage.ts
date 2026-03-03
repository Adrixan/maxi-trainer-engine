/**
 * localStorage wrapper with type safety for the Mini Trainer Engine.
 * 
 * Provides a type-safe interface for storing application preferences
 * and other small data that doesn't require IndexedDB.
 */

import type { StorageKey } from '@/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Map of storage keys to their value types.
 */
interface StorageKeyMap {
    'app:locale': string;
    'app:theme': string;
    'app:fontSize': 'normal' | 'large' | 'extra-large';
    'app:highContrast': boolean;
    'app:animationsEnabled': boolean;
    'app:soundEnabled': boolean;
    'app:currentProfileId': string;
    'app:teacherPin': string;
    'app:teacherPinEnabled': boolean;
    'app:hasSeenOnboarding': boolean;
    'app:lastVersion': string;
    'app:installPromptDismissed': boolean;
}

/**
 * Storage entry with metadata.
 */
interface StorageEntry<T> {
    value: T;
    version: number;
    updatedAt: string;
}

// ============================================================================
// Storage Configuration
// ============================================================================

/**
 * Current storage schema version.
 */
const STORAGE_VERSION = 1;

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
 * Prefix for all storage keys to avoid collisions.
 * Includes app ID for multi-app isolation.
 */
function getKeyPrefix(): string {
    return `mte:${getAppId()}:`;
}

// ============================================================================
// Core Storage Functions
// ============================================================================

/**
 * Get a value from localStorage.
 * 
 * @param key - The storage key
 * @returns The stored value, or undefined if not found or invalid
 */
export function getStorageItem<K extends StorageKey>(
    key: K
): StorageKeyMap[K] | undefined {
    try {
        const prefixedKey = `${getKeyPrefix()}${key}`;
        const stored = localStorage.getItem(prefixedKey);

        if (!stored) {
            return undefined;
        }

        const entry = JSON.parse(stored) as StorageEntry<StorageKeyMap[K]>;

        // Handle version migrations if needed
        if (entry.version !== STORAGE_VERSION) {
            // Future: add migration logic here
            return undefined;
        }

        return entry.value;
    } catch (error) {
        // Invalid JSON or other error
        console.error('[Storage] ❌ Failed to read localStorage item:', { key, error });
        return undefined;
    }
}

/**
 * Set a value in localStorage.
 * 
 * @param key - The storage key
 * @param value - The value to store
 */
export function setStorageItem<K extends StorageKey>(
    key: K,
    value: StorageKeyMap[K]
): void {
    try {
        const prefixedKey = `${getKeyPrefix()}${key}`;
        const entry: StorageEntry<StorageKeyMap[K]> = {
            value,
            version: STORAGE_VERSION,
            updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(prefixedKey, JSON.stringify(entry));
    } catch (error) {
        // Storage might be full or disabled
        console.error('[Storage] ❌ Failed to save to localStorage:', { key, error });
    }
}

/**
 * Remove a value from localStorage.
 * 
 * @param key - The storage key to remove
 */
export function removeStorageItem(key: StorageKey): void {
    try {
        const prefixedKey = `${getKeyPrefix()}${key}`;
        localStorage.removeItem(prefixedKey);
    } catch (error) {
        console.error(`Failed to remove ${key} from localStorage:`, error);
    }
}

/**
 * Check if a key exists in localStorage.
 * 
 * @param key - The storage key to check
 * @returns Whether the key exists
 */
export function hasStorageItem(key: StorageKey): boolean {
    const prefixedKey = `${getKeyPrefix()}${key}`;
    return localStorage.getItem(prefixedKey) !== null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Get a value with a default fallback.
 * 
 * @param key - The storage key
 * @param defaultValue - The default value if not found
 * @returns The stored value or the default
 */
export function getStorageItemWithDefault<K extends StorageKey>(
    key: K,
    defaultValue: StorageKeyMap[K]
): StorageKeyMap[K] {
    return getStorageItem(key) ?? defaultValue;
}

/**
 * Clear all app storage items.
 * Only clears items with our prefix.
 */
export function clearAllStorageItems(): void {
    try {
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(getKeyPrefix())) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
    }
}

// ============================================================================
// Typed Accessors
// ============================================================================

/**
 * Get the current locale setting.
 */
export function getLocale(): string {
    return getStorageItemWithDefault('app:locale', 'de');
}

/**
 * Set the locale setting.
 */
export function setLocale(locale: string): void {
    setStorageItem('app:locale', locale);
}

/**
 * Get the current theme setting.
 */
export function getTheme(): string {
    return getStorageItemWithDefault('app:theme', 'default');
}

/**
 * Set the theme setting.
 */
export function setTheme(theme: string): void {
    setStorageItem('app:theme', theme);
}

/**
 * Get the font size setting.
 */
export function getFontSize(): 'normal' | 'large' | 'extra-large' {
    return getStorageItemWithDefault('app:fontSize', 'normal');
}

/**
 * Set the font size setting.
 */
export function setFontSize(size: 'normal' | 'large' | 'extra-large'): void {
    setStorageItem('app:fontSize', size);
}

/**
 * Get the high contrast mode setting.
 */
export function getHighContrast(): boolean {
    return getStorageItemWithDefault('app:highContrast', false);
}

/**
 * Set the high contrast mode setting.
 */
export function setHighContrast(enabled: boolean): void {
    setStorageItem('app:highContrast', enabled);
}

/**
 * Get the animations enabled setting.
 */
export function getAnimationsEnabled(): boolean {
    return getStorageItemWithDefault('app:animationsEnabled', true);
}

/**
 * Set the animations enabled setting.
 */
export function setAnimationsEnabled(enabled: boolean): void {
    setStorageItem('app:animationsEnabled', enabled);
}

/**
 * Get the sound enabled setting.
 */
export function getSoundEnabled(): boolean {
    return getStorageItemWithDefault('app:soundEnabled', true);
}

/**
 * Set the sound enabled setting.
 */
export function setSoundEnabled(enabled: boolean): void {
    setStorageItem('app:soundEnabled', enabled);
}

/**
 * Get the current profile ID.
 */
export function getCurrentProfileId(): string | undefined {
    return getStorageItem('app:currentProfileId');
}

/**
 * Set the current profile ID.
 */
export function setCurrentProfileId(id: string): void {
    setStorageItem('app:currentProfileId', id);
}

/**
 * Clear the current profile ID.
 */
export function clearCurrentProfileId(): void {
    removeStorageItem('app:currentProfileId');
}

/**
 * Check if onboarding has been seen.
 */
export function hasSeenOnboarding(): boolean {
    return getStorageItemWithDefault('app:hasSeenOnboarding', false);
}

/**
 * Mark onboarding as seen.
 */
export function setHasSeenOnboarding(seen: boolean = true): void {
    setStorageItem('app:hasSeenOnboarding', seen);
}
