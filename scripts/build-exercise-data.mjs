#!/usr/bin/env node

/**
 * Build script for exercise data.
 * Transforms exercise configuration into optimized runtime format.
 * 
 * Usage:
 *   node scripts/build-exercise-data.mjs [options]
 * 
 * Options:
 *   --input    Input JSON file path (default: src/data/exercises.json)
 *   --output   Output JS file path (default: public/data/exercises.js)
 *   --validate Validate exercises against types (default: true)
 *   --help     Show help message
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

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
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
    const args = {
        app: null,
        input: join(rootDir, 'src', 'data', 'exercises.json'),
        output: join(rootDir, 'public', 'data', 'exercises.js'),
        validate: true,
        help: false,
    };

    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        switch (arg) {
            case '--app':
            case '-a':
                args.app = argv[++i];
                break;
            case '--input':
                args.input = resolve(rootDir, argv[++i]);
                break;
            case '--output':
                args.output = resolve(rootDir, argv[++i]);
                break;
            case '--validate':
                args.validate = argv[++i] !== 'false';
                break;
            case '--no-validate':
                args.validate = false;
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
${colors.bright}build-exercise-data.mjs${colors.reset}

Build script for exercise data. Transforms exercise configuration 
into optimized runtime format for the Mini Trainer Engine.

${colors.bright}Usage:${colors.reset}
  node scripts/build-exercise-data.mjs [options]

${colors.bright}Options:${colors.reset}
  --input <path>     Input JSON file path
                     (default: src/data/exercises.json)
  --output <path>    Output JS file path
                     (default: public/data/exercises.js)
  --validate <bool>  Validate exercises against types (default: true)
  --no-validate      Skip validation
  --help, -h         Show this help message

${colors.bright}Examples:${colors.reset}
  node scripts/build-exercise-data.mjs
  node scripts/build-exercise-data.mjs --input ./my-exercises.json
  node scripts/build-exercise-data.mjs --no-validate
`);
}

/**
 * Valid exercise types
 */
