/**
 * Application settings store for the Mini Trainer Engine.
 * 
 * Manages global application settings like theme, language,
 * accessibility options, and teacher authentication.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLocale } from '@core/i18n';

// ============================================================================
// Types
// ============================================================================

/**
 * Font size options for accessibility.
 */
export type FontSize = 'normal' | 'large' | 'extra-large';

/**
 * Application settings interface.
 */
export interface AppSettings {
    /** Current locale */
    locale: SupportedLocale;
    /** Theme identifier */
    theme: string;
    /** Font size for accessibility */
    fontSize: FontSize;
    /** High contrast mode for visibility */
    highContrastMode: boolean;
    /** Whether animations are enabled */
    animationsEnabled: boolean;
    /** Whether sound effects are enabled */
    soundEnabled: boolean;
    /** Teacher PIN for accessing teacher dashboard */
    teacherPin: string;
    /** Whether teacher PIN is enabled */
    teacherPinEnabled: boolean;
}

/**
 * Application state interface.
 */
export interface AppState {
    /** Current settings */
    settings: AppSettings;
    /** Whether teacher is authenticated */
    teacherAuthenticated: boolean;

    // Actions
    /** Set the locale */
    setLocale: (locale: SupportedLocale) => void;
    /** Set the theme */
    setTheme: (theme: string) => void;
    /** Set the font size */
    setFontSize: (size: FontSize) => void;
    /** Toggle high contrast mode */
    toggleHighContrast: () => void;
    /** Toggle animations */
    toggleAnimations: () => void;
    /** Toggle sound */
    toggleSound: () => void;
    /** Set the teacher PIN */
    setTeacherPin: (pin: string) => void;
    /** Enable/disable teacher PIN */
    setTeacherPinEnabled: (enabled: boolean) => void;
    /** Verify a PIN attempt */
    verifyPin: (pin: string) => boolean;
    /** Log out teacher */
    logoutTeacher: () => void;
    /** Reset settings to defaults */
    resetSettings: () => void;
}

// ============================================================================
// Default Settings
// ============================================================================

/**
 * Default application settings.
 */
const DEFAULT_SETTINGS: AppSettings = {
    locale: 'de',
    theme: 'default',
    fontSize: 'normal',
    highContrastMode: false,
    animationsEnabled: true,
    soundEnabled: true,
    teacherPin: '',
    teacherPinEnabled: false,
};

// ============================================================================
// Store
// ============================================================================

/**
 * Application settings store.
 * 
 * Persists settings to localStorage for persistence across sessions.
 */
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            teacherAuthenticated: false,

            setLocale: (locale) =>
                set((state) => ({
                    settings: { ...state.settings, locale },
                })),

            setTheme: (theme) =>
                set((state) => ({
                    settings: { ...state.settings, theme },
                })),

            setFontSize: (fontSize) =>
                set((state) => ({
                    settings: { ...state.settings, fontSize },
                })),

            toggleHighContrast: () =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        highContrastMode: !state.settings.highContrastMode,
                    },
                })),

            toggleAnimations: () =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        animationsEnabled: !state.settings.animationsEnabled,
                    },
                })),

            toggleSound: () =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        soundEnabled: !state.settings.soundEnabled,
                    },
                })),

            setTeacherPin: (pin) =>
                set((state) => ({
                    settings: { ...state.settings, teacherPin: pin },
                })),

            setTeacherPinEnabled: (enabled) =>
                set((state) => ({
                    settings: { ...state.settings, teacherPinEnabled: enabled },
                })),

            verifyPin: (pin) => {
                const stored = get().settings.teacherPin;
                if (!stored) return false;
                const ok = pin === stored;
                if (ok) set({ teacherAuthenticated: true });
                return ok;
            },

            logoutTeacher: () =>
                set({ teacherAuthenticated: false }),

            resetSettings: () =>
                set({ settings: DEFAULT_SETTINGS }),
        }),
        {
            name: 'mini-trainer-settings',
            version: 1,
            migrate: (persisted: unknown, version: number) => {
                const state = persisted as Partial<AppState>;

                // v0 → v1: Add any missing fields
                if (version === 0) {
                    return {
                        ...state,
                        settings: {
                            ...DEFAULT_SETTINGS,
                            ...state.settings,
                        },
                    };
                }

                return state;
            },
            merge: (persisted, current) => {
                const p = persisted as Partial<AppState>;
                return {
                    ...current,
                    settings: { ...DEFAULT_SETTINGS, ...p?.settings },
                    teacherAuthenticated: false, // Always start unauthenticated
                };
            },
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

/**
 * Selector for locale setting.
 */
export const selectLocale = (state: AppState) => state.settings.locale;

/**
 * Selector for theme setting.
 */
export const selectTheme = (state: AppState) => state.settings.theme;

/**
 * Selector for font size setting.
 */
export const selectFontSize = (state: AppState) => state.settings.fontSize;

/**
 * Selector for high contrast mode.
 */
export const selectHighContrast = (state: AppState) => state.settings.highContrastMode;

/**
 * Selector for animations enabled.
 */
export const selectAnimationsEnabled = (state: AppState) => state.settings.animationsEnabled;

/**
 * Selector for sound enabled.
 */
export const selectSoundEnabled = (state: AppState) => state.settings.soundEnabled;

/**
 * Selector for teacher authentication status.
 */
export const selectTeacherAuthenticated = (state: AppState) => state.teacherAuthenticated;
