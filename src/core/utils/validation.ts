/**
 * Configuration validation utilities for the Mini Trainer Engine.
 * 
 * Provides functions for validating trainer configuration,
 * exercise data, and other configuration files.
 */

import type {
    TrainerConfig,
    Exercise,
    ValidationError,
    ValidationWarning,
    ValidationResult,
    ObservationArea,
    Theme,
    ExerciseType,
} from '@/types';

// ============================================================================
// Validation Result Helpers
// ============================================================================

/**
 * Create a validation error.
 */
function createError(code: string, message: string, path: string): ValidationError {
    return { code, message, path };
}

/**
 * Create a validation warning.
 */
function createWarning(code: string, message: string, path: string): ValidationWarning {
    return { code, message, path };
}

// ============================================================================
// Trainer Config Validation
// ============================================================================

/**
 * Validate a trainer configuration object.
 * 
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateTrainerConfig(config: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Type check
    if (!config || typeof config !== 'object') {
        return {
            valid: false,
            errors: [createError('INVALID_TYPE', 'Configuration must be an object', 'root')],
            warnings: [],
        };
    }

    const cfg = config as Record<string, unknown>;

    // Required fields
    if (!cfg.id || typeof cfg.id !== 'string') {
        errors.push(createError('MISSING_ID', 'Trainer ID is required and must be a string', 'id'));
    }

    if (!cfg.name || typeof cfg.name !== 'string') {
        errors.push(createError('MISSING_NAME', 'Trainer name is required and must be a string', 'name'));
    }

    if (!cfg.version || typeof cfg.version !== 'string') {
        errors.push(createError('MISSING_VERSION', 'Trainer version is required and must be a string', 'version'));
    }

    // Subject validation
    if (!cfg.subject || typeof cfg.subject !== 'object') {
        errors.push(createError('MISSING_SUBJECT', 'Subject configuration is required', 'subject'));
    } else {
        const subject = cfg.subject as Record<string, unknown>;

        if (!subject.id || typeof subject.id !== 'string') {
            errors.push(createError('MISSING_SUBJECT_ID', 'Subject ID is required', 'subject.id'));
        }

        if (!subject.name || typeof subject.name !== 'string') {
            errors.push(createError('MISSING_SUBJECT_NAME', 'Subject name is required', 'subject.name'));
        }

        if (!Array.isArray(subject.enabledExerciseTypes) || subject.enabledExerciseTypes.length === 0) {
            errors.push(createError('MISSING_EXERCISE_TYPES', 'At least one exercise type must be enabled', 'subject.enabledExerciseTypes'));
        }
    }

    // Observation areas validation
    if (!Array.isArray(cfg.observationAreas)) {
        errors.push(createError('MISSING_AREAS', 'Observation areas array is required', 'observationAreas'));
    } else {
        const areaIds = new Set<string>();

        cfg.observationAreas.forEach((area: unknown, index: number) => {
            if (!area || typeof area !== 'object') {
                errors.push(createError('INVALID_AREA', `Area at index ${index} must be an object`, `observationAreas[${index}]`));
                return;
            }

            const a = area as ObservationArea;

            if (!a.id) {
                errors.push(createError('MISSING_AREA_ID', `Area at index ${index} is missing ID`, `observationAreas[${index}].id`));
            } else if (areaIds.has(a.id)) {
                errors.push(createError('DUPLICATE_AREA_ID', `Duplicate area ID: ${a.id}`, `observationAreas[${index}].id`));
            } else {
                areaIds.add(a.id);
            }

            if (!a.name) {
                errors.push(createError('MISSING_AREA_NAME', `Area ${a.id ?? index} is missing name`, `observationAreas[${index}].name`));
            }
        });

        // Validate primary skill area reference
        if (cfg.subject && typeof cfg.subject === 'object') {
            const subject = cfg.subject as Record<string, unknown>;
            if (subject.primarySkillArea && !areaIds.has(subject.primarySkillArea as string)) {
                errors.push(createError(
                    'INVALID_PRIMARY_SKILL',
                    `Primary skill area ${(subject.primarySkillArea as string)} not found in observation areas`,
                    'subject.primarySkillArea'
                ));
            }
        }
    }

    // Themes validation
    if (!Array.isArray(cfg.themes)) {
        warnings.push(createWarning('NO_THEMES', 'No themes defined', 'themes'));
    } else {
        const themeIds = new Set<string>();

        cfg.themes.forEach((theme: unknown, index: number) => {
            if (!theme || typeof theme !== 'object') {
                errors.push(createError('INVALID_THEME', `Theme at index ${index} must be an object`, `themes[${index}]`));
                return;
            }

            const t = theme as Theme;

            if (!t.id) {
                errors.push(createError('MISSING_THEME_ID', `Theme at index ${index} is missing ID`, `themes[${index}].id`));
            } else if (themeIds.has(t.id)) {
                errors.push(createError('DUPLICATE_THEME_ID', `Duplicate theme ID: ${t.id}`, `themes[${index}].id`));
            } else {
                themeIds.add(t.id);
            }

            if (!t.name) {
                warnings.push(createWarning('MISSING_THEME_NAME', `Theme ${t.id ?? index} is missing name`, `themes[${index}].name`));
            }
        });
    }

    // Badges validation
    if (!Array.isArray(cfg.badges)) {
        warnings.push(createWarning('NO_BADGES', 'No badges defined', 'badges'));
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Exercise Validation
// ============================================================================

/**
 * Validate an array of exercises against a configuration.
 * 
 * @param exercises - The exercises to validate
 * @param config - The trainer configuration
 * @returns Validation result with errors and warnings
 */
