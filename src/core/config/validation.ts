/**
 * Configuration validation for the Mini Trainer Engine.
 * 
 * Provides validation functions for each configuration file type,
 * returning detailed validation results with errors and warnings.
 */

import type {
    ValidationError,
    ValidationWarning,
    ValidationResult,
} from '@/types';

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Create a validation error.
 */
function error(code: string, message: string, path: string): ValidationError {
    return { code, message, path };
}

/**
 * Create a validation warning.
 */
function warning(code: string, message: string, path: string): ValidationWarning {
    return { code, message, path };
}

/**
 * Check if a value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

/**
 * Check if a value is an array.
 */
function isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/**
 * Check if a value is a plain object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// ============================================================================
// Subject Configuration Validation
// ============================================================================

/**
 * Valid exercise types for validation.
 */
const VALID_EXERCISE_TYPES = [
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
] as const;

/**
 * Validate subject configuration.
 * 
 * @param config - The configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateSubjectConfig(config: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isObject(config)) {
        return {
            valid: false,
            errors: [error('INVALID_TYPE', 'Configuration must be an object', 'root')],
            warnings: [],
        };
    }

    // Required string fields
    if (!isNonEmptyString(config.id)) {
        errors.push(error('MISSING_ID', 'Subject ID is required', 'id'));
    }

    if (!isNonEmptyString(config.name)) {
        errors.push(error('MISSING_NAME', 'Subject name is required', 'name'));
    }

    if (!isNonEmptyString(config.description)) {
        warnings.push(warning('MISSING_DESCRIPTION', 'Subject description is recommended', 'description'));
    }

    if (!isNonEmptyString(config.targetAudience)) {
        warnings.push(warning('MISSING_AUDIENCE', 'Target audience is recommended', 'targetAudience'));
    }

    if (!isNonEmptyString(config.primarySkillArea)) {
        errors.push(error('MISSING_PRIMARY_SKILL', 'Primary skill area is required', 'primarySkillArea'));
    }

    // Enabled exercise types
    if (!isArray(config.enabledExerciseTypes)) {
        errors.push(error('MISSING_EXERCISE_TYPES', 'Enabled exercise types must be an array', 'enabledExerciseTypes'));
    } else if (config.enabledExerciseTypes.length === 0) {
        errors.push(error('EMPTY_EXERCISE_TYPES', 'At least one exercise type must be enabled', 'enabledExerciseTypes'));
    } else {
        config.enabledExerciseTypes.forEach((type, index) => {
            if (!VALID_EXERCISE_TYPES.includes(type as typeof VALID_EXERCISE_TYPES[number])) {
                errors.push(error(
                    'INVALID_EXERCISE_TYPE',
                    `Invalid exercise type: ${type}`,
                    `enabledExerciseTypes[${index}]`
                ));
            }
        });
    }

    // Exercise type config (optional)
    if (config.exerciseTypeConfig !== undefined && !isObject(config.exerciseTypeConfig)) {
        errors.push(error('INVALID_EXERCISE_CONFIG', 'Exercise type config must be an object', 'exerciseTypeConfig'));
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Observation Areas Validation
// ============================================================================

/**
 * Validate observation areas configuration.
 * 
 * @param areas - The areas to validate
 * @returns Validation result with errors and warnings
 */
