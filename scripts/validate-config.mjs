#!/usr/bin/env node

/**
 * Configuration validation script.
 * Validates all JSON configuration files for consistency and correctness.
 * 
 * Usage:
 *   node scripts/validate-config.mjs [options]
 * 
 * Options:
 *   --config-dir   Directory containing config files (default: src/config)
 *   --data-dir     Directory containing data files (default: src/data)
 *   --strict       Treat warnings as errors (default: false)
 *   --help         Show help message
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    magenta: '\x1b[35m',
};

/**
 * Log with color support
 */
const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        configDir: join(rootDir, 'src', 'config'),
        dataDir: join(rootDir, 'src', 'data'),
        strict: false,
        help: false,
    };

    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        switch (arg) {
            case '--config-dir':
                args.configDir = resolve(rootDir, argv[++i]);
                break;
            case '--data-dir':
                args.dataDir = resolve(rootDir, argv[++i]);
                break;
            case '--strict':
                args.strict = true;
                break;
            case '--help':
            case '-h':
                args.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    log.warn(`Unknown option: ${arg}`);
                }
        }
    }

    return args;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
${colors.bright}validate-config.mjs${colors.reset}

Validates all JSON configuration files for consistency and correctness.

${colors.bright}Usage:${colors.reset}
  node scripts/validate-config.mjs [options]

${colors.bright}Options:${colors.reset}
  --config-dir <path>  Directory containing config files
                       (default: src/config)
  --data-dir <path>    Directory containing data files
                       (default: src/data)
  --strict             Treat warnings as errors
  --help, -h           Show this help message

${colors.bright}Validates:${colors.reset}
  - areas.json: Observation areas configuration
  - themes.json: Content themes configuration
  - badges.json: Badge definitions
  - subject.json: Subject configuration
  - exercises.json: Exercise data (cross-references areas/themes)

${colors.bright}Exit Codes:${colors.reset}
  0 - All validations passed
  1 - Validation errors found
`);
}

/**
 * Validation result collector
 */
class ValidationResult {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.filesChecked = 0;
    }

    addError(file, path, message) {
        this.errors.push({ file, path, message });
    }

    addWarning(file, path, message) {
        this.warnings.push({ file, path, message });
    }

    hasIssues() {
        return this.errors.length > 0 || this.warnings.length > 0;
    }

    get exitCode() {
        return this.errors.length > 0 ? 1 : 0;
    }
}

/**
 * Load and parse JSON file
 */
function loadJSON(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }

    try {
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}`);
    }
}

/**
 * Validate areas.json
 */
function validateAreas(areas, result) {
    if (!areas) {
        result.addError('areas.json', '', 'File not found or invalid');
        return new Set();
    }

    if (!Array.isArray(areas)) {
        result.addError('areas.json', '', 'Must be an array');
        return new Set();
    }

    const areaIds = new Set();

    areas.forEach((area, index) => {
        const basePath = `[${index}]`;

        // Required fields
        if (!area.id) {
            result.addError('areas.json', `${basePath}.id`, 'Missing required field: id');
        } else {
            if (areaIds.has(area.id)) {
                result.addError('areas.json', `${basePath}.id`, `Duplicate area ID: ${area.id}`);
            }
            areaIds.add(area.id);
        }

        if (!area.name) {
            result.addWarning('areas.json', `${basePath}.name`, 'Missing name field');
        }

        if (!area.category) {
            result.addWarning('areas.json', `${basePath}.category`, 'Missing category field');
        }

        // Validate stages
        if (!Array.isArray(area.stages) || area.stages.length === 0) {
            result.addWarning('areas.json', `${basePath}.stages`, 'No stages defined');
        } else {
            const levels = new Set();
            area.stages.forEach((stage, stageIndex) => {
                const stagePath = `${basePath}.stages[${stageIndex}]`;

                if (typeof stage.level !== 'number') {
                    result.addError('areas.json', `${stagePath}.level`, 'Level must be a number');
                } else {
                    if (levels.has(stage.level)) {
                        result.addError('areas.json', `${stagePath}.level`, `Duplicate level: ${stage.level}`);
                    }
                    levels.add(stage.level);
                }

                if (!stage.label) {
                    result.addWarning('areas.json', `${stagePath}.label`, 'Missing label');
                }

                if (!stage.description) {
                    result.addWarning('areas.json', `${stagePath}.description`, 'Missing description');
                }
            });
        }
    });

    return areaIds;
}

/**
 * Validate themes.json
 */
