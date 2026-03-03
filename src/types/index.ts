/**
 * Mini Trainer Engine - Type Definitions
 * 
 * This module re-exports all type definitions for convenient importing.
 * Import from '@/types' to access all types.
 * 
 * @example
 * ```typescript
 * import type { Exercise, UserProfile, TrainerConfig } from '@/types';
 * ```
 */

// ============================================================================
// Exercise Types
// ============================================================================

export type {
    ExerciseType,
    ObservationAreaId,
    ThemeId,
    FillBlankContent,
    MultipleChoiceContent,
    MatchingContent,
    SentenceBuilderContent,
    SortingContent,
    WritingContent,
    ConjugationTableContent,
    ConnectorInsertContent,
    WordOrderContent,
    PictureVocabularyContent,
    ExerciseContent,
    ExerciseDifficulty,
    Exercise,
    StarRating,
    ExerciseResult,
} from './exercise';

// ============================================================================
// Configuration Types
// ============================================================================

export type {
    SubjectConfig,
    ExerciseTypeConfig,
    ScoringRule,
    ObservationCategory,
    ObservationStage,
    ObservationArea,
    Theme,
    ThemeProgress,
    BadgeDefinition,
    StarStrategy,
    LevelThreshold,
    StreakConfig,
    GamificationConfig,
    FontSizeOption,
    AccessibilityDefaults,
    TrainerConfig,
    ValidationError,
    ValidationWarning,
    ValidationResult,
} from './config';

// ============================================================================
// Profile Types
// ============================================================================

export type {
    Badge,
    AreaProgress,
    UserProfile,
    ChildProfile,
    SupportMeasure,
    StudentStatus,
    StudentProfile,
    FoerderplanEntry,
    Foerderplan,
    TimePoint,
    FrequencyRating,
    AreaObservation,
    ObservationRecord,
} from './profile';

// ============================================================================
// Gamification Types
// ============================================================================

export type {
    StarRating as GamificationStarRating,
    Score,
    Level,
    LevelRange,
    Streak,
    StreakMilestone,
    ScoringStrategy,
    ScoringResult,
    ScoringParams,
    StarThresholds,
    LevelProgress,
    ExperienceInfo,
    AchievementCategory,
    AchievementProgress,
    LeaderboardEntry,
    LeaderboardTimeFrame,
    LeaderboardConfig,
} from './gamification';

// ============================================================================
// Storage Types
// ============================================================================

export type {
    StorageKey,
    DatabaseName,
    StoreName,
    StoredProfile,
    StoredExerciseResult,
    StoredRecord,
    ExportVersion,
    ExportData,
    ImportResult,
    Migration,
    SchemaVersion,
    StorageConfig,
    StorageStats,
    CacheEntry,
    CacheConfig,
} from './storage';

// ============================================================================
// Internationalization Types
// ============================================================================

export type {
    SupportedLocale,
    DefaultLocale,
    TranslationKey,
    ExerciseTranslationKey,
    ThemeTranslationKey,
    AreaTranslationKey,
    BadgeTranslationKey,
    UITranslationKey,
    TranslationValue,
    TranslationDictionary,
    Translations,
    I18nConfig,
    TranslateOptions,
} from './i18n';

// ============================================================================
// Re-export Store Names Constant
// ============================================================================

export { STORE_NAMES } from './storage';
