/**
 * Configuration type definitions for the Mini Trainer Engine.
 * 
 * This module defines the configuration structure that allows
 * customization of the trainer for different subjects and use cases.
 */

import type {
    ExerciseType,
    ObservationAreaId,
    ThemeId,
} from './exercise';
import type { Badge } from './profile';
import type { SupportedLocale } from './i18n';

// ============================================================================
// Subject Configuration
// ============================================================================

/**
 * Subject/domain definition.
 * Defines what subject this trainer teaches.
 */
export interface SubjectConfig {
    /** Subject identifier */
    id: string;
    /** Subject name (e.g., "German as a Second Language") */
    name: string;
    /** Subject description */
    description: string;
    /** Target audience description */
    targetAudience: string;
    /** Primary skill area for level progression */
    primarySkillArea: ObservationAreaId;
    /** Exercise types enabled for this subject */
    enabledExerciseTypes: ExerciseType[];
    /** Custom exercise type configurations */
    exerciseTypeConfig?: Partial<Record<ExerciseType, ExerciseTypeConfig>>;
}

/**
 * Exercise type-specific configuration.
 * Allows customization of behavior per exercise type.
 */
export interface ExerciseTypeConfig {
    /** Whether hints are enabled for this type */
    hintsEnabled?: boolean;
    /** Maximum attempts allowed */
    maxAttempts?: number;
    /** Custom scoring rules */
    scoring?: ScoringRule[];
}

/**
 * Custom scoring rule for an exercise type.
 */
export interface ScoringRule {
    /** Rule identifier */
    id: string;
    /** Rule description */
    description: string;
    /** Condition for applying the rule */
    condition: string;
    /** Score modifier or calculation */
    scoreModifier: number | string;
}

// ============================================================================
// Observation Area Configuration
// ============================================================================

/**
 * Category for grouping observation areas.
 * Customized per trainer based on diagnostic framework.
 */
export type ObservationCategory = string;

/**
 * Developmental stage within an observation area.
 * Used for diagnostic frameworks like USB-DaZ.
 */
export interface ObservationStage {
    /** Level number (1-based) */
    level: number;
    /** Short label for this stage */
    label: string;
    /** Detailed description of this stage */
    description: string;
    /** Example behaviors or skills at this stage */
    examples: string[];
}

/**
 * Complete observation area definition.
 * Used for diagnostic frameworks like USB-DaZ.
 */
export interface ObservationArea {
    /** Unique identifier for this area */
    id: ObservationAreaId;
    /** Display name */
    name: string;
    /** Category this area belongs to */
    category: ObservationCategory;
    /** Developmental stages within this area */
    stages: ObservationStage[];
}

// ============================================================================
// Theme Configuration
// ============================================================================

/**
 * Content theme definition.
 * Themes group related exercises by topic.
 */
export interface Theme {
    /** Unique identifier for this theme */
    id: ThemeId;
    /** Display name */
    name: string;
    /** Icon identifier (emoji or icon name) */
    icon: string;
    /** Theme color (CSS color value) */
    color: string;
    /** Description of the theme content */
    description: string;
    /** Minimum level required to access this theme */
    minLevel: number;
}

/**
 * Progress tracking for a theme.
 * Records user's progress within a specific theme.
 */
export interface ThemeProgress {
    /** Whether this theme is unlocked for the user */
    unlocked: boolean;
    /** Number of exercises completed in this theme */
    exercisesCompleted: number;
    /** Total exercises available in this theme */
    exercisesTotal: number;
    /** Stars earned in this theme */
    starsEarned: number;
    /** Maximum possible stars in this theme */
    maxStars: number;
}

// ============================================================================
// Badge Configuration
// ============================================================================

/**
 * Achievement badge definition.
 * Defines a badge that can be earned by users.
 */
export interface BadgeDefinition {
    /** Badge information (without earned timestamp) */
    badge: Omit<Badge, 'earnedAt'>;
    /** Function to check if badge is earned (runtime) */
    check?: (profile: unknown) => boolean;
    /** Optional: condition expression for JSON serialization */
    checkExpression?: string;
}

// ============================================================================
// Gamification Configuration
// ============================================================================

/**
 * Star calculation strategy.
 * Determines how stars are awarded for exercises.
 */
export type StarStrategy = 'attempts' | 'time' | 'custom';

/**
 * Level threshold definition.
 * Defines the stars required to reach a level.
 */
export interface LevelThreshold {
    /** Level number */
    level: number;
    /** Total stars required to reach this level */
    starsRequired: number;
}

/**
 * Streak configuration.
 * Defines streak milestone rewards.
 */
export interface StreakConfig {
    /** Days required for each streak milestone badge */
    milestones: number[];
}

/**
 * Gamification configuration.
 * Controls the reward and progression system.
 */
export interface GamificationConfig {
    /** Star calculation strategy */
    starStrategy: StarStrategy;
    /** Maximum stars per exercise */
    maxStarsPerExercise: number;
    /** Level progression thresholds */
    levelThresholds: LevelThreshold[];
    /** Streak configuration */
    streakConfig: StreakConfig;
}

// ============================================================================
// Accessibility Configuration
// ============================================================================

/**
 * Font size options for accessibility.
 */
export type FontSizeOption = 'normal' | 'large' | 'extra-large';

/**
 * Accessibility default settings.
 * Applied to new user profiles.
 */
export interface AccessibilityDefaults {
    /** Default font size preference */
    defaultFontSize: FontSizeOption;
    /** Default high contrast mode */
    defaultHighContrast: boolean;
    /** Default animations enabled */
    defaultAnimationsEnabled: boolean;
    /** Default sound enabled */
    defaultSoundEnabled: boolean;
}

// ============================================================================
// Main Trainer Configuration
// ============================================================================

/**
 * Main trainer configuration object.
 * This is the root configuration that defines the entire trainer.
 */
export interface TrainerConfig {
    /** Unique identifier for this trainer */
    id: string;
    /** Human-readable trainer name */
    name: string;
    /** Trainer description */
    description: string;
    /** Version string (semver recommended) */
    version: string;
    /** Subject/domain configuration */
    subject: SubjectConfig;
    /** Available observation/diagnostic areas */
    observationAreas: ObservationArea[];
    /** Content themes */
    themes: Theme[];
    /** Badge definitions with check functions */
    badges: BadgeDefinition[];
    /** Supported locales */
    supportedLocales: SupportedLocale[];
    /** Default locale */
    defaultLocale: SupportedLocale;
    /** Gamification configuration */
    gamification: GamificationConfig;
    /** Accessibility defaults */
    accessibility: AccessibilityDefaults;
}

// ============================================================================
// Configuration Validation
// ============================================================================

/**
 * Validation error for configuration checking.
 */
export interface ValidationError {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Path to the problematic field */
    path: string;
}

/**
 * Validation warning for configuration checking.
 */
export interface ValidationWarning {
    /** Warning code for programmatic handling */
    code: string;
    /** Human-readable warning message */
    message: string;
    /** Path to the relevant field */
    path: string;
}

/**
 * Result of configuration validation.
 */
export interface ValidationResult {
    /** Whether the configuration is valid */
    valid: boolean;
    /** Validation errors (blocking issues) */
    errors: ValidationError[];
    /** Validation warnings (non-blocking issues) */
    warnings: ValidationWarning[];
}
