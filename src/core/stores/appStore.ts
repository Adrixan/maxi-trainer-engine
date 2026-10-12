/**
 * Application settings store for the Mini Trainer Engine.
 * 
 * Manages global application settings like theme, language,
 * accessibility options, and teacher authentication.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLocale } from '@core/i18n';
import { adoptLegacyStore, getAppId, scopedStoreName } from '@core/appId';
import { randomHex, sha256HexSync } from '@core/utils/hash';

// ============================================================================
// Types
// ============================================================================

/**
 * Font size options for accessibility.
 */
export type FontSize = 'normal' | 'large' | 'extra-large';

/**
 * Available themes.
 */
export type Theme = 'default' | 'noir';

/**
 * Application settings interface.
 */
export interface AppSettings {
    /** Current locale */
    locale: SupportedLocale;
    /** Theme identifier */
    theme: Theme;
    /** Font size for accessibility */
    fontSize: FontSize;
    /** High contrast mode for visibility */
    highContrastMode: boolean;
    /** Whether animations are enabled */
    animationsEnabled: boolean;
    /** Whether sound effects are enabled */
    soundEnabled: boolean;
}

/**
 * Teacher PIN credentials and brute-force protection state.
 *
 * The PIN is a classroom convenience lock that keeps children out of the
 * teacher area; it is not a security boundary. Everything lives in the
 * browser, so anyone with access to the device can bypass it. Only a salted
 * hash is stored, never the PIN itself.
 */
export interface TeacherAuth {
    /** Salted SHA-256 of the PIN; empty when no PIN has been set */
    pinHash: string;
    pinSalt: string;
    /** Consecutive wrong attempts since the last success */
    failedAttempts: number;
    /** Epoch milliseconds until which login is blocked (0 = not blocked) */
    lockedUntil: number;
}

/** Outcome of a PIN verification attempt. */
export type PinCheckResult =
    | { status: 'ok' }
    | { status: 'unset' }
    | { status: 'wrong'; attemptsLeft: number }
    | { status: 'locked'; retryAfterMs: number };

/** PINs have exactly this shape. */
export const PIN_PATTERN = /^\d{4}$/;
/** Wrong attempts allowed before login is blocked for the first time. */
export const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_BASE_MS = 30_000;
const PIN_LOCK_MAX_MS = 15 * 60_000;

const EMPTY_TEACHER_AUTH: TeacherAuth = { pinHash: '', pinSalt: '', failedAttempts: 0, lockedUntil: 0 };

function hashPin(pin: string, salt: string): string {
    return sha256HexSync(`${salt}:${pin}`);
}

/** Compare two hex strings without bailing out at the first difference. */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

/** Block duration after `failedAttempts` consecutive failures (doubling, capped). */
function lockDuration(failedAttempts: number): number {
    const rounds = Math.floor(failedAttempts / PIN_MAX_ATTEMPTS);
    return Math.min(PIN_LOCK_BASE_MS * 2 ** (rounds - 1), PIN_LOCK_MAX_MS);
}

/**
 * Application state interface.
 */
export interface AppState {
    /** Current settings */
    settings: AppSettings;
    /** Teacher PIN credentials (persisted) */
    teacherAuth: TeacherAuth;
    /** Whether the teacher unlocked the dashboard in this session (never persisted) */
    teacherAuthenticated: boolean;

    // Actions
    /** Set the locale */
    setLocale: (locale: SupportedLocale) => void;
    /** Set the theme */
    setTheme: (theme: Theme) => void;
    /** Set the font size */
    setFontSize: (size: FontSize) => void;
    /** Toggle high contrast mode */
    toggleHighContrast: () => void;
    /** Toggle animations */
    toggleAnimations: () => void;
    /** Toggle sound */
    toggleSound: () => void;
    /** Set a new teacher PIN (4 digits) and unlock the session. Returns false for an invalid PIN. */
    setTeacherPin: (pin: string) => boolean;
    /** Remove the teacher PIN and lock the session */
    clearTeacherPin: () => void;
    /** Verify a PIN attempt; unlocks the session on success */
    verifyPin: (pin: string) => PinCheckResult;
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
    theme: 'noir',
    fontSize: 'normal',
    highContrastMode: false,
    animationsEnabled: true,
    soundEnabled: true,
};

// ============================================================================
// Store
// ============================================================================

/** Name of the persisted store (scoped per app, see appId.ts). */
const SETTINGS_STORE_BASE = 'mini-trainer-settings';
adoptLegacyStore(SETTINGS_STORE_BASE);

/**
 * Application settings store.
 * 
 * Persists settings to localStorage for persistence across sessions.
 */
