import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import i18n from '@core/i18n';
import { useAppStore } from '@core/stores';
import { useDocumentSettings } from '../useDocumentSettings';

const html = document.documentElement;

beforeEach(() => {
    useAppStore.getState().resetSettings();
});

afterEach(async () => {
    html.removeAttribute('data-font-size');
    html.removeAttribute('data-high-contrast');
    html.removeAttribute('data-reduce-motion');
    html.removeAttribute('data-theme');
    useAppStore.getState().resetSettings();
    await i18n.changeLanguage('de');
});

describe('useDocumentSettings', () => {
    it('applies the current settings on mount', () => {
        renderHook(() => useDocumentSettings());
        expect(html.getAttribute('data-font-size')).toBe('normal');
        expect(html.hasAttribute('data-high-contrast')).toBe(false);
        expect(html.hasAttribute('data-reduce-motion')).toBe(false);
        expect(html.getAttribute('lang')).toBe('de');
        expect(html.getAttribute('dir')).toBe('ltr');
    });

    it('follows font size, contrast and animation changes', () => {
        renderHook(() => useDocumentSettings());
        act(() => {
            useAppStore.getState().setFontSize('extra-large');
            useAppStore.getState().toggleHighContrast();
            useAppStore.getState().toggleAnimations();
        });
        expect(html.getAttribute('data-font-size')).toBe('extra-large');
        expect(html.hasAttribute('data-high-contrast')).toBe(true);
        expect(html.hasAttribute('data-reduce-motion')).toBe(true);
    });

    it('applies the theme', () => {
        renderHook(() => useDocumentSettings());
        act(() => useAppStore.getState().setTheme('noir'));
        expect(html.getAttribute('data-theme')).toBe('noir');
    });

    it('switches the UI language with the locale setting', async () => {
        renderHook(() => useDocumentSettings());
        act(() => useAppStore.getState().setLocale('en'));
        await act(async () => undefined);
        expect(i18n.language).toBe('en');
        expect(html.getAttribute('lang')).toBe('en');
    });
});