function validateThemes(themes, result) {
    if (!themes) {
        result.addError('themes.json', '', 'File not found or invalid');
        return new Set();
    }

    if (!Array.isArray(themes)) {
        result.addError('themes.json', '', 'Must be an array');
        return new Set();
    }

    const themeIds = new Set();

    themes.forEach((theme, index) => {
        const basePath = `[${index}]`;

        if (!theme.id) {
            result.addError('themes.json', `${basePath}.id`, 'Missing required field: id');
        } else {
            if (themeIds.has(theme.id)) {
                result.addError('themes.json', `${basePath}.id`, `Duplicate theme ID: ${theme.id}`);
            }
            themeIds.add(theme.id);
        }

        if (!theme.name) {
            result.addWarning('themes.json', `${basePath}.name`, 'Missing name field');
        }

        if (!theme.icon) {
            result.addWarning('themes.json', `${basePath}.icon`, 'Missing icon field');
        }

        if (!theme.color) {
            result.addWarning('themes.json', `${basePath}.color`, 'Missing color field');
        } else if (!isValidColor(theme.color)) {
            result.addWarning('themes.json', `${basePath}.color`, `Invalid color value: ${theme.color}`);
        }

        if (typeof theme.minLevel !== 'number' || theme.minLevel < 1) {
            result.addWarning('themes.json', `${basePath}.minLevel`, 'Invalid minLevel');
        }
    });

    return themeIds;
}

/**
 * Check if a color value is valid
 */
function isValidColor(color) {
    if (typeof color !== 'string') return false;

    // Check hex color
    if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color)) return true;

    // Check named colors (basic set)
    const namedColors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'gray'];
    if (namedColors.includes(color.toLowerCase())) return true;

    // Check rgb/rgba
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) return true;

    return false;
}

/**
 * Validate badges.json
 */
function validateBadges(badges, result) {
    if (!badges) {
        result.addWarning('badges.json', '', 'File not found - badges are optional');
        return;
    }

    // Support both { badges: [] } and direct array formats
    const badgeList = Array.isArray(badges) ? badges : (badges.badges || []);

    if (!Array.isArray(badgeList)) {
        result.addError('badges.json', '', 'Must be an array or object with badges array');
        return;
    }

    const badgeIds = new Set();

    badgeList.forEach((item, index) => {
        const basePath = Array.isArray(badges) ? `[${index}]` : `badges[${index}]`;

        // Support both { badge: {...} } and direct badge object formats
        const badge = item.badge || item;

        if (!badge.id) {
            result.addError('badges.json', `${basePath}.id`, 'Missing required field: id');
        } else {
            if (badgeIds.has(badge.id)) {
                result.addError('badges.json', `${basePath}.id`, `Duplicate badge ID: ${badge.id}`);
            }
            badgeIds.add(badge.id);
        }

        if (!badge.name) {
            result.addWarning('badges.json', `${basePath}.name`, 'Missing name field');
        }

        if (!badge.description) {
            result.addWarning('badges.json', `${basePath}.description`, 'Missing description field');
        }

        if (!badge.icon) {
            result.addWarning('badges.json', `${basePath}.icon`, 'Missing icon field');
        }
    });
}

/**
 * Validate subject.json
 */
function validateSubject(subject, result, areaIds) {
    if (!subject) {
        result.addError('subject.json', '', 'File not found or invalid');
        return;
    }

    if (!subject.id) {
        result.addError('subject.json', 'id', 'Missing required field: id');
    }

    if (!subject.name) {
        result.addWarning('subject.json', 'name', 'Missing name field');
    }

    if (!subject.description) {
        result.addWarning('subject.json', 'description', 'Missing description field');
    }

    // Validate primary skill area reference
    if (subject.primarySkillArea && areaIds.size > 0) {
        if (!areaIds.has(subject.primarySkillArea)) {
            result.addError('subject.json', 'primarySkillArea',
                `Referenced area '${subject.primarySkillArea}' not found in areas.json`);
        }
    }

    // Validate enabled exercise types
    if (Array.isArray(subject.enabledExerciseTypes)) {
        const validTypes = [
            'fill-blank', 'multiple-choice', 'matching', 'sentence-builder',
            'sorting', 'writing', 'conjugation-table', 'connector-insert',
            'word-order', 'picture-vocabulary'
        ];

        subject.enabledExerciseTypes.forEach((type, index) => {
            if (!validTypes.includes(type)) {
                result.addError('subject.json', `enabledExerciseTypes[${index}]`,
                    `Invalid exercise type: ${type}`);
            }
        });
    }
}

/**
 * Validate exercises.json
 */
