/**
 * Sound effects hook for centralized audio feedback.
 * 
 * ⚠️ NOTE: This hook exists but is NOT currently used by useExercisePageState.
 * The exercise page currently imports sound functions directly from @core/utils/sounds.
 * 
 * Provides easy access to game sound effects with lazy loading.
 * Wraps sound functions from @core/utils/sounds.
 * 
 * TODO: Integrate this hook into useExercisePageState to centralize sound handling.
 */

import { useCallback, useState } from 'react';
import { playCorrect, playIncorrect, playLevelUp, playBadge, playStar, isAudioSupported } from '@core/utils/sounds';
import { useAppStore } from '@core/stores/appStore';

// ============================================================================
// Types
// ============================================================================

/**
 * Return type of the useSoundEffects hook.
 */
export interface UseSoundEffectsReturn {
    /** Play correct answer sound */
    playCorrect: () => void;
    /** Play incorrect answer sound */
    playIncorrect: () => void;
    /** Play level up/achievement sound */
    playSuccess: () => void;
    /** Play error sound */
    playError: () => void;
    /** Play badge earned sound */
    playBadge: () => void;
    /** Play star earned sound */
    playStar: (index?: number) => void;
    /** Whether audio is supported in this environment */
    isSupported: boolean;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for playing sound effects.
 * 
 * Provides centralized access to game sound effects with automatic
 * handling of the sound enabled setting from the app store.
 * 
 * @example
 * ```tsx
 * const { playCorrect, playIncorrect } = useSoundEffects();
 * 
 * // On correct answer
 * playCorrect();
 * 
 * // On incorrect answer
 * playIncorrect();
 * ```
 */
export function useSoundEffects(): UseSoundEffectsReturn {
    const soundEnabled = useAppStore((state) => state.settings?.soundEnabled ?? true);
    const [isSupported] = useState(() => isAudioSupported());

    const playCorrectSound = useCallback(() => {
        playCorrect(soundEnabled);
    }, [soundEnabled]);

    const playIncorrectSound = useCallback(() => {
        playIncorrect(soundEnabled);
    }, [soundEnabled]);

    const playSuccessSound = useCallback(() => {
        // playSuccess maps to playLevelUp (celebration/achievement sound)
        playLevelUp(soundEnabled);
    }, [soundEnabled]);

    const playErrorSound = useCallback(() => {
        // playError maps to playIncorrect (error feedback)
        playIncorrect(soundEnabled);
    }, [soundEnabled]);

    const playBadgeSound = useCallback(() => {
        playBadge(soundEnabled);
    }, [soundEnabled]);

    const playStarSound = useCallback((index: number = 0) => {
        playStar(index, soundEnabled);
    }, [soundEnabled]);

    return {
        playCorrect: playCorrectSound,
        playIncorrect: playIncorrectSound,
        playSuccess: playSuccessSound,
        playError: playErrorSound,
        playBadge: playBadgeSound,
        playStar: playStarSound,
        isSupported,
    };
}

// ============================================================================
// Default Export
// ============================================================================

export default useSoundEffects;
