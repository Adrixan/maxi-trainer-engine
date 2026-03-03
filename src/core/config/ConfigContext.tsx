/**
 * Configuration context for the Mini Trainer Engine.
 * 
 * Provides React context for accessing trainer configuration
 * throughout the application with loading and error states.
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
    type ReactNode,
} from 'react';
import type {
    TrainerConfig,
    SubjectConfig,
    ObservationArea,
    Theme,
    BadgeDefinition,
    GamificationConfig,
    AccessibilityDefaults,
    Exercise,
} from '@/types';
import {
    loadGamificationConfig,
    loadConfigSafe,
    loadExercises,
    loadAppConfig,
    type AppConfig,
} from './loader';

// ============================================================================
// Context Types
// ============================================================================

/**
 * Configuration context state.
 */
export interface ConfigContextState {
    /** Whether configuration is currently loading */
    isLoading: boolean;
    /** Whether configuration has been loaded */
    isLoaded: boolean;
    /** Error message if configuration failed to load */
    error: string | null;
    /** The full trainer configuration */
    config: TrainerConfig | null;
    /** All exercises */
    exercises: Exercise[];
}

/**
 * Configuration context value.
 */
export interface ConfigContextValue extends ConfigContextState {
    /** Get the subject configuration */
    getSubject: () => SubjectConfig | null;
    /** Get all observation areas */
    getAreas: () => ObservationArea[];
    /** Get a specific observation area by ID */
    getArea: (id: string) => ObservationArea | undefined;
    /** Get all themes */
    getThemes: () => Theme[];
    /** Get a specific theme by ID */
    getTheme: (id: string) => Theme | undefined;
    /** Get all badge definitions */
    getBadges: () => BadgeDefinition[];
    /** Get gamification configuration */
    getGamification: () => GamificationConfig;
    /** Get accessibility defaults */
    getAccessibilityDefaults: () => AccessibilityDefaults;
    /** Get all exercises */
    getExercises: () => Exercise[];
    /** Get exercises filtered by theme */
    getExercisesByTheme: (themeId: string) => Exercise[];
    /** Get exercises filtered by area */
    getExercisesByArea: (areaId: string) => Exercise[];
    /** Reload configuration */
    reload: () => Promise<void>;
}

// ============================================================================
// Context Creation
// ============================================================================

const ConfigContext = createContext<ConfigContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface ConfigProviderProps {
    /** Child components */
    children: ReactNode;
    /** Whether to load configuration on mount */
    loadOnMount?: boolean;
    /** Callback when configuration is loaded */
    onConfigLoaded?: (config: TrainerConfig) => void;
    /** Callback when configuration fails to load */
    onConfigError?: (error: string) => void;
}

/**
 * Configuration provider component.
 * Loads configuration on mount and provides it to child components.
 * 
 * @example
 * ```tsx
 * <ConfigProvider>
 *   <App />
 * </ConfigProvider>
 * ```
 */
