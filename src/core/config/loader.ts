/**
 * Configuration loader for the Mini Trainer Engine.
 * 
 * Provides functions to load and validate configuration files
 * for subjects, areas, themes, and badges.
 * 
 * Supports dynamic loading from app-specific directories based on
 * the VITE_APP_ID environment variable.
 */

import type {
    SubjectConfig,
    ObservationArea,
    Theme,
    BadgeDefinition,
    TrainerConfig,
    GamificationConfig,
    AccessibilityDefaults,
    ValidationError,
    ValidationWarning,
    Exercise,
} from '@/types';
import {
    validateSubjectConfig,
    validateAreas,
    validateThemes,
    validateBadges,
} from './validation';

// ============================================================================
// App Configuration Type
// ============================================================================

/**
 * App configuration from app.json
 */
export interface AppConfig {
    id: string;
    name: string;
    version: string;
    build: {
        pwaEnabled: boolean;
        usbDistribution: boolean;
    };
    display: {
        primaryColor: string;
        icon: string;
    };
    terminology: {
        level: string;
        levelPlural: string;
        theme: string;
        themePlural: string;
        exercise: string;
        exercisePlural: string;
    };
}

// ============================================================================
// App ID Detection
// ============================================================================

/**
 * Get the current app ID from environment variable.
 * Defaults to 'daz' if not set.
 */
