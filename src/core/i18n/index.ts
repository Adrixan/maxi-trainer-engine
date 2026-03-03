/**
 * i18n configuration for the Mini Trainer Engine.
 * 
 * Configures i18next for internationalization support.
 * Supports multiple locales with German as the default.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de.json';
import en from './en.json';

/**
 * Supported locales with their translations.
 */
const resources = {
    de: { translation: de },
    en: { translation: en },
} as const;

/**
 * Default locale.
 */
const DEFAULT_LOCALE = 'de';

/**
 * Initialize i18next.
 */
i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,

    interpolation: {
        // React already escapes values
        escapeValue: false,
    },

    // React-specific options
    react: {
        // Wait for all translations before rendering
        useSuspense: false,
    },

    // Missing key handling
    saveMissing: false,
});

/**
 * Supported locale codes.
 */
export const SUPPORTED_LOCALES = ['de', 'en'] as const;

/**
 * Type for supported locales.
 */
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Check if a locale is supported.
 * 
 * @param locale - The locale code to check
 * @returns Whether the locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
    return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

/**
 * Get the best matching locale from a list of preferences.
 * 
 * @param preferences - Array of preferred locales (e.g., from navigator.languages)
 * @returns The best matching supported locale, or the default
 */
export function getBestMatchingLocale(preferences: readonly string[]): SupportedLocale {
    for (const pref of preferences) {
        // Exact match
        if (isSupportedLocale(pref)) {
            return pref;
        }

        // Language code match (e.g., 'de-AT' matches 'de')
        const langCode = pref.split('-')[0];
        if (langCode !== undefined && isSupportedLocale(langCode)) {
            return langCode;
        }
    }

    return DEFAULT_LOCALE;
}

/**
 * Change the current locale.
 * 
 * @param locale - The locale to change to
 */
export async function changeLocale(locale: SupportedLocale): Promise<void> {
    await i18n.changeLanguage(locale);
}

/**
 * Get the current locale.
 * 
 * @returns The current locale code
 */
export function getCurrentLocale(): string {
    return i18n.language;
}

/**
 * Get the translation function for use outside of React components.
 * 
 * @returns The translation function
 */
export function getTranslator() {
    return i18n.t.bind(i18n);
}

export default i18n;
