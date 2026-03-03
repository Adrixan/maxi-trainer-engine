/**
 * Internationalization type definitions for the Mini Trainer Engine.
 * 
 * This module defines types for multi-language support and translation keys.
 */

// ============================================================================
// Locale Types
// ============================================================================

/**
 * Supported locale identifiers.
 * Uses IETF BCP 47 language tags.
 * 
 * Common examples:
 * - 'de-AT' - German (Austria)
 * - 'de-DE' - German (Germany)
 * - 'en' - English
 * - 'en-US' - English (United States)
 */
export type SupportedLocale = string;

/**
 * Default supported locales for the trainer.
 * Can be extended via configuration.
 */
export type DefaultLocale =
    | 'de-AT'
    | 'de-DE'
    | 'en'
    | 'en-US';

// ============================================================================
// Translation Key Types
// ============================================================================

/**
 * Base type for translation keys.
 * Provides type-safe translation key access.
 * 
 * This is a base type that should be extended with specific keys
 * for each trainer configuration.
 * 
 * Example usage:
 * ```typescript
 * // In a specific trainer's types:
 * type AppTranslationKey = 
 *   | 'common.submit'
 *   | 'common.cancel'
 *   | 'exercises.fillBlank.instruction'
 *   | TranslationKey;
 * ```
 */
export type TranslationKey = string & { readonly __brand: unique symbol };

/**
 * Translation key for exercise instructions.
 * Template literal type for exercise-related translations.
 */
export type ExerciseTranslationKey = `exercises.${string}`;

/**
 * Translation key for theme names.
 * Template literal type for theme-related translations.
 */
export type ThemeTranslationKey = `themes.${string}.name` | `themes.${string}.description`;

/**
 * Translation key for observation area names.
 * Template literal type for area-related translations.
 */
export type AreaTranslationKey = `areas.${string}.name` | `areas.${string}.description`;

/**
 * Translation key for badge names.
 * Template literal type for badge-related translations.
 */
export type BadgeTranslationKey = `badges.${string}.name` | `badges.${string}.description`;

/**
 * Translation key for UI elements.
 */
export type UITranslationKey =
    | 'ui.common.submit'
    | 'ui.common.cancel'
    | 'ui.common.next'
    | 'ui.common.previous'
    | 'ui.common.close'
    | 'ui.common.hint'
    | 'ui.common.correct'
    | 'ui.common.incorrect'
    | 'ui.common.tryAgain'
    | 'ui.common.score'
    | 'ui.common.level'
    | 'ui.common.stars'
    | 'ui.common.streak'
    | 'ui.nav.home'
    | 'ui.nav.themes'
    | 'ui.nav.progress'
    | 'ui.nav.settings'
    | `ui.${string}`;

// ============================================================================
// Translation Types
// ============================================================================

/**
 * Translation value type.
 * Can be a simple string or a string with interpolation placeholders.
 */
export type TranslationValue = string;

/**
 * Translation dictionary for a locale.
 * Maps translation keys to their translated values.
 */
export type TranslationDictionary = Record<string, TranslationValue>;

/**
 * Complete translations for all locales.
 */
export type Translations = Record<SupportedLocale, TranslationDictionary>;

// ============================================================================
// i18n Configuration
// ============================================================================

/**
 * Internationalization configuration.
 */
export interface I18nConfig {
    /** Supported locales */
    locales: SupportedLocale[];
    /** Default locale to use */
    defaultLocale: SupportedLocale;
    /** Fallback locale when translation is missing */
    fallbackLocale?: SupportedLocale;
    /** Whether to log missing translation keys */
    logMissingKeys?: boolean;
}

/**
 * Options for translation function.
 */
export interface TranslateOptions {
    /** Locale to use (defaults to current locale) */
    locale?: SupportedLocale;
    /** Interpolation values */
    values?: Record<string, string | number>;
    /** Default value if translation is missing */
    defaultValue?: string;
    /** Whether to return the key if translation is missing */
    returnKeyIfMissing?: boolean;
}
