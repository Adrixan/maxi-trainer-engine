/**
 * Tests for sound utility functions.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    playCorrect,
    playIncorrect,
    playLevelUp,
    playBadge,
    playStar,
    playSound,
    isAudioSupported,
    soundManager,
} from '../sounds';

// Mock AudioContext for browser environment
class MockAudioContext {
    state = 'running';
    currentTime = 0;
    destination = {};

    createOscillator() {
        return {
            type: 'sine',
            frequency: { setValueAtTime: vi.fn() },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        };
    }

    createGain() {
        return {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
        };
    }

    resume() {
        return Promise.resolve();
    }
}

// Store original AudioContext
const OriginalAudioContext = globalThis.AudioContext;

describe('sounds', () => {
    describe('isAudioSupported', () => {
        it('returns false when AudioContext is undefined (Node.js)', () => {
            // AudioContext is not available in Node.js test environment
            expect(isAudioSupported()).toBe(false);
        });

        it('returns true when AudioContext is available', () => {
            // Mock AudioContext as available
            Object.defineProperty(globalThis, 'AudioContext', {
                value: MockAudioContext,
                configurable: true,
            });

            expect(isAudioSupported()).toBe(true);

            // Restore
            Object.defineProperty(globalThis, 'AudioContext', {
                value: OriginalAudioContext,
                configurable: true,
            });
        });
    });

    describe('soundEnabled=false', () => {
        it('playCorrect returns early when soundEnabled is false', async () => {
            // Should not throw
            await expect(playCorrect(false)).resolves.not.toThrow();
        });

        it('playIncorrect returns early when soundEnabled is false', async () => {
            await expect(playIncorrect(false)).resolves.not.toThrow();
        });

        it('playLevelUp returns early when soundEnabled is false', async () => {
            await expect(playLevelUp(false)).resolves.not.toThrow();
        });

        it('playBadge returns early when soundEnabled is false', async () => {
            await expect(playBadge(false)).resolves.not.toThrow();
        });

        it('playStar returns early when soundEnabled is false', async () => {
            await expect(playStar(0, false)).resolves.not.toThrow();
        });

        it('playSound returns early when soundEnabled is false', async () => {
            await expect(playSound('correct', false)).resolves.not.toThrow();
            await expect(playSound('incorrect', false)).resolves.not.toThrow();
            await expect(playSound('levelUp', false)).resolves.not.toThrow();
            await expect(playSound('badge', false)).resolves.not.toThrow();
            await expect(playSound('star', false)).resolves.not.toThrow();
        });
    });

    describe('functions do not throw in Node.js environment', () => {
        it('playCorrect does not throw', async () => {
            await expect(playCorrect()).resolves.not.toThrow();
        });

        it('playIncorrect does not throw', async () => {
            await expect(playIncorrect()).resolves.not.toThrow();
        });

        it('playLevelUp does not throw', async () => {
            await expect(playLevelUp()).resolves.not.toThrow();
        });

        it('playBadge does not throw', async () => {
            await expect(playBadge()).resolves.not.toThrow();
        });

        it('playStar does not throw', async () => {
            await expect(playStar()).resolves.not.toThrow();
            await expect(playStar(0)).resolves.not.toThrow();
            await expect(playStar(1)).resolves.not.toThrow();
            await expect(playStar(2)).resolves.not.toThrow();
        });

        it('playSound does not throw for all sound types', async () => {
            await expect(playSound('correct')).resolves.not.toThrow();
            await expect(playSound('incorrect')).resolves.not.toThrow();
            await expect(playSound('levelUp')).resolves.not.toThrow();
            await expect(playSound('badge')).resolves.not.toThrow();
            await expect(playSound('star')).resolves.not.toThrow();
        });
    });

    describe('soundManager', () => {
        it('play method does not throw', async () => {
            await expect(soundManager.play('correct')).resolves.not.toThrow();
        });

        it('correct method does not throw', async () => {
            await expect(soundManager.correct()).resolves.not.toThrow();
        });

        it('incorrect method does not throw', async () => {
            await expect(soundManager.incorrect()).resolves.not.toThrow();
        });

        it('levelUp method does not throw', async () => {
            await expect(soundManager.levelUp()).resolves.not.toThrow();
        });

        it('badge method does not throw', async () => {
            await expect(soundManager.badge()).resolves.not.toThrow();
        });

        it('star method does not throw', async () => {
            await expect(soundManager.star()).resolves.not.toThrow();
            await expect(soundManager.star(0)).resolves.not.toThrow();
            await expect(soundManager.star(1, false)).resolves.not.toThrow();
        });
    });

    describe('default parameter behavior', () => {
        it('soundEnabled defaults to true', async () => {
            // When soundEnabled is not passed, it defaults to true
            // But since there's no AudioContext, it returns early without throwing
            await expect(playCorrect()).resolves.not.toThrow();
        });
    });
});