function getAppId(): string {
    return import.meta.env.VITE_APP_ID || 'daz';
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default gamification configuration.
 * Used when not specified in configuration files.
 */
const DEFAULT_GAMIFICATION: GamificationConfig = {
    starStrategy: 'attempts',
    maxStarsPerExercise: 3,
    levelThresholds: [
        { level: 1, starsRequired: 0 },
        { level: 2, starsRequired: 10 },
        { level: 3, starsRequired: 25 },
        { level: 4, starsRequired: 45 },
        { level: 5, starsRequired: 70 },
        { level: 6, starsRequired: 100 },
        { level: 7, starsRequired: 140 },
        { level: 8, starsRequired: 190 },
        { level: 9, starsRequired: 250 },
        { level: 10, starsRequired: 320 },
    ],
    streakConfig: {
        milestones: [3, 7, 14, 30],
    },
};

/**
 * Default accessibility configuration.
 * Applied to new user profiles.
 */
const DEFAULT_ACCESSIBILITY: AccessibilityDefaults = {
    defaultFontSize: 'normal',
    defaultHighContrast: false,
    defaultAnimationsEnabled: true,
    defaultSoundEnabled: true,
};

// ============================================================================
// Dynamic Configuration Loading with Caching
// ============================================================================

/**
 * Cache for loaded configurations to avoid reloading.
 */
interface ConfigCache {
    subject: SubjectConfig | null;
    areas: ObservationArea[] | null;
    themes: Theme[] | null;
    badges: BadgeDefinition[] | null;
    exercises: Exercise[] | null;
    gamification: GamificationConfig | null;
    loaded: boolean;
}

let configCache: ConfigCache = {
    subject: null,
    areas: null,
    themes: null,
    badges: null,
    exercises: null,
    gamification: null,
    loaded: false,
};

/**
 * Reset the configuration cache.
 * Useful for testing or when switching apps.
 */
export function resetConfigCache(): void {
    configCache = {
        subject: null,
        areas: null,
        themes: null,
        badges: null,
        exercises: null,
        gamification: null,
        loaded: false,
    };
}

/**
 * Get the current app ID.
 * Exported for testing and debugging.
 */
export function getCurrentAppId(): string {
    return getAppId();
}

/**
 * Load app configuration (app.json).
 * Falls back to defaults if not available.
 *
 * @returns AppConfig with primary color and terminology
 */
export async function loadAppConfig(): Promise<AppConfig> {
    const appId = getAppId();
    const windowObj = window as unknown as Record<string, unknown>;

    // Check window object first for USB/offline mode
    if (windowObj.__TRAINER_APP__) {
        return windowObj.__TRAINER_APP__ as AppConfig;
    }

    // Try to fetch app.json from apps directory
    const appPath = `./apps/${appId}/app.json`;

    try {
        const response = await fetch(appPath);
        if (response.ok) {
            return await response.json() as AppConfig;
        }
    } catch {
        // Ignore fetch errors, use defaults
    }

    // Return default config based on appId
    return getDefaultAppConfig(appId);
}

/**
 * Get default app config for known apps.
 */
function getDefaultAppConfig(appId: string): AppConfig {
    if (appId === 'daz') {
        return {
            id: 'daz',
            name: 'Deutsch als Zweitsprache',
            version: '1.0.0',
            build: { pwaEnabled: true, usbDistribution: true },
            display: { primaryColor: '#3b82f6', icon: '/assets/daz-icon.svg' },
            terminology: {
                level: 'Wortschatz-Level',
                levelPlural: 'Wortschatz-Level',
                theme: 'Thema',
                themePlural: 'Themen',
                exercise: 'Übung',
                exercisePlural: 'Übungen',
            },
        };
    }
    if (appId === 'mathematik') {
        return {
            id: 'mathematik',
            name: 'Mathematik Grundstufe',
            version: '1.0.0',
            build: { pwaEnabled: true, usbDistribution: true },
            display: { primaryColor: '#10b981', icon: '/assets/mathematik-icon.svg' },
            terminology: {
                level: 'Level',
                levelPlural: 'Level',
                theme: 'Thema',
                themePlural: 'Themen',
                exercise: 'Aufgabe',
                exercisePlural: 'Aufgaben',
            },
        };
    }
    // Default fallback
    return {
        id: appId,
        name: 'Mini Trainer',
        version: '1.0.0',
        build: { pwaEnabled: true, usbDistribution: true },
        display: { primaryColor: '#3b82f6', icon: '/icon.svg' },
        terminology: {
            level: 'Level',
            levelPlural: 'Level',
            theme: 'Theme',
            themePlural: 'Themes',
            exercise: 'Exercise',
            exercisePlural: 'Exercises',
        },
    };
}

// ============================================================================
// Dynamic Import Helpers
// ============================================================================

/**
 * Load a JSON configuration file dynamically.
 * Tries to load from app-specific directory first, falls back to default.
 * 
 * Supports two loading modes:
 * 1. USB/offline mode: Checks window.__TRAINER_* globals (set via script tags)
 * 2. HTTP/PWA mode: Falls back to fetch for HTTP server loading
 * 
 * @param filename - The name of the JSON file (e.g., 'subject.json')
 * @param _appId - The app ID to load from (kept for API compatibility)
 * @param useFallback - Whether to fall back to default config if app-specific doesn't exist
 * @returns The loaded JSON data
 */
async function loadConfigJson<T>(filename: string, _appId: string, useFallback = true): Promise<T> {
    // Map filename to window key for USB/offline mode
    const windowKeyMap: Record<string, string> = {
        'subject.json': '__TRAINER_SUBJECT__',
        'areas.json': '__TRAINER_AREAS__',
        'themes.json': '__TRAINER_THEMES__',
        'badges.json': '__TRAINER_BADGES__',
    };

    // Check window object first for USB/offline mode (script tag loading)
    const windowObj = window as unknown as Record<string, unknown>;
    const windowKey = windowKeyMap[filename];
    if (windowKey && windowObj[windowKey]) {
        return windowObj[windowKey] as T;
    }

    // Fall back to fetch for HTTP/PWA mode
    // In production, config files are copied to /config/ directory
    // Try app-specific path first (works in both dev and production)
    const appPath = `./config/${filename}`;

    // Skip file:// protocol check since we now check window first
    // If window data wasn't available, try fetch anyway (might work with local server)

    try {
        const response = await fetch(appPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json() as T;
    } catch {
        // If app-specific doesn't exist and fallback is enabled, try default path
        if (useFallback) {
            const defaultPath = `./config/${filename}`;
            try {
                const response = await fetch(defaultPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return await response.json() as T;
            } catch {
                throw new Error(`Failed to load ${filename} from both app-specific and default paths`);
            }
        }
        throw new Error(`Failed to load ${filename} from app-specific path: ${appPath}`);
    }
}

/**
 * Load exercises JSON which has a different structure.
 * 
 * Supports two loading modes:
 * 1. USB/offline mode: Checks window.__TRAINER_EXERCISES__ (set via script tags)
 * 2. HTTP/PWA mode: Falls back to fetch for HTTP server loading
 * 
 * @param _appId - The app ID to load from (kept for API compatibility)
 * @param useFallback - Whether to fall back to default config
 * @returns The loaded exercises data
 */
async function loadExercisesJson(_appId: string, useFallback = true): Promise<Exercise[]> {
    // Check window object first for USB/offline mode (script tag loading)
    const windowObj = window as unknown as Record<string, unknown>;
    if (windowObj.__TRAINER_EXERCISES__) {
        const exercisesData = windowObj.__TRAINER_EXERCISES__;
        if (Array.isArray(exercisesData)) {
            return exercisesData as Exercise[];
        }
        // Handle object format { exercises: [...] }
        if (exercisesData && typeof exercisesData === 'object' && 'exercises' in exercisesData) {
            return (exercisesData as { exercises: Exercise[] }).exercises || [];
        }
    }

    // Fall back to fetch for HTTP/PWA mode
    // In production, exercises are loaded via script tag (window.__TRAINER_EXERCISES__)
    // This function is for loading exercises via fetch if needed
    // Try app-specific path first
    const appPath = `./data/exercises.js`;

    try {
        const response = await fetch(appPath);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        return data.exercises || [];
    } catch {
        // If app-specific doesn't exist and fallback is enabled, try default path
        if (useFallback) {
            const defaultPath = `./data/exercises.js`;
            try {
                const response = await fetch(defaultPath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                return data.exercises || [];
            } catch {
                throw new Error('Failed to load exercises from all possible paths');
            }
        }
        throw new Error(`Failed to load exercises from app-specific path: ${appPath}`);
    }
}

// ============================================================================
// Badge Data Transformation
// ============================================================================

/**
 * Transform badge data from JSON format to BadgeDefinition[].
 * 
 * @param badgesData - The raw badges data from JSON
 * @returns Transformed badge definitions
 */
function transformBadges(badgesData: {
    badges: Array<{ badge: BadgeDefinition['badge']; type: string; threshold: number }>;
    gamification?: Partial<GamificationConfig>;
}): BadgeDefinition[] {
    return badgesData.badges.map((item) => ({
        badge: item.badge,
        checkExpression: `${item.type}:${item.threshold}`,
    }));
}

// ============================================================================
// Configuration Loaders (Synchronous - using cache)
// ============================================================================

/**
 * Load and validate the subject configuration.
 * Uses cached data if available.
 * 
 * @returns The validated subject configuration
 * @throws Error if configuration is invalid or not loaded
 */
export function loadSubjectConfig(): SubjectConfig {
    if (!configCache.subject) {
        throw new Error('Configuration not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.subject;
}

/**
 * Load and validate observation areas.
 * Uses cached data if available.
 * 
 * @returns Array of validated observation areas
 * @throws Error if configuration is invalid or not loaded
 */
export function loadAreas(): ObservationArea[] {
    if (!configCache.areas) {
        throw new Error('Configuration not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.areas;
}

/**
 * Load and validate themes.
 * Uses cached data if available.
 * 
 * @returns Array of validated themes
 * @throws Error if configuration is invalid or not loaded
 */
export function loadThemes(): Theme[] {
    if (!configCache.themes) {
        throw new Error('Configuration not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.themes;
}

/**
 * Load and validate badge definitions.
 * Uses cached data if available.
 * 
 * @returns Array of validated badge definitions
 * @throws Error if configuration is invalid or not loaded
 */
export function loadBadges(): BadgeDefinition[] {
    if (!configCache.badges) {
        throw new Error('Configuration not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.badges;
}

/**
 * Load exercises from the exercises.json file.
 * Uses cached data if available.
 * 
 * @returns Array of exercises
 * @throws Error if exercises not loaded
 */
export function loadExercises(): Exercise[] {
    if (!configCache.exercises) {
        throw new Error('Exercises not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.exercises;
}

/**
 * Load gamification configuration from badges.json.
 * Uses cached data if available.
 * 
 * @returns Gamification configuration
 * @throws Error if configuration not loaded
 */
export function loadGamificationConfig(): GamificationConfig {
    if (!configCache.gamification) {
        throw new Error('Configuration not loaded. Call loadFullConfig() or loadConfigSafe() first.');
    }
    return configCache.gamification;
}

// ============================================================================
// Full Configuration Loading
// ============================================================================

/**
 * Internal function to load and cache all configurations.
 * This must be called before any of the synchronous load functions.
 * 
 * @returns Object with loaded configurations
 */
async function loadAndCacheAllConfig(): Promise<{
    subject: SubjectConfig;
    areas: ObservationArea[];
    themes: Theme[];
    badges: BadgeDefinition[];
    gamification: GamificationConfig;
    exercises: Exercise[];
}> {
    const appId = getAppId();

    // Load subject config
    const subjectJson = await loadConfigJson<SubjectConfig>('subject.json', appId);
    const subjectResult = validateSubjectConfig(subjectJson);
    if (!subjectResult.valid) {
        const errorMessages = subjectResult.errors
            .map((e: ValidationError) => `${e.path}: ${e.message}`)
            .join('\n');
        throw new Error(`Invalid subject configuration:\n${errorMessages}`);
    }

    // Load areas
    const areasJson = await loadConfigJson<ObservationArea[]>('areas.json', appId);
    const areasResult = validateAreas(areasJson);
    if (!areasResult.valid) {
        const errorMessages = areasResult.errors
            .map((e: ValidationError) => `${e.path}: ${e.message}`)
            .join('\n');
        throw new Error(`Invalid areas configuration:\n${errorMessages}`);
    }

    // Load themes
    const themesJson = await loadConfigJson<Theme[]>('themes.json', appId);
    const themesResult = validateThemes(themesJson);
    if (!themesResult.valid) {
        const errorMessages = themesResult.errors
            .map((e: ValidationError) => `${e.path}: ${e.message}`)
            .join('\n');
        throw new Error(`Invalid themes configuration:\n${errorMessages}`);
    }

    // Load badges
    const badgesJson = await loadConfigJson<{
        badges: Array<{ badge: BadgeDefinition['badge']; type: string; threshold: number }>;
        gamification?: Partial<GamificationConfig>;
    }>('badges.json', appId);
    const badgesResult = validateBadges(badgesJson);
    if (!badgesResult.valid) {
        const errorMessages = badgesResult.errors
            .map((e: ValidationError) => `${e.path}: ${e.message}`)
            .join('\n');
        throw new Error(`Invalid badges configuration:\n${errorMessages}`);
    }
    const badges = transformBadges(badgesJson);

    // Load gamification config
    let gamification = DEFAULT_GAMIFICATION;
    if (badgesJson.gamification) {
        gamification = {
            ...DEFAULT_GAMIFICATION,
            ...badgesJson.gamification,
            levelThresholds: badgesJson.gamification.levelThresholds ?? DEFAULT_GAMIFICATION.levelThresholds,
            streakConfig: badgesJson.gamification.streakConfig ?? DEFAULT_GAMIFICATION.streakConfig,
        };
    }

    // Load exercises
    const exercises = await loadExercisesJson(appId);

    // Update cache
    configCache = {
        subject: subjectJson,
        areas: areasJson,
        themes: themesJson,
        badges,
        gamification,
        exercises,
        loaded: true,
    };

    return {
        subject: subjectJson,
        areas: areasJson,
        themes: themesJson,
        badges,
        gamification,
        exercises,
    };
}

/**
 * Load the complete trainer configuration.
 * Combines all configuration files into a single TrainerConfig object.
 * This function loads configurations asynchronously.
 * 
 * @returns Complete trainer configuration
 * @throws Error if any configuration is invalid
 */
export async function loadFullConfig(): Promise<TrainerConfig> {
    const { subject, areas, themes, badges, gamification } = await loadAndCacheAllConfig();

    return {
        id: `trainer-${subject.id}`,
        name: subject.name,
        description: subject.description,
        version: '1.0.0',
        subject,
        observationAreas: areas,
        themes,
        badges,
        supportedLocales: ['de', 'en'],
        defaultLocale: 'de',
        gamification,
        accessibility: DEFAULT_ACCESSIBILITY,
    };
}

// ============================================================================
// Synchronous Loading (for compatibility - loads with defaults if not async loaded)
// ============================================================================

/**
 * Synchronous version that returns cached config or throws.
 * Use loadFullConfig() async function for initial load.
 * 
 * @returns Complete trainer configuration (must have called async load first)
 * @throws Error if configuration not loaded
 */
export function loadFullConfigSync(): TrainerConfig {
    if (!configCache.loaded) {
        throw new Error(
            'Configuration not loaded. Use loadFullConfig() (async) to load configuration first. ' +
            'The async load is required for dynamic app-specific config loading.'
        );
    }

    // At this point, all cached values are guaranteed to be non-null
    // because configCache.loaded is true only when loadAndCacheAllConfig succeeded
    const subject = configCache.subject as SubjectConfig;
    const areas = configCache.areas as ObservationArea[];
    const themes = configCache.themes as Theme[];
    const badges = configCache.badges as BadgeDefinition[];
    const gamification = configCache.gamification as GamificationConfig;

    return {
        id: `trainer-${subject.id}`,
        name: subject.name,
        description: subject.description,
        version: '1.0.0',
        subject,
        observationAreas: areas,
        themes,
        badges,
        supportedLocales: ['de', 'en'],
        defaultLocale: 'de',
        gamification,
        accessibility: DEFAULT_ACCESSIBILITY,
    };
}

// ============================================================================
// Configuration Validation (Non-throwing)
// ============================================================================

/**
 * Result of loading configuration with error handling.
 */
export interface ConfigLoadResult {
    /** Whether the configuration loaded successfully */
    success: boolean;
    /** The loaded configuration (if successful) */
    config: TrainerConfig | null;
    /** Validation errors encountered */
    errors: Array<{ file: string; message: string }>;
    /** Validation warnings encountered */
    warnings: Array<{ file: string; message: string }>;
}

/**
 * Load configuration with graceful error handling.
 * Returns a result object instead of throwing.
 * 
 * @returns Configuration load result with status and any errors
 */
export async function loadConfigSafe(): Promise<ConfigLoadResult> {
    const errors: ConfigLoadResult['errors'] = [];
    const warnings: ConfigLoadResult['warnings'] = [];
    const appId = getAppId();

    try {
        // Load subject
        const subjectJson = await loadConfigJson<SubjectConfig>('subject.json', appId);
        const subjectResult = validateSubjectConfig(subjectJson);
        if (!subjectResult.valid) {
            subjectResult.errors.forEach((e: ValidationError) => {
                errors.push({ file: 'subject.json', message: `${e.path}: ${e.message}` });
            });
        }
        subjectResult.warnings.forEach((w: ValidationWarning) => {
            warnings.push({ file: 'subject.json', message: `${w.path}: ${w.message}` });
        });

        // Load areas
        const areasJson = await loadConfigJson<ObservationArea[]>('areas.json', appId);
        const areasResult = validateAreas(areasJson);
        if (!areasResult.valid) {
            areasResult.errors.forEach((e: ValidationError) => {
                errors.push({ file: 'areas.json', message: `${e.path}: ${e.message}` });
            });
        }
        areasResult.warnings.forEach((w: ValidationWarning) => {
            warnings.push({ file: 'areas.json', message: `${w.path}: ${w.message}` });
        });

        // Load themes
        const themesJson = await loadConfigJson<Theme[]>('themes.json', appId);
        const themesResult = validateThemes(themesJson);
        if (!themesResult.valid) {
            themesResult.errors.forEach((e: ValidationError) => {
                errors.push({ file: 'themes.json', message: `${e.path}: ${e.message}` });
            });
        }
        themesResult.warnings.forEach((w: ValidationWarning) => {
            warnings.push({ file: 'themes.json', message: `${w.path}: ${w.message}` });
        });

        // Load badges
        const badgesJson = await loadConfigJson<{
            badges: Array<{ badge: BadgeDefinition['badge']; type: string; threshold: number }>;
            gamification?: Partial<GamificationConfig>;
        }>('badges.json', appId);
        const badgesResult = validateBadges(badgesJson);
        if (!badgesResult.valid) {
            badgesResult.errors.forEach((e: ValidationError) => {
                errors.push({ file: 'badges.json', message: `${e.path}: ${e.message}` });
            });
        }
        badgesResult.warnings.forEach((w: ValidationWarning) => {
            warnings.push({ file: 'badges.json', message: `${w.path}: ${w.message}` });
        });

        // If there are errors, return failure before trying to load full config
        if (errors.length > 0) {
            return {
                success: false,
                config: null,
                errors,
                warnings,
            };
        }

        // Load full config (this also updates the cache)
        const config = await loadFullConfig();
        return {
            success: true,
            config,
            errors: [],
            warnings,
        };
    } catch (err) {
        return {
            success: false,
            config: null,
            errors: [{ file: 'loader', message: String(err) }],
            warnings,
        };
    }
}