export function ConfigProvider({
    children,
    loadOnMount = true,
    onConfigLoaded,
    onConfigError,
}: ConfigProviderProps) {
    const [state, setState] = useState<ConfigContextState>({
        isLoading: loadOnMount,
        isLoaded: false,
        error: null,
        config: null,
        exercises: [],
    });

    /**
     * Load configuration from files.
     */
    const loadConfig = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Use async loading for dynamic app-specific config
            const result = await loadConfigSafe();

            if (!result.success || !result.config) {
                const errorMessage = result.errors
                    .map((e) => `${e.file}: ${e.message}`)
                    .join('\n');

                setState({
                    isLoading: false,
                    isLoaded: false,
                    error: errorMessage,
                    config: null,
                    exercises: [],
                });

                onConfigError?.(errorMessage);
                return;
            }

            // Exercises are already loaded in the config result via loadFullConfig
            const exercises = result.config ? loadExercises() : [];

            setState({
                isLoading: false,
                isLoaded: true,
                error: null,
                config: result.config,
                exercises,
            });

            onConfigLoaded?.(result.config);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);

            setState({
                isLoading: false,
                isLoaded: false,
                error: errorMessage,
                config: null,
                exercises: [],
            });

            onConfigError?.(errorMessage);
        }
    }, [onConfigLoaded, onConfigError]);

    /**
     * Reload configuration.
     */
    const reload = useCallback(async () => {
        await loadConfig();
    }, [loadConfig]);

    // Load configuration on mount
    useEffect(() => {
        if (loadOnMount) {
            loadConfig();
        }
    }, [loadOnMount, loadConfig]);

    // Memoized accessor functions
    const getSubject = useCallback((): SubjectConfig | null => {
        return state.config?.subject ?? null;
    }, [state.config]);

    const getAreas = useCallback((): ObservationArea[] => {
        return state.config?.observationAreas ?? [];
    }, [state.config]);

    const getArea = useCallback((id: string): ObservationArea | undefined => {
        return state.config?.observationAreas.find((area) => area.id === id);
    }, [state.config]);

    const getThemes = useCallback((): Theme[] => {
        return state.config?.themes ?? [];
    }, [state.config]);

    const getTheme = useCallback((id: string): Theme | undefined => {
        return state.config?.themes.find((theme) => theme.id === id);
    }, [state.config]);

    const getBadges = useCallback((): BadgeDefinition[] => {
        return state.config?.badges ?? [];
    }, [state.config]);

    const getGamification = useCallback((): GamificationConfig => {
        return state.config?.gamification ?? loadGamificationConfig();
    }, [state.config]);

    const getAccessibilityDefaults = useCallback((): AccessibilityDefaults => {
        return state.config?.accessibility ?? {
            defaultFontSize: 'normal',
            defaultHighContrast: false,
            defaultAnimationsEnabled: true,
            defaultSoundEnabled: true,
        };
    }, [state.config]);

    const getExercises = useCallback((): Exercise[] => {
        return state.exercises;
    }, [state.exercises]);

    const getExercisesByTheme = useCallback((themeId: string): Exercise[] => {
        return state.exercises.filter((exercise) => exercise.themeId === themeId);
    }, [state.exercises]);

    const getExercisesByArea = useCallback((areaId: string): Exercise[] => {
        return state.exercises.filter((exercise) => exercise.areaId === areaId);
    }, [state.exercises]);

    // Memoized context value
    const value = useMemo<ConfigContextValue>(() => ({
        ...state,
        getSubject,
        getAreas,
        getArea,
        getThemes,
        getTheme,
        getBadges,
        getGamification,
        getAccessibilityDefaults,
        getExercises,
        getExercisesByTheme,
        getExercisesByArea,
        reload,
    }), [
        state,
        getSubject,
        getAreas,
        getArea,
        getThemes,
        getTheme,
        getBadges,
        getGamification,
        getAccessibilityDefaults,
        getExercises,
        getExercisesByTheme,
        getExercisesByArea,
        reload,
    ]);

    return (
        <ConfigContext.Provider value={value}>
            {children}
        </ConfigContext.Provider>
    );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the configuration context.
 * 
 * @returns Configuration context value
 * @throws Error if used outside of ConfigProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config, isLoading, error } = useConfig();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   
 *   return <div>{config?.name}</div>;
 * }
 * ```
 */
export function useConfig(): ConfigContextValue {
    const context = useContext(ConfigContext);

    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }

    return context;
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * Hook to get the subject configuration.
 * 
 * @returns Subject configuration or null if not loaded
 */
export function useSubject(): SubjectConfig | null {
    const { getSubject } = useConfig();
    return getSubject();
}

/**
 * Hook to get all observation areas.
 * 
 * @returns Array of observation areas
 */
export function useAreas(): ObservationArea[] {
    const { getAreas } = useConfig();
    return getAreas();
}

/**
 * Hook to get a specific observation area.
 * 
 * @param id - Area ID
 * @returns Observation area or undefined
 */
export function useArea(id: string): ObservationArea | undefined {
    const { getArea } = useConfig();
    return getArea(id);
}

/**
 * Hook to get all themes.
 * 
 * @returns Array of themes
 */
export function useThemes(): Theme[] {
    const { getThemes } = useConfig();
    return getThemes();
}

/**
 * Hook to get a specific theme.
 * 
 * @param id - Theme ID
 * @returns Theme or undefined
 */
export function useTheme(id: string): Theme | undefined {
    const { getTheme } = useConfig();
    return getTheme(id);
}

/**
 * Hook to get all badge definitions.
 * 
 * @returns Array of badge definitions
 */
export function useBadges(): BadgeDefinition[] {
    const { getBadges } = useConfig();
    return getBadges();
}

/**
 * Hook to get gamification configuration.
 * 
 * @returns Gamification configuration
 */
export function useGamification(): GamificationConfig {
    const { getGamification } = useConfig();
    return getGamification();
}

/**
 * Hook to get accessibility defaults.
 * 
 * @returns Accessibility defaults
 */
export function useAccessibilityDefaults(): AccessibilityDefaults {
    const { getAccessibilityDefaults } = useConfig();
    return getAccessibilityDefaults();
}

/**
 * Hook to get all exercises.
 * 
 * @returns Array of exercises
 */
export function useExercises(): Exercise[] {
    const { getExercises } = useConfig();
    return getExercises();
}

/**
 * Hook to get exercises filtered by theme.
 * 
 * @param themeId - Theme ID to filter by
 * @returns Array of exercises for the theme
 */
export function useExercisesByTheme(themeId: string): Exercise[] {
    const { getExercisesByTheme, exercises } = useConfig();
    return useMemo(
        () => getExercisesByTheme(themeId),
        [getExercisesByTheme, themeId, exercises]
    );
}

/**
 * Hook to get exercises filtered by area.
 * 
 * @param areaId - Area ID to filter by
 * @returns Array of exercises for the area
 */
export function useExercisesByArea(areaId: string): Exercise[] {
    const { getExercisesByArea, exercises } = useConfig();
    return useMemo(
        () => getExercisesByArea(areaId),
        [getExercisesByArea, areaId, exercises]
    );
}

/**
 * Hook to get app-specific configuration (from app.json).
 * Includes primary color and app terminology.
 *
 * @returns App configuration with primaryColor and terminology
 */
export function useAppConfig(): AppConfig {
    const [appConfig, setAppConfig] = useState<AppConfig | null>(null);

    useEffect(() => {
        loadAppConfig().then(setAppConfig);
    }, []);

    // Return default config while loading or if load fails
    const defaultConfig: AppConfig = {
        id: 'daz',
        name: 'Mini Trainer',
        version: '1.0.0',
        build: { pwaEnabled: true, usbDistribution: true },
        display: { primaryColor: '#3b82f6', icon: '/icon.svg' },
        terminology: {
            level: 'Level',
            levelPlural: 'Level',
            theme: 'Theme',
            themePlural: 'Themes',
            exercise: 'Exercise',
            exercisePlural: 'Exercises',
        },
    };

    return appConfig ?? defaultConfig;
}