function validateExercises(exercises, result, areaIds, themeIds) {
    if (!exercises) {
        result.addWarning('exercises.json', '', 'File not found - no exercises defined');
        return;
    }

    const exerciseList = Array.isArray(exercises) ? exercises : (exercises.exercises || []);

    if (!Array.isArray(exerciseList)) {
        result.addError('exercises.json', '', 'Must be an array or object with exercises array');
        return;
    }

    const exerciseIds = new Set();

    exerciseList.forEach((exercise, index) => {
        const basePath = Array.isArray(exercises) ? `[${index}]` : `exercises[${index}]`;

        // Check required fields
        if (!exercise.id) {
            result.addError('exercises.json', `${basePath}.id`, 'Missing required field: id');
        } else {
            if (exerciseIds.has(exercise.id)) {
                result.addError('exercises.json', `${basePath}.id`, `Duplicate exercise ID: ${exercise.id}`);
            }
            exerciseIds.add(exercise.id);
        }

        // Validate area reference
        if (exercise.areaId && areaIds.size > 0) {
            if (!areaIds.has(exercise.areaId)) {
                result.addError('exercises.json', `${basePath}.areaId`,
                    `Referenced area '${exercise.areaId}' not found in areas.json`);
            }
        }

        // Validate theme reference
        if (exercise.themeId && themeIds.size > 0) {
            if (!themeIds.has(exercise.themeId)) {
                result.addError('exercises.json', `${basePath}.themeId`,
                    `Referenced theme '${exercise.themeId}' not found in themes.json`);
            }
        }

        // Validate difficulty
        if (![1, 2, 3].includes(exercise.difficulty)) {
            result.addWarning('exercises.json', `${basePath}.difficulty`,
                `Invalid difficulty: ${exercise.difficulty} (should be 1, 2, or 3)`);
        }

        // Validate level
        if (typeof exercise.level !== 'number' || exercise.level < 1) {
            result.addWarning('exercises.json', `${basePath}.level`, 'Invalid level');
        }

        // Validate type
        const validTypes = [
            'fill-blank', 'multiple-choice', 'matching', 'sentence-builder',
            'sorting', 'writing', 'conjugation-table', 'connector-insert',
            'word-order', 'picture-vocabulary'
        ];

        if (!validTypes.includes(exercise.type)) {
            result.addError('exercises.json', `${basePath}.type`,
                `Invalid exercise type: ${exercise.type}`);
        }
    });
}

/**
 * Print validation results
 */
function printResults(result, strict) {
    log.header('Validation Results');

    // Print errors
    if (result.errors.length > 0) {
        console.log(`${colors.red}${colors.bright}Errors (${result.errors.length}):${colors.reset}\n`);
        result.errors.forEach((error) => {
            console.log(`  ${colors.red}✗${colors.reset} ${colors.magenta}${error.file}${colors.reset}`);
            console.log(`    ${colors.gray}${error.path}:${colors.reset} ${error.message}`);
        });
    }

    // Print warnings
    if (result.warnings.length > 0) {
        console.log(`\n${colors.yellow}${colors.bright}Warnings (${result.warnings.length}):${colors.reset}\n`);
        result.warnings.forEach((warning) => {
            console.log(`  ${colors.yellow}⚠${colors.reset} ${colors.magenta}${warning.file}${colors.reset}`);
            console.log(`    ${colors.gray}${warning.path}:${colors.reset} ${warning.message}`);
        });
    }

    // Summary
    console.log('\n' + '─'.repeat(50));

    if (result.errors.length === 0 && result.warnings.length === 0) {
        log.success('All validations passed!');
    } else if (result.errors.length === 0) {
        if (strict) {
            log.error(`Validation failed with ${result.warnings.length} warning(s) (strict mode)`);
        } else {
            log.success(`Validation passed with ${result.warnings.length} warning(s)`);
        }
    } else {
        log.error(`Validation failed with ${result.errors.length} error(s) and ${result.warnings.length} warning(s)`);
    }

    console.log(`  Files checked: ${result.filesChecked}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);
}

/**
 * Main validation function
 */
function validateConfig(args) {
    log.header('Validating Configuration Files');

    const result = new ValidationResult();

    // Load and validate areas.json
    log.info('Checking areas.json...');
    result.filesChecked++;
    const areas = loadJSON(join(args.configDir, 'areas.json'));
    const areaIds = validateAreas(areas, result);

    // Load and validate themes.json
    log.info('Checking themes.json...');
    result.filesChecked++;
    const themes = loadJSON(join(args.configDir, 'themes.json'));
    const themeIds = validateThemes(themes, result);

    // Load and validate badges.json
    log.info('Checking badges.json...');
    result.filesChecked++;
    const badges = loadJSON(join(args.configDir, 'badges.json'));
    validateBadges(badges, result);

    // Load and validate subject.json
    log.info('Checking subject.json...');
    result.filesChecked++;
    const subject = loadJSON(join(args.configDir, 'subject.json'));
    validateSubject(subject, result, areaIds);

    // Load and validate exercises.json
    log.info('Checking exercises.json...');
    result.filesChecked++;
    const exercises = loadJSON(join(args.dataDir, 'exercises.json'));
    validateExercises(exercises, result, areaIds, themeIds);

    // Print results
    printResults(result, args.strict);

    // In strict mode, warnings become errors
    if (args.strict && result.warnings.length > 0) {
        return 1;
    }

    return result.exitCode;
}

// Main entry point
const args = parseArgs();

if (args.help) {
    showHelp();
    process.exit(0);
}

try {
    const exitCode = validateConfig(args);
    process.exit(exitCode);
} catch (error) {
    log.error(`Validation failed: ${error.message}`);
    console.error(error);
    process.exit(1);
}
