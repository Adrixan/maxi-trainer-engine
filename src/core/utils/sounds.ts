/**
 * Sound effects utility using Web Audio API.
 * 
 * Provides game sound effects without external audio files.
 * Works offline and is compatible with file:// protocol.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Sound effect types available.
 */
export type SoundType =
    | 'correct'
    | 'incorrect'
    | 'levelUp'
    | 'badge'
    | 'star';

// ============================================================================
// Audio Context
// ============================================================================

/**
 * Global audio context singleton.
 */
let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context.
 * Returns null if AudioContext is not available (e.g., in test environments).
 */
function getAudioContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') {
        return null;
    }
    if (!audioContext) {
        audioContext = new AudioContext();
    }
    return audioContext;
}

/**
 * Resume audio context if suspended (required for some browsers).
 * Returns early if audio context is not available.
 */
async function resumeAudioContext(): Promise<void> {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
        await ctx.resume();
    }
}

// ============================================================================
// Sound Generators
// ============================================================================

/**
 * Play a frequency with optional duration and type.
 * Returns early if audio context is not available.
 */
function playTone(
    frequency: number,
    duration: number = 0.1,
    type: OscillatorType = 'sine',
    volume: number = 0.3
): void {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

/**
 * Play correct answer sound (ascending chime C5 -> E5 -> G5).
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playCorrect(soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    await resumeAudioContext();

    // C5 -> E5 -> G5 arpeggio
    const notes = [523.25, 659.25, 783.99];

    notes.forEach((freq, i) => {
        setTimeout(() => {
            playTone(freq, 0.15, 'sine', 0.25);
        }, i * 80);
    });
}

/**
 * Play incorrect answer sound (low buzz).
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playIncorrect(soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    await resumeAudioContext();

    // Descending buzz
    const notes = [220, 207.65]; // A3 -> G#3

    notes.forEach((freq, i) => {
        setTimeout(() => {
            playTone(freq, 0.2, 'sawtooth', 0.15);
        }, i * 100);
    });
}

/**
 * Play level up celebration sound.
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playLevelUp(soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    await resumeAudioContext();

    // Celebratory ascending scale
    const scale = [
        523.25,  // C5
        587.33,  // D5
        659.25,  // E5
        698.46,  // F5
        783.99,  // G5
        880.00,  // A5
        987.77,  // B5
        1046.50, // C6
    ];

    scale.forEach((freq, i) => {
        setTimeout(() => {
            playTone(freq, 0.12, 'sine', 0.2);
        }, i * 60);
    });
}

/**
 * Play badge earned sound (sparkle).
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playBadge(soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    await resumeAudioContext();

    // Sparkle pattern
    const sparkles = [
        { freq: 1046.50, delay: 0 },
        { freq: 1318.51, delay: 80 },
        { freq: 1567.98, delay: 160 },
        { freq: 2093.00, delay: 240 },
    ];

    sparkles.forEach(({ freq, delay }) => {
        setTimeout(() => {
            playTone(freq, 0.1, 'sine', 0.2);
        }, delay);
    });
}

/**
 * Play star earned sound (twinkle).
 * @param index - Index of the star (0-2) to vary pitch
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playStar(index: number = 0, soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    await resumeAudioContext();

    // Pitch varies by index (lower for more stars)
    const basePitch = 880 - (index * 50); // A5, F5, E5 roughly

    // Quick double twinkle
    playTone(basePitch, 0.08, 'sine', 0.2);
    setTimeout(() => {
        playTone(basePitch * 1.25, 0.12, 'sine', 0.2); // Fifth up
    }, 50);
}

// ============================================================================
// Main Play Function
// ============================================================================

/**
 * Play a sound effect by type.
 * @param type - Type of sound to play
 * @param soundEnabled - Whether sound is enabled (optional, defaults to true)
 */
export async function playSound(type: SoundType, soundEnabled: boolean = true): Promise<void> {
    if (!soundEnabled) return;
    switch (type) {
        case 'correct':
            await playCorrect();
            break;
        case 'incorrect':
            await playIncorrect();
            break;
        case 'levelUp':
            await playLevelUp();
            break;
        case 'badge':
            await playBadge();
            break;
        case 'star':
            await playStar();
            break;
    }
}

/**
 * Check if audio is supported in this environment.
 */
export function isAudioSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext !== 'undefined';
}

// ============================================================================
// Type Aliases for Compatibility
// ============================================================================

/**
 * Sound effect type alias for compatibility.
 */
export type SoundEffect = SoundType;

/**
 * Sound manager interface for compatibility.
 */
export interface SoundManager {
    play: (type: SoundType, soundEnabled?: boolean) => Promise<void>;
    correct: (soundEnabled?: boolean) => Promise<void>;
    incorrect: (soundEnabled?: boolean) => Promise<void>;
    levelUp: (soundEnabled?: boolean) => Promise<void>;
    badge: (soundEnabled?: boolean) => Promise<void>;
    star: (index?: number, soundEnabled?: boolean) => Promise<void>;
}

/**
 * Sound manager singleton instance.
 */
export const soundManager: SoundManager = {
    play: playSound,
    correct: playCorrect,
    incorrect: playIncorrect,
    levelUp: playLevelUp,
    badge: playBadge,
    star: playStar,
};

// ============================================================================
// Default Export
// ============================================================================

export default {
    playCorrect,
    playIncorrect,
    playLevelUp,
    playBadge,
    playStar,
    playSound,
    isAudioSupported,
};
