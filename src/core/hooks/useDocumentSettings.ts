/**
 * Applies the user's display settings to the document.
 *
 * Global CSS reacts to attributes on <html> (`data-font-size`,
 * `data-high-contrast`, `data-reduce-motion`, `data-theme`), and the language
 * of the UI follows the locale setting. Without this the settings screen would
 * change the stored values but not what the user sees.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@core/stores';

export function useDocumentSettings(): void {
    const { i18n } = useTranslation();
    const locale = useAppStore((s) => s.settings.locale);
    const theme = useAppStore((s) => s.settings.theme);
    const fontSize = useAppStore((s) => s.settings.fontSize);
    const highContrast = useAppStore((s) => s.settings.highContrastMode);
    const animationsEnabled = useAppStore((s) => s.settings.animationsEnabled);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize);
    }, [fontSize]);

    useEffect(() => {
        document.documentElement.toggleAttribute('data-high-contrast', highContrast);
    }, [highContrast]);

    useEffect(() => {
        document.documentElement.toggleAttribute('data-reduce-motion', !animationsEnabled);
    }, [animationsEnabled]);

    useEffect(() => {
        if (i18n.language !== locale) void i18n.changeLanguage(locale);
        document.documentElement.setAttribute('lang', locale);
        document.documentElement.setAttribute('dir', i18n.dir(locale));
    }, [i18n, locale]);
}
