/**
 * Accessibility Hook.
 * 
 * Combines all accessibility features into a single hook:
 * - Syncs with app store settings
 * - Provides announce function for screen readers
 * - Manages focus
 * - Detects system accessibility preferences
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore, type FontSize } from '@core/stores';
import { announceToScreenReader } from '@core/utils/accessibility';

/**
 * System accessibility preferences detected from media queries.
 */
interface SystemPreferences {
    /** User prefers reduced motion */
    prefersReducedMotion: boolean;
    /** User prefers high contrast */
    prefersHighContrast: boolean;
    /** User prefers more data (less motion/animations) */
    prefersDataSaver: boolean;
}

/**
 * Get system accessibility preferences from media queries.
 */
function getSystemPreferences(): SystemPreferences {
    if (typeof window === 'undefined') {
        return {
            prefersReducedMotion: false,
            prefersHighContrast: false,
            prefersDataSaver: false,
        };
    }

    return {
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
        prefersDataSaver: window.matchMedia('(prefers-reduced-data: reduce)').matches,
    };
}

/**
 * Return type for useAccessibility hook.
 */
interface UseAccessibilityReturn {
    /** Current font size setting */
    fontSize: FontSize;
    /** Whether high contrast mode is enabled */
    highContrastMode: boolean;
    /** Whether animations are enabled */
    animationsEnabled: boolean;
    /** Whether sound is enabled */
    soundEnabled: boolean;
    /** System accessibility preferences */
    systemPreferences: SystemPreferences;
    /** Announce a message to screen readers */
    announce: (message: string, priority?: 'polite' | 'assertive') => void;
    /** Toggle high contrast mode */
    toggleHighContrast: () => void;
    /** Toggle animations */
    toggleAnimations: () => void;
    /** Toggle sound */
    toggleSound: () => void;
    /** Set font size */
    setFontSize: (size: FontSize) => void;
    /** Focus an element by selector or ref */
    focusElement: (target: string | HTMLElement) => boolean;
}

/**
 * Hook for managing accessibility features.
 * 
 * Provides a unified interface for accessibility settings, announcements,
 * and focus management. Syncs with the app store and respects system
 * preferences.
 * 
 * @example
 * ```tsx
 * const {
 *   fontSize,
 *   highContrastMode,
 *   announce,
 *   systemPreferences,
 * } = useAccessibility();
 * 
 * // Announce score update
 * announce(`Score: ${score} points`);
 * 
 * // Check if animations should be shown
 * const showAnimation = animationsEnabled && !systemPreferences.prefersReducedMotion;
 * ```
 */
export function useAccessibility(): UseAccessibilityReturn {
    const settings = useAppStore((s) => s.settings);
    const {
        toggleHighContrast,
        toggleAnimations,
        toggleSound,
        setFontSize,
    } = useAppStore();

    const systemPreferencesRef = useRef<SystemPreferences>(getSystemPreferences());

    // Update system preferences on mount and when media queries change
    useEffect(() => {
        const updatePreferences = () => {
            systemPreferencesRef.current = getSystemPreferences();
        };

        // Set up listeners for media query changes
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
        const dataSaverQuery = window.matchMedia('(prefers-reduced-data: reduce)');

        reducedMotionQuery.addEventListener('change', updatePreferences);
        highContrastQuery.addEventListener('change', updatePreferences);
        dataSaverQuery.addEventListener('change', updatePreferences);

        return () => {
            reducedMotionQuery.removeEventListener('change', updatePreferences);
            highContrastQuery.removeEventListener('change', updatePreferences);
            dataSaverQuery.removeEventListener('change', updatePreferences);
        };
    }, []);

    // Announce message to screen readers
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        announceToScreenReader(message, priority);
    }, []);

    // Focus an element
    const focusElement = useCallback((target: string | HTMLElement): boolean => {
        const element = typeof target === 'string'
            ? document.querySelector<HTMLElement>(target)
            : target;

        if (element && typeof element.focus === 'function') {
            element.focus();
            return true;
        }
        return false;
    }, []);

    return {
        fontSize: settings.fontSize,
        highContrastMode: settings.highContrastMode,
        animationsEnabled: settings.animationsEnabled,
        soundEnabled: settings.soundEnabled,
        systemPreferences: systemPreferencesRef.current,
        announce,
        toggleHighContrast,
        toggleAnimations,
        toggleSound,
        setFontSize,
        focusElement,
    };
}

/**
 * Hook for detecting if reduced motion is preferred.
 * 
 * Combines user setting with system preference.
 * 
 * @returns True if reduced motion should be used
 */
export function usePrefersReducedMotion(): boolean {
    const animationsEnabled = useAppStore((s) => s.settings.animationsEnabled);
    const prefersReducedMotionRef = useRef(
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
            : false
    );

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = () => {
            prefersReducedMotionRef.current = query.matches;
        };

        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
    }, []);

    return !animationsEnabled || prefersReducedMotionRef.current;
}

/**
 * Hook for detecting if high contrast is preferred.
 * 
 * Combines user setting with system preference.
 * 
 * @returns True if high contrast should be used
 */
export function usePrefersHighContrast(): boolean {
    const highContrastMode = useAppStore((s) => s.settings.highContrastMode);
    const prefersHighContrastRef = useRef(
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-contrast: more)').matches
            : false
    );

    useEffect(() => {
        const query = window.matchMedia('(prefers-contrast: more)');
        const handler = () => {
            prefersHighContrastRef.current = query.matches;
        };

        query.addEventListener('change', handler);
        return () => query.removeEventListener('change', handler);
    }, []);

    return highContrastMode || prefersHighContrastRef.current;
}

export type { UseAccessibilityReturn, SystemPreferences };
export default useAccessibility;
