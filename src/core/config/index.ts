/**
 * Configuration module for the Mini Trainer Engine.
 * 
 * Exports all configuration utilities, types, and components.
 */

// Configuration loader
export {
    loadSubjectConfig,
    loadAreas,
    loadThemes,
    loadBadges,
    loadGamificationConfig,
    loadFullConfig,
    loadConfigSafe,
    loadExercises,
    loadFullConfigSync,
    resetConfigCache,
    getCurrentAppId,
    loadAppConfig,
    type ConfigLoadResult,
    type AppConfig,
} from './loader';

// Configuration validation
export {
    validateSubjectConfig,
    validateAreas,
    validateThemes,
    validateBadges,
    validateTrainerConfig,
    validateExercises,
    validateExercise,
} from './validation';

// Configuration context
export {
    ConfigProvider,
    useConfig,
    useSubject,
    useAreas,
    useArea,
    useThemes,
    useTheme,
    useBadges,
    useGamification,
    useAccessibilityDefaults,
    useExercises,
    useExercisesByTheme,
    useExercisesByArea,
    useAppConfig,
    type ConfigContextState,
    type ConfigContextValue,
    type ConfigProviderProps,
} from './ConfigContext';

// Re-export types for convenience
export type {
    TrainerConfig,
    SubjectConfig,
    ObservationArea,
    ObservationStage,
    ObservationCategory,
    Theme,
    ThemeProgress,
    BadgeDefinition,
    GamificationConfig,
    StarStrategy,
    LevelThreshold,
    StreakConfig,
    AccessibilityDefaults,
    FontSizeOption,
    ExerciseTypeConfig,
    ScoringRule,
    ValidationError,
    ValidationWarning,
    ValidationResult,
} from '@/types';