const EXERCISE_TYPES = [
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

/**
 * Validate a single exercise
 * @param {Object} exercise - Exercise to validate
 * @param {number} index - Exercise index for error reporting
 * @returns {Object} Validation result with errors and warnings
 */
function validateExercise(exercise, index) {
    const errors = [];
    const warnings = [];

    // Required fields
    const requiredFields = ['id', 'type', 'areaId', 'themeId', 'level', 'difficulty', 'instruction', 'content', 'hints', 'feedbackCorrect', 'feedbackIncorrect'];

    for (const field of requiredFields) {
        if (exercise[field] === undefined || exercise[field] === null) {
            errors.push({
                path: `exercises[${index}].${field}`,
                message: `Missing required field: ${field}`,
            });
        }
    }

    // Validate type
    if (exercise.type && !EXERCISE_TYPES.includes(exercise.type)) {
        errors.push({
            path: `exercises[${index}].type`,
            message: `Invalid exercise type: ${exercise.type}. Valid types: ${EXERCISE_TYPES.join(', ')}`,
        });
    }

    // Validate difficulty (1-3)
    if (exercise.difficulty !== undefined && ![1, 2, 3].includes(exercise.difficulty)) {
        errors.push({
            path: `exercises[${index}].difficulty`,
            message: `Invalid difficulty: ${exercise.difficulty}. Must be 1, 2, or 3.`,
        });
    }

    // Validate level (positive integer)
    if (exercise.level !== undefined && (!Number.isInteger(exercise.level) || exercise.level < 1)) {
        errors.push({
            path: `exercises[${index}].level`,
            message: `Invalid level: ${exercise.level}. Must be a positive integer.`,
        });
    }

    // Validate content based on type
    if (exercise.type && exercise.content) {
        const contentErrors = validateContent(exercise.type, exercise.content, index);
        errors.push(...contentErrors);
    }

    // Warnings for missing optional fields
    if (!exercise.hints || exercise.hints.length === 0) {
        warnings.push({
            path: `exercises[${index}].hints`,
            message: 'No hints provided. Consider adding hints to help learners.',
        });
    }

    return { errors, warnings };
}

/**
 * Validate exercise content based on type
 * @param {string} type - Exercise type
 * @param {Object} content - Exercise content
 * @param {number} index - Exercise index
 * @returns {Array} Array of validation errors
 */
function validateContent(type, content, index) {
    const errors = [];
    const basePath = `exercises[${index}].content`;

    switch (type) {
        case 'fill-blank':
            if (!content.sentence) {
                errors.push({ path: `${basePath}.sentence`, message: 'Missing sentence' });
            }
            if (!content.correctAnswer) {
                errors.push({ path: `${basePath}.correctAnswer`, message: 'Missing correctAnswer' });
            }
            if (content.sentence && !content.sentence.includes('{{blank}}')) {
                errors.push({ path: `${basePath}.sentence`, message: 'Sentence must contain {{blank}} placeholder' });
            }
            break;

        case 'multiple-choice':
            if (!content.question) {
                errors.push({ path: `${basePath}.question`, message: 'Missing question' });
            }
            if (!Array.isArray(content.options) || content.options.length < 2) {
                errors.push({ path: `${basePath}.options`, message: 'Must have at least 2 options' });
            }
            if (typeof content.correctIndex !== 'number' || content.correctIndex < 0) {
                errors.push({ path: `${basePath}.correctIndex`, message: 'Missing or invalid correctIndex' });
            }
            if (Array.isArray(content.options) && content.correctIndex >= content.options.length) {
                errors.push({ path: `${basePath}.correctIndex`, message: 'correctIndex out of bounds' });
            }
            break;

        case 'matching':
            if (!Array.isArray(content.pairs) || content.pairs.length < 2) {
                errors.push({ path: `${basePath}.pairs`, message: 'Must have at least 2 pairs' });
            }
            if (Array.isArray(content.pairs)) {
                content.pairs.forEach((pair, i) => {
                    if (!pair.left || !pair.right) {
                        errors.push({ path: `${basePath}.pairs[${i}]`, message: 'Pair must have left and right' });
                    }
                });
            }
            break;

        case 'sentence-builder':
            if (!Array.isArray(content.columns) || content.columns.length < 2) {
                errors.push({ path: `${basePath}.columns`, message: 'Must have at least 2 columns' });
            }
            if (!Array.isArray(content.targetSentences) || content.targetSentences.length === 0) {
                errors.push({ path: `${basePath}.targetSentences`, message: 'Must have at least 1 target sentence' });
            }
            break;

        case 'sorting':
            if (!Array.isArray(content.categories) || content.categories.length < 2) {
                errors.push({ path: `${basePath}.categories`, message: 'Must have at least 2 categories' });
            }
            if (Array.isArray(content.categories)) {
                content.categories.forEach((cat, i) => {
                    if (!cat.label) {
                        errors.push({ path: `${basePath}.categories[${i}].label`, message: 'Missing category label' });
                    }
                    if (!Array.isArray(cat.items) || cat.items.length === 0) {
                        errors.push({ path: `${basePath}.categories[${i}].items`, message: 'Category must have items' });
                    }
                });
            }
            break;

        case 'writing':
            if (!content.prompt) {
                errors.push({ path: `${basePath}.prompt`, message: 'Missing prompt' });
            }
            if (typeof content.minLength !== 'number' || content.minLength < 1) {
                errors.push({ path: `${basePath}.minLength`, message: 'Invalid minLength' });
            }
            break;

        case 'conjugation-table':
            if (!content.verb) {
                errors.push({ path: `${basePath}.verb`, message: 'Missing verb' });
            }
            if (!content.tense) {
                errors.push({ path: `${basePath}.tense`, message: 'Missing tense' });
            }
            if (!Array.isArray(content.cells) || content.cells.length === 0) {
                errors.push({ path: `${basePath}.cells`, message: 'Must have at least 1 cell' });
            }
            break;

        case 'connector-insert':
            // sentencePart1 can be empty string when connector is at the beginning
            if (content.sentencePart1 === undefined || content.sentencePart1 === null) {
                errors.push({ path: `${basePath}.sentencePart1`, message: 'Missing sentencePart1' });
            }
            if (!content.sentencePart2) {
                errors.push({ path: `${basePath}.sentencePart2`, message: 'Missing sentencePart2' });
            }
            if (!content.correctConnector) {
                errors.push({ path: `${basePath}.correctConnector`, message: 'Missing correctConnector' });
            }
            if (!Array.isArray(content.options) || content.options.length < 2) {
                errors.push({ path: `${basePath}.options`, message: 'Must have at least 2 options' });
            }
            break;

        case 'word-order':
            if (!Array.isArray(content.correctOrder) || content.correctOrder.length < 2) {
                errors.push({ path: `${basePath}.correctOrder`, message: 'Must have at least 2 words' });
            }
            if (!Array.isArray(content.scrambled) || content.scrambled.length !== content.correctOrder?.length) {
                errors.push({ path: `${basePath}.scrambled`, message: 'Scrambled must have same length as correctOrder' });
            }
            break;

        case 'picture-vocabulary':
            if (!content.picture) {
                errors.push({ path: `${basePath}.picture`, message: 'Missing picture' });
            }
            if (!content.pictureAlt) {
                errors.push({ path: `${basePath}.pictureAlt`, message: 'Missing pictureAlt for accessibility' });
            }
            if (!content.correctAnswer) {
                errors.push({ path: `${basePath}.correctAnswer`, message: 'Missing correctAnswer' });
            }
            break;
    }

    return errors;
}

/**
 * Validate all exercises
 * @param {Array} exercises - Array of exercises
 * @returns {Object} Validation result
 */
function validateExercises(exercises) {
    const allErrors = [];
    const allWarnings = [];
    const exerciseIds = new Set();

    exercises.forEach((exercise, index) => {
        // Check for duplicate IDs
        if (exercise.id) {
            if (exerciseIds.has(exercise.id)) {
                allErrors.push({
                    path: `exercises[${index}].id`,
                    message: `Duplicate exercise ID: ${exercise.id}`,
                });
            }
            exerciseIds.add(exercise.id);
        }

        const { errors, warnings } = validateExercise(exercise, index);
        allErrors.push(...errors);
        allWarnings.push(...warnings);
    });

    return { errors: allErrors, warnings: allWarnings };
}

/**
 * Load exercises from JSON file
 * @param {string} inputPath - Path to input file
 * @returns {Object} Loaded exercise data
 */
function loadExercises(inputPath) {
    if (!existsSync(inputPath)) {
        log.warn(`Input file not found: ${inputPath}`);
        log.info('Creating empty exercises file...');
        return { exercises: [] };
    }

    try {
        const content = readFileSync(inputPath, 'utf-8');
        const data = JSON.parse(content);

        // Support both { exercises: [] } and direct array formats
        if (Array.isArray(data)) {
            return { exercises: data };
        }

        return data;
    } catch (error) {
        log.error(`Failed to parse JSON: ${error.message}`);
        throw error;
    }
}

/**
 * Generate exercise statistics
 * @param {Array} exercises - Array of exercises
 * @returns {Object} Statistics object
 */
function generateStats(exercises) {
    const stats = {
        total: exercises.length,
        byType: {},
        byArea: {},
        byTheme: {},
        byDifficulty: { 1: 0, 2: 0, 3: 0 },
    };

    exercises.forEach((exercise) => {
        // Count by type
        const type = exercise.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Count by area
        const area = exercise.areaId || 'unknown';
        stats.byArea[area] = (stats.byArea[area] || 0) + 1;

        // Count by theme
        const theme = exercise.themeId || 'unknown';
        stats.byTheme[theme] = (stats.byTheme[theme] || 0) + 1;

        // Count by difficulty
        const difficulty = exercise.difficulty;
        if ([1, 2, 3].includes(difficulty)) {
            stats.byDifficulty[difficulty]++;
        }
    });

    return stats;
}

/**
 * Build exercise data from configuration files.
 * @param {Object} args - Command line arguments
 */
function buildExerciseData(args) {
    log.header('Building Exercise Data');

    // If --app is specified, use app-specific paths
    if (args.app) {
        const appDir = join(rootDir, 'src', 'apps', args.app);
        args.input = join(appDir, 'exercises.json');
        args.output = join(rootDir, 'public', 'data', args.app, 'exercises.js');

        // Ensure output directory exists
        const outputDir = dirname(args.output);
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        log.info(`Building for app: ${args.app}`);
    }

    // Load exercises
    log.info(`Loading exercises from: ${args.input}`);
    const data = loadExercises(args.input);
    const exercises = data.exercises || [];

    log.info(`Found ${exercises.length} exercises`);

    // Validate if requested
    if (args.validate) {
        log.info('Validating exercises...');
        const { errors, warnings } = validateExercises(exercises);

        if (warnings.length > 0) {
            log.warn(`${warnings.length} validation warning(s):`);
            warnings.slice(0, 5).forEach((w) => {
                console.log(`  ${colors.gray}${w.path}:${colors.reset} ${w.message}`);
            });
            if (warnings.length > 5) {
                console.log(`  ${colors.gray}... and ${warnings.length - 5} more${colors.reset}`);
            }
        }

        if (errors.length > 0) {
            log.error(`${errors.length} validation error(s):`);
            errors.slice(0, 10).forEach((e) => {
                console.log(`  ${colors.gray}${e.path}:${colors.reset} ${e.message}`);
            });
            if (errors.length > 10) {
                console.log(`  ${colors.gray}... and ${errors.length - 10} more${colors.reset}`);
            }
            process.exit(1);
        }

        log.success('All exercises validated successfully');
    }

    // Generate statistics
    const stats = generateStats(exercises);

    // Create output directory if needed
    const outputDir = dirname(args.output);
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    // Build output data
    const outputData = {
        exercises,
        metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0.0',
            count: exercises.length,
            stats,
        },
    };

    // Generate JavaScript file
    const content = `/**
 * Exercise data for Mini Trainer Engine.
 * This file is auto-generated by the build-exercise-data script.
 * Do not edit manually.
 * 
 * Generated: ${outputData.metadata.generatedAt}
 * Exercises: ${outputData.metadata.count}
 */

// Global exercise data object
window.__TRAINER_EXERCISES__ = ${JSON.stringify(outputData, null, 2)};

// Also export for ES modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = outputData;
}
`;

    // Write output file
    writeFileSync(args.output, content, 'utf-8');
    log.success(`Exercise data written to: ${args.output}`);

    // Print summary
    log.header('Summary');
    console.log(`  Total exercises: ${colors.bright}${stats.total}${colors.reset}`);

    console.log(`\n  ${colors.cyan}By Type:${colors.reset}`);
    Object.entries(stats.byType).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
    });

    console.log(`\n  ${colors.cyan}By Difficulty:${colors.reset}`);
    console.log(`    Easy (1): ${stats.byDifficulty[1]}`);
    console.log(`    Medium (2): ${stats.byDifficulty[2]}`);
    console.log(`    Hard (3): ${stats.byDifficulty[3]}`);

    console.log(`\n  ${colors.cyan}By Area:${colors.reset}`);
    Object.entries(stats.byArea).forEach(([area, count]) => {
        console.log(`    ${area}: ${count}`);
    });

    console.log('');
}

// Main entry point
const args = parseArgs();

if (args.help) {
    showHelp();
    process.exit(0);
}

try {
    buildExerciseData(args);
} catch (error) {
    log.error(`Build failed: ${error.message}`);
    console.error(error);
    process.exit(1);
}