export function validateAreas(areas: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isArray(areas)) {
        return {
            valid: false,
            errors: [error('INVALID_TYPE', 'Areas must be an array', 'root')],
            warnings: [],
        };
    }

    if (areas.length === 0) {
        warnings.push(warning('NO_AREAS', 'No observation areas defined', 'root'));
        return { valid: true, errors: [], warnings };
    }

    const areaIds = new Set<string>();

    areas.forEach((area, index) => {
        const path = `[${index}]`;

        if (!isObject(area)) {
            errors.push(error('INVALID_AREA', 'Area must be an object', path));
            return;
        }

        // Required fields
        if (!isNonEmptyString(area.id)) {
            errors.push(error('MISSING_AREA_ID', `Area at index ${index} is missing ID`, `${path}.id`));
        } else {
            if (areaIds.has(area.id)) {
                errors.push(error('DUPLICATE_AREA_ID', `Duplicate area ID: ${area.id}`, `${path}.id`));
            }
            areaIds.add(area.id);
        }

        if (!isNonEmptyString(area.name)) {
            errors.push(error('MISSING_AREA_NAME', `Area at index ${index} is missing name`, `${path}.name`));
        }

        if (!isNonEmptyString(area.category)) {
            warnings.push(warning('MISSING_CATEGORY', `Area ${area.id ?? index} is missing category`, `${path}.category`));
        }

        // Stages validation
        if (!isArray(area.stages)) {
            errors.push(error('MISSING_STAGES', `Area ${area.id ?? index} must have stages array`, `${path}.stages`));
        } else {
            const levelSet = new Set<number>();

            area.stages.forEach((stage, stageIndex) => {
                const stagePath = `${path}.stages[${stageIndex}]`;

                if (!isObject(stage)) {
                    errors.push(error('INVALID_STAGE', 'Stage must be an object', stagePath));
                    return;
                }

                const s = stage as Record<string, unknown>;

                if (typeof s.level !== 'number' || s.level < 1) {
                    errors.push(error('INVALID_LEVEL', 'Stage level must be a positive number', `${stagePath}.level`));
                } else {
                    if (levelSet.has(s.level)) {
                        errors.push(error('DUPLICATE_LEVEL', `Duplicate level ${s.level}`, `${stagePath}.level`));
                    }
                    levelSet.add(s.level);
                }

                if (!isNonEmptyString(s.label)) {
                    warnings.push(warning('MISSING_LABEL', `Stage at ${stagePath} is missing label`, `${stagePath}.label`));
                }

                if (!isNonEmptyString(s.description)) {
                    warnings.push(warning('MISSING_DESCRIPTION', `Stage at ${stagePath} is missing description`, `${stagePath}.description`));
                }

                if (!isArray(s.examples)) {
                    warnings.push(warning('MISSING_EXAMPLES', `Stage at ${stagePath} is missing examples`, `${stagePath}.examples`));
                }
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Themes Validation
// ============================================================================

/**
 * Validate themes configuration.
 * 
 * @param themes - The themes to validate
 * @returns Validation result with errors and warnings
 */
export function validateThemes(themes: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isArray(themes)) {
        return {
            valid: false,
            errors: [error('INVALID_TYPE', 'Themes must be an array', 'root')],
            warnings: [],
        };
    }

    if (themes.length === 0) {
        warnings.push(warning('NO_THEMES', 'No themes defined', 'root'));
        return { valid: true, errors: [], warnings };
    }

    const themeIds = new Set<string>();

    themes.forEach((theme, index) => {
        const path = `[${index}]`;

        if (!isObject(theme)) {
            errors.push(error('INVALID_THEME', 'Theme must be an object', path));
            return;
        }

        // Required fields
        if (!isNonEmptyString(theme.id)) {
            errors.push(error('MISSING_THEME_ID', `Theme at index ${index} is missing ID`, `${path}.id`));
        } else {
            if (themeIds.has(theme.id)) {
                errors.push(error('DUPLICATE_THEME_ID', `Duplicate theme ID: ${theme.id}`, `${path}.id`));
            }
            themeIds.add(theme.id);
        }

        if (!isNonEmptyString(theme.name)) {
            errors.push(error('MISSING_THEME_NAME', `Theme at index ${index} is missing name`, `${path}.name`));
        }

        if (!isNonEmptyString(theme.icon)) {
            warnings.push(warning('MISSING_ICON', `Theme ${theme.id ?? index} is missing icon`, `${path}.icon`));
        }

        if (!isNonEmptyString(theme.color)) {
            warnings.push(warning('MISSING_COLOR', `Theme ${theme.id ?? index} is missing color`, `${path}.color`));
        } else {
            // Validate color format (basic check)
            const color = theme.color as string;
            if (!color.match(/^#[0-9A-Fa-f]{3,6}$|^rgb\(|^rgba\(|^[a-zA-Z]+$/)) {
                warnings.push(warning('INVALID_COLOR_FORMAT', `Theme ${theme.id ?? index} has unusual color format`, `${path}.color`));
            }
        }

        if (!isNonEmptyString(theme.description)) {
            warnings.push(warning('MISSING_DESCRIPTION', `Theme ${theme.id ?? index} is missing description`, `${path}.description`));
        }

        if (typeof theme.minLevel !== 'number' || theme.minLevel < 1) {
            warnings.push(warning('INVALID_MIN_LEVEL', `Theme ${theme.id ?? index} has invalid minLevel, defaulting to 1`, `${path}.minLevel`));
        }
    });

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Badges Validation
// ============================================================================

/**
 * Validate badges configuration.
 * 
 * @param badges - The badges configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateBadges(badges: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!isObject(badges)) {
        return {
            valid: false,
            errors: [error('INVALID_TYPE', 'Badges configuration must be an object', 'root')],
            warnings: [],
        };
    }

    // Check badges array
    if (!isArray(badges.badges)) {
        warnings.push(warning('NO_BADGES_ARRAY', 'No badges array found', 'badges'));
        return { valid: true, errors: [], warnings };
    }

    if (badges.badges.length === 0) {
        warnings.push(warning('NO_BADGES', 'No badges defined', 'badges'));
        return { valid: true, errors: [], warnings };
    }

    const badgeIds = new Set<string>();

    badges.badges.forEach((badgeItem, index) => {
        const path = `badges[${index}]`;

        if (!isObject(badgeItem)) {
            errors.push(error('INVALID_BADGE_ITEM', 'Badge item must be an object', path));
            return;
        }

        // Check badge object
        if (!isObject(badgeItem.badge)) {
            errors.push(error('MISSING_BADGE_OBJECT', `Badge item at index ${index} is missing badge object`, `${path}.badge`));
            return;
        }

        const badge = badgeItem.badge as Record<string, unknown>;

        if (!isNonEmptyString(badge.id)) {
            errors.push(error('MISSING_BADGE_ID', `Badge at index ${index} is missing ID`, `${path}.badge.id`));
        } else {
            if (badgeIds.has(badge.id)) {
                errors.push(error('DUPLICATE_BADGE_ID', `Duplicate badge ID: ${badge.id}`, `${path}.badge.id`));
            }
            badgeIds.add(badge.id);
        }

        if (!isNonEmptyString(badge.name)) {
            errors.push(error('MISSING_BADGE_NAME', `Badge ${badge.id ?? index} is missing name`, `${path}.badge.name`));
        }

        if (!isNonEmptyString(badge.description)) {
            warnings.push(warning('MISSING_BADGE_DESCRIPTION', `Badge ${badge.id ?? index} is missing description`, `${path}.badge.description`));
        }

        if (!isNonEmptyString(badge.icon)) {
            warnings.push(warning('MISSING_BADGE_ICON', `Badge ${badge.id ?? index} is missing icon`, `${path}.badge.icon`));
        }

        // Check type and threshold
        if (!isNonEmptyString(badgeItem.type)) {
            warnings.push(warning('MISSING_BADGE_TYPE', `Badge ${badge.id ?? index} is missing type`, `${path}.type`));
        }

        if (typeof badgeItem.threshold !== 'number') {
            warnings.push(warning('MISSING_THRESHOLD', `Badge ${badge.id ?? index} is missing threshold`, `${path}.threshold`));
        }
    });

    // Validate gamification config if present
    if (badges.gamification !== undefined) {
        const gamification = badges.gamification as Record<string, unknown>;

        if (!isObject(gamification)) {
            errors.push(error('INVALID_GAMIFICATION', 'Gamification config must be an object', 'gamification'));
        } else {
            // Validate level thresholds
            if (gamification.levelThresholds !== undefined) {
                if (!isArray(gamification.levelThresholds)) {
                    errors.push(error('INVALID_LEVEL_THRESHOLDS', 'Level thresholds must be an array', 'gamification.levelThresholds'));
                } else {
                    gamification.levelThresholds.forEach((threshold, index) => {
                        if (!isObject(threshold)) {
                            errors.push(error('INVALID_THRESHOLD', `Threshold at index ${index} must be an object`, `gamification.levelThresholds[${index}]`));
                        }
                    });
                }
            }

            // Validate streak config
            if (gamification.streakConfig !== undefined) {
                if (!isObject(gamification.streakConfig)) {
                    errors.push(error('INVALID_STREAK_CONFIG', 'Streak config must be an object', 'gamification.streakConfig'));
                } else if (!isArray((gamification.streakConfig as Record<string, unknown>).milestones)) {
                    warnings.push(warning('NO_STREAK_MILESTONES', 'Streak milestones not defined', 'gamification.streakConfig.milestones'));
                }
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// ============================================================================
// Re-export from utils/validation.ts for convenience
// ============================================================================

export { validateTrainerConfig, validateExercises, validateExercise } from '@/core/utils/validation';
