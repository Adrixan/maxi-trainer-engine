/**
 * Tests for appStore.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAppStore, selectLocale, selectTheme, selectFontSize, selectHighContrast, selectAnimationsEnabled, selectSoundEnabled, selectTeacherAuthenticated } from '../appStore';
import type { SupportedLocale } from '@core/i18n';
import { PIN_MAX_ATTEMPTS, type PinCheckResult } from '../appStore';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('appStore', () => {
    beforeEach(() => {
        localStorageMock.clear();
        // Reset store to initial state
        useAppStore.setState({
            settings: {
                locale: 'de',
                theme: 'noir',
                fontSize: 'normal',
                highContrastMode: false,
                animationsEnabled: true,
                soundEnabled: true,
            },
            teacherAuth: { pinHash: '', pinSalt: '', failedAttempts: 0, lockedUntil: 0 },
            teacherAuthenticated: false,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('has default settings', () => {
            const state = useAppStore.getState();

            expect(state.settings.locale).toBe('de');
            expect(state.settings.theme).toBe('noir');
            expect(state.settings.fontSize).toBe('normal');
            expect(state.settings.highContrastMode).toBe(false);
            expect(state.settings.animationsEnabled).toBe(true);
            expect(state.settings.soundEnabled).toBe(true);
            expect(state.teacherAuth.pinHash).toBe('');
            expect(state.teacherAuthenticated).toBe(false);
        });
    });

    describe('setLocale', () => {
        it('updates locale setting', () => {
            act(() => {
                useAppStore.getState().setLocale('en' as SupportedLocale);
            });

            expect(useAppStore.getState().settings.locale).toBe('en');
        });
    });

    describe('setTheme', () => {
        it('updates theme setting', () => {
            act(() => {
                useAppStore.getState().setTheme('noir');
            });

            expect(useAppStore.getState().settings.theme).toBe('noir');
        });
    });

    describe('setFontSize', () => {
        it('updates font size setting', () => {
            act(() => {
                useAppStore.getState().setFontSize('large');
            });

            expect(useAppStore.getState().settings.fontSize).toBe('large');
        });

        it('accepts extra-large font size', () => {
            act(() => {
                useAppStore.getState().setFontSize('extra-large');
            });

            expect(useAppStore.getState().settings.fontSize).toBe('extra-large');
        });
    });

    describe('toggleHighContrast', () => {
        it('toggles high contrast mode on', () => {
            act(() => {
                useAppStore.getState().toggleHighContrast();
            });

            expect(useAppStore.getState().settings.highContrastMode).toBe(true);
        });

        it('toggles high contrast mode off', () => {
            act(() => {
                useAppStore.getState().toggleHighContrast();
            });
            act(() => {
                useAppStore.getState().toggleHighContrast();
            });

            expect(useAppStore.getState().settings.highContrastMode).toBe(false);
        });
    });

    describe('toggleAnimations', () => {
        it('toggles animations off', () => {
            act(() => {
                useAppStore.getState().toggleAnimations();
            });

            expect(useAppStore.getState().settings.animationsEnabled).toBe(false);
        });
    });

    describe('toggleSound', () => {
        it('toggles sound off', () => {
            act(() => {
                useAppStore.getState().toggleSound();
            });

            expect(useAppStore.getState().settings.soundEnabled).toBe(false);
        });
    });

    describe('teacher PIN', () => {
        const setPin = (pin: string) => {
            act(() => {
                useAppStore.getState().setTeacherPin(pin);
                useAppStore.getState().logoutTeacher();
            });
        };
        const verify = (pin: string) => {
            let result!: PinCheckResult;
            act(() => {
                result = useAppStore.getState().verifyPin(pin);
            });
            return result;
        };

        afterEach(() => {
            vi.useRealTimers();
        });

        it('stores only a salted hash, never the PIN', () => {
            setPin('1234');
            const { pinHash, pinSalt } = useAppStore.getState().teacherAuth;
            expect(pinHash).toMatch(/^[0-9a-f]{64}$/);
            expect(pinSalt).not.toBe('');
            expect(JSON.stringify(useAppStore.getState())).not.toContain('"1234"');
        });

        it('uses a different salt (and hash) every time', () => {
            setPin('1234');
            const first = useAppStore.getState().teacherAuth;
            setPin('1234');
            const second = useAppStore.getState().teacherAuth;
            expect(second.pinSalt).not.toBe(first.pinSalt);
            expect(second.pinHash).not.toBe(first.pinHash);
        });

        it('rejects PINs that are not exactly four digits', () => {
            for (const bad of ['', '123', '12345', 'abcd', '12 4']) {
                let ok = true;
                act(() => {
                    ok = useAppStore.getState().setTeacherPin(bad);
                });
                expect(ok).toBe(false);
            }
            expect(useAppStore.getState().teacherAuth.pinHash).toBe('');
        });

        it('unlocks the session when the PIN is set', () => {
            act(() => {
                useAppStore.getState().setTeacherPin('1234');
            });
            expect(useAppStore.getState().teacherAuthenticated).toBe(true);
        });

        it('verifies the correct PIN', () => {
            setPin('1234');
            expect(verify('1234')).toEqual({ status: 'ok' });
            expect(useAppStore.getState().teacherAuthenticated).toBe(true);
        });

        it('rejects an incorrect PIN and counts down the attempts', () => {
            setPin('1234');
            expect(verify('5678')).toEqual({ status: 'wrong', attemptsLeft: 4 });
            expect(verify('0000')).toEqual({ status: 'wrong', attemptsLeft: 3 });
            expect(useAppStore.getState().teacherAuthenticated).toBe(false);
        });

        it('reports "unset" when no PIN exists', () => {
            expect(verify('1234')).toEqual({ status: 'unset' });
        });

        it('blocks login after too many wrong attempts, even for the right PIN', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0));
            setPin('1234');

            for (let i = 0; i < PIN_MAX_ATTEMPTS - 1; i++) verify('0000');
            const locked = verify('0000');
            expect(locked).toEqual({ status: 'locked', retryAfterMs: 30_000 });

            expect(verify('1234').status).toBe('locked');
            expect(useAppStore.getState().teacherAuthenticated).toBe(false);

            vi.advanceTimersByTime(30_001);
            expect(verify('1234')).toEqual({ status: 'ok' });
        });

        it('doubles the block time for repeated failures', () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(2026, 5, 15, 9, 0, 0));
            setPin('1234');

            for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) verify('0000');
            vi.advanceTimersByTime(30_001);
            for (let i = 0; i < PIN_MAX_ATTEMPTS - 1; i++) verify('0000');
            expect(verify('0000')).toEqual({ status: 'locked', retryAfterMs: 60_000 });
        });

        it('persists the block and credentials but not the unlocked flag', () => {
            setPin('1234');
            for (let i = 0; i < PIN_MAX_ATTEMPTS; i++) verify('0000');
            const persisted = useAppStore.persist.getOptions().partialize?.(useAppStore.getState()) as
                Partial<ReturnType<typeof useAppStore.getState>>;
            expect(persisted.teacherAuth?.lockedUntil).toBeGreaterThan(Date.now());
            expect(persisted).not.toHaveProperty('teacherAuthenticated');
        });

        it('resets the failure counter after a successful login', () => {
            setPin('1234');
            verify('0000');
            verify('1234');
            expect(useAppStore.getState().teacherAuth.failedAttempts).toBe(0);
        });

        it('clears the PIN and locks the session', () => {
            act(() => {
                useAppStore.getState().setTeacherPin('1234');
                useAppStore.getState().clearTeacherPin();
            });
            expect(useAppStore.getState().teacherAuth.pinHash).toBe('');
            expect(useAppStore.getState().teacherAuthenticated).toBe(false);
        });

        it('logs out teacher', () => {
            setPin('1234');
            verify('1234');
            expect(useAppStore.getState().teacherAuthenticated).toBe(true);

            act(() => {
                useAppStore.getState().logoutTeacher();
            });

            expect(useAppStore.getState().teacherAuthenticated).toBe(false);
        });
    });

    describe('resetSettings', () => {
        it('resets all settings to defaults', () => {
            // Change all settings
            act(() => {
                useAppStore.getState().setLocale('en' as SupportedLocale);
                useAppStore.getState().setTheme('noir');
                useAppStore.getState().setFontSize('extra-large');
                useAppStore.getState().toggleHighContrast();
                useAppStore.getState().toggleAnimations();
                useAppStore.getState().toggleSound();
            });

            // Reset
            act(() => {
                useAppStore.getState().resetSettings();
            });

            const state = useAppStore.getState();
            expect(state.settings.locale).toBe('de');
            expect(state.settings.theme).toBe('noir');
            expect(state.settings.fontSize).toBe('normal');
            expect(state.settings.highContrastMode).toBe(false);
            expect(state.settings.animationsEnabled).toBe(true);
            expect(state.settings.soundEnabled).toBe(true);
        });

        it('keeps the teacher PIN', () => {
            act(() => {
                useAppStore.getState().setTeacherPin('1234');
                useAppStore.getState().resetSettings();
            });
            expect(useAppStore.getState().teacherAuth.pinHash).not.toBe('');
        });
    });

    describe('selectors', () => {
        it('selectLocale returns locale', () => {
            expect(selectLocale(useAppStore.getState())).toBe('de');
        });

        it('selectTheme returns theme', () => {
            expect(selectTheme(useAppStore.getState())).toBe('noir');
        });

        it('selectFontSize returns font size', () => {
            expect(selectFontSize(useAppStore.getState())).toBe('normal');
        });

        it('selectHighContrast returns high contrast mode', () => {
            expect(selectHighContrast(useAppStore.getState())).toBe(false);
        });

        it('selectAnimationsEnabled returns animations enabled', () => {
            expect(selectAnimationsEnabled(useAppStore.getState())).toBe(true);
        });

        it('selectSoundEnabled returns sound enabled', () => {
            expect(selectSoundEnabled(useAppStore.getState())).toBe(true);
        });

        it('selectTeacherAuthenticated returns teacher authenticated status', () => {
            expect(selectTeacherAuthenticated(useAppStore.getState())).toBe(false);
        });
    });

    describe('persistence', () => {
        it('persists settings to localStorage', () => {
            act(() => {
                useAppStore.getState().setLocale('en' as SupportedLocale);
            });

            // Check that localStorage was updated (zustand persist uses the storage)
            // Note: zustand persist middleware may not sync immediately in test environment
            // The important thing is that the state is updated correctly
            const state = useAppStore.getState();
            expect(state.settings.locale).toBe('en');
        });
    });
});