export function validateExercises(
    exercises: unknown,
    config: TrainerConfig
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!Array.isArray(exercises)) {
        return {
            valid: false,
            errors: [createError('INVALID_TYPE', 'Exercises must be an array', 'exercises')],
            warnings: [],
        };
    }

    const validAreaIds = new Set(config.observationAreas.map(a => a.id));
    const validThemeIds = new Set(config.themes.map(t => t.id));
    const enabledTypes = new Set(config.subject.enabledExerciseTypes);
    const exerciseIds = new Set<string>();

    exercises.forEach((exercise: unknown, index: number) => {
        if (!exercise || typeof exercise !== 'object') {
            errors.push(createError('INVALID_EXERCISE', `Exercise at index ${index} must be an object`, `exercises[${index}]`));
            return;
        }

        const ex = exercise as Exercise;
        const path = `exercises[${index}]`;

        // ID validation
        if (!ex.id) {
            errors.push(createError('MISSING_EXERCISE_ID', `Exercise at index ${index} is missing ID`, `${path}.id`));
        } else if (exerciseIds.has(ex.id)) {
            errors.push(createError('DUPLICATE_EXERCISE_ID', `Duplicate exercise ID: ${ex.id}`, `${path}.id`));
        } else {
            exerciseIds.add(ex.id);
        }

        // Type validation
        if (!ex.type) {
            errors.push(createError('MISSING_EXERCISE_TYPE', `Exercise ${ex.id ?? index} is missing type`, `${path}.type`));
        } else if (!enabledTypes.has(ex.type)) {
            warnings.push(createWarning(
                'DISABLED_EXERCISE_TYPE',
                `Exercise ${ex.id} uses disabled type ${ex.type}`,
                `${path}.type`
            ));
        }

        // Area reference validation
        if (!ex.areaId) {
            errors.push(createError('MISSING_AREA_REF', `Exercise ${ex.id ?? index} is missing areaId`, `${path}.areaId`));
        } else if (!validAreaIds.has(ex.areaId)) {
            errors.push(createError(
                'INVALID_AREA_REF',
                `Exercise ${ex.id ?? index} references unknown area ${ex.areaId}`,
                `${path}.areaId`
            ));
        }

        // Theme reference validation
        if (!ex.themeId) {
            warnings.push(createWarning('MISSING_THEME_REF', `Exercise ${ex.id ?? index} is missing themeId`, `${path}.themeId`));
        } else if (!validThemeIds.has(ex.themeId)) {
            warnings.push(createWarning(
                'INVALID_THEME_REF',
                `Exercise ${ex.id ?? index} references unknown theme ${ex.themeId}`,
                `${path}.themeId`
            ));
        }

        // Level validation
        if (typeof ex.level !== 'number' || ex.level < 1) {
            errors.push(createError('INVALID_LEVEL', `Exercise ${ex.id ?? index} has invalid level`, `${path}.level`));
        }

        // Difficulty validation
        if (![1, 2, 3].includes(ex.difficulty)) {
            errors.push(createError('INVALID_DIFFICULTY', `Exercise ${ex.id ?? index} has invalid difficulty (must be 1, 2, or 3)`, `${path}.difficulty`));
        }

        // Content validation
        if (!ex.content) {
            errors.push(createError('MISSING_CONTENT', `Exercise ${ex.id ?? index} is missing content`, `${path}.content`));
        } else if (ex.content.type !== ex.type) {
            errors.push(createError(
                'CONTENT_TYPE_MISMATCH',
                `Exercise ${ex.id ?? index} has type ${ex.type} but content type is ${ex.content.type}`,
                `${path}.content`
            ));
        }

        // Instruction validation
        if (!ex.instruction) {
            warnings.push(createWarning('MISSING_INSTRUCTION', `Exercise ${ex.id ?? index} is missing instruction`, `${path}.instruction`));
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Individual Exercise Validation
// ============================================================================

/**
 * Validate a single exercise.
 * 
 * @param exercise - The exercise to validate
 * @returns Validation result
 */
export function validateExercise(exercise: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!exercise || typeof exercise !== 'object') {
        return {
            valid: false,
            errors: [createError('INVALID_TYPE', 'Exercise must be an object', 'exercise')],
            warnings: [],
        };
    }

    const ex = exercise as Exercise;

    // Required fields
    if (!ex.id) errors.push(createError('MISSING_ID', 'Exercise ID is required', 'id'));
    if (!ex.type) errors.push(createError('MISSING_TYPE', 'Exercise type is required', 'type'));
    if (!ex.areaId) errors.push(createError('MISSING_AREA_ID', 'Area ID is required', 'areaId'));
    if (!ex.instruction) warnings.push(createWarning('MISSING_INSTRUCTION', 'Instruction is recommended', 'instruction'));

    // Content validation
    if (!ex.content) {
        errors.push(createError('MISSING_CONTENT', 'Exercise content is required', 'content'));
    } else {
        // Validate content matches type
        if (ex.type && ex.content.type !== ex.type) {
            errors.push(createError('CONTENT_TYPE_MISMATCH', 'Content type must match exercise type', 'content.type'));
        }

        // Type-specific validation
        switch (ex.content.type) {
            case 'multiple-choice': {
                const mc = ex.content;
                if (!Array.isArray(mc.options) || mc.options.length < 2) {
                    errors.push(createError('INVALID_OPTIONS', 'Multiple choice must have at least 2 options', 'content.options'));
                }
                if (typeof mc.correctIndex !== 'number' || mc.correctIndex < 0 || mc.correctIndex >= mc.options.length) {
                    errors.push(createError('INVALID_CORRECT_INDEX', 'Correct index is out of range', 'content.correctIndex'));
                }
                break;
            }
            case 'fill-blank': {
                const fb = ex.content;
                if (!fb.sentence || !fb.sentence.includes('{{blank}}')) {
                    errors.push(createError('INVALID_BLANK_SENTENCE', 'Sentence must contain {{blank}} placeholder', 'content.sentence'));
                }
                if (!fb.correctAnswer) {
                    errors.push(createError('MISSING_CORRECT_ANSWER', 'Correct answer is required', 'content.correctAnswer'));
                }
                break;
            }
            case 'matching': {
                const m = ex.content;
                if (!Array.isArray(m.pairs) || m.pairs.length < 2) {
                    errors.push(createError('INVALID_PAIRS', 'Matching must have at least 2 pairs', 'content.pairs'));
                }
                break;
            }
            // Add more type-specific validation as needed
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a value is a valid exercise type.
 */
export function isValidExerciseType(type: unknown): type is ExerciseType {
    const validTypes: ExerciseType[] = [
        'fill-blank',
        'multiple-choice',
        'matching',
        'sentence-builder',
        'sorting',
        'writing',
        'conjugation-table',
        'connector-insert',
        'word-order',
        'picture-vocabulary',
    ];
    return typeof type === 'string' && validTypes.includes(type as ExerciseType);
}

/**
 * Check if a value is a valid difficulty level.
 */
export function isValidDifficulty(value: unknown): value is 1 | 2 | 3 {
    return [1, 2, 3].includes(value as number);
}

/**
 * Check if a string is a valid locale code.
 */
export function isValidLocale(locale: unknown): boolean {
    if (typeof locale !== 'string') return false;
    // Basic locale format check (e.g., 'de', 'en', 'de-AT')
    return /^[a-z]{2}(-[A-Z]{2})?$/.test(locale);
}