export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            settings: DEFAULT_SETTINGS,
            teacherAuth: EMPTY_TEACHER_AUTH,
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

            setTeacherPin: (pin) => {
                if (!PIN_PATTERN.test(pin)) return false;
                const pinSalt = randomHex();
                set({
                    teacherAuth: { pinHash: hashPin(pin, pinSalt), pinSalt, failedAttempts: 0, lockedUntil: 0 },
                    teacherAuthenticated: true,
                });
                return true;
            },

            clearTeacherPin: () =>
                set({ teacherAuth: EMPTY_TEACHER_AUTH, teacherAuthenticated: false }),

            verifyPin: (pin) => {
                const auth = get().teacherAuth;
                if (!auth.pinHash) return { status: 'unset' };

                const now = Date.now();
                if (auth.lockedUntil > now) {
                    return { status: 'locked', retryAfterMs: auth.lockedUntil - now };
                }

                if (constantTimeEqual(hashPin(pin, auth.pinSalt), auth.pinHash)) {
                    set({ teacherAuth: { ...auth, failedAttempts: 0, lockedUntil: 0 }, teacherAuthenticated: true });
                    return { status: 'ok' };
                }

                const failedAttempts = auth.failedAttempts + 1;
                if (failedAttempts % PIN_MAX_ATTEMPTS === 0) {
                    const duration = lockDuration(failedAttempts);
                    set({ teacherAuth: { ...auth, failedAttempts, lockedUntil: now + duration } });
                    return { status: 'locked', retryAfterMs: duration };
                }
                set({ teacherAuth: { ...auth, failedAttempts } });
                return { status: 'wrong', attemptsLeft: PIN_MAX_ATTEMPTS - (failedAttempts % PIN_MAX_ATTEMPTS) };
            },

            logoutTeacher: () =>
                set({ teacherAuthenticated: false }),

            resetSettings: () =>
                set({ settings: DEFAULT_SETTINGS }),
        }),
        {
            name: scopedStoreName(SETTINGS_STORE_BASE),
            version: 2,
            // Only settings and PIN credentials are stored; the unlocked flag is per session.
            partialize: (state) => ({ settings: state.settings, teacherAuth: state.teacherAuth }),
            merge: (persisted, current) => {
                const p = (persisted ?? {}) as {
                    settings?: Partial<AppSettings> & { teacherPin?: unknown; teacherPinEnabled?: unknown };
                    teacherAuth?: Partial<TeacherAuth>;
                };
                // Versions before 2 kept the PIN in plain text inside the settings.
                const { teacherPin: legacyPin, teacherPinEnabled: _legacyEnabled, ...settings } = p.settings ?? {};
                void _legacyEnabled;

                let teacherAuth: TeacherAuth = { ...EMPTY_TEACHER_AUTH, ...p.teacherAuth };
                if (!teacherAuth.pinHash && typeof legacyPin === 'string' && PIN_PATTERN.test(legacyPin)) {
                    const pinSalt = randomHex();
                    teacherAuth = { ...EMPTY_TEACHER_AUTH, pinHash: hashPin(legacyPin, pinSalt), pinSalt };
                }

                return {
                    ...current,
                    settings: { ...DEFAULT_SETTINGS, ...settings },
                    teacherAuth,
                    teacherAuthenticated: false, // Always start locked
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
 * Selector for whether a teacher PIN has been set.
 */
export const selectHasTeacherPin = (state: AppState) => state.teacherAuth.pinHash !== '';

/**
 * Selector for teacher authentication status.
 */
export const selectTeacherAuthenticated = (state: AppState) => state.teacherAuthenticated;

// ============================================================================
// Legacy PIN migration
// ============================================================================

/**
 * Earlier versions of the teacher PIN page stored the PIN in plain text under
 * `mte:<appId>:app:teacherPin`. Hash it into the store and delete the old entry.
 */
function migrateLegacyTeacherPin(): void {
    try {
        const key = `mte:${getAppId()}:app:teacherPin`;
        const raw = localStorage.getItem(key);
        if (raw === null) return;
        localStorage.removeItem(key);
        localStorage.removeItem(`mte:${getAppId()}:app:teacherPinEnabled`);

        const legacyPin = (JSON.parse(raw) as { value?: unknown }).value;
        const { teacherAuth } = useAppStore.getState();
        if (!teacherAuth.pinHash && typeof legacyPin === 'string' && PIN_PATTERN.test(legacyPin)) {
            const pinSalt = randomHex();
            useAppStore.setState({ teacherAuth: { ...EMPTY_TEACHER_AUTH, pinHash: hashPin(legacyPin, pinSalt), pinSalt } });
        }
    } catch {
        // Unreadable legacy data: the teacher simply sets a new PIN.
    }
}

migrateLegacyTeacherPin();
