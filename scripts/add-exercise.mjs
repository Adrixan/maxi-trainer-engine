#!/usr/bin/env node

/**
 * Interactive script to add new exercises.
 * Prompts for exercise type, collects required fields, generates unique ID,
 * appends to exercises.json, and validates before saving.
 * 
 * Usage:
 *   node scripts/add-exercise.mjs [options]
 * 
 * Options:
 *   --type <type>     Exercise type (skip type prompt)
 *     --file <path>   Exercises file path (default: src/data/exercises.json)
 *   --non-interactive  Use defaults for optional fields
 *   --help           Show help message
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import * as readline from 'readline';

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
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
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
    prompt: (msg) => console.log(`${colors.blue}?${colors.reset} ${msg}`),
};

/**
 * Exercise type definitions with their required fields
 */
const EXERCISE_TYPES = {
    'fill-blank': {
        name: 'Fill in the Blank',
        contentFields: [
            { key: 'sentence', label: 'Sentence (use {{blank}} for blank)', required: true },
            { key: 'correctAnswer', label: 'Correct answer', required: true },
            { key: 'acceptableAnswers', label: 'Acceptable answers (comma-separated)', required: false, default: [] },
            { key: 'numericWordForm', label: 'Numeric word form (optional)', required: false },
        ],
    },
    'multiple-choice': {
        name: 'Multiple Choice',
        contentFields: [
            { key: 'question', label: 'Question', required: true },
            { key: 'options', label: 'Options (comma-separated)', required: true, transform: 'array' },
            { key: 'correctIndex', label: 'Correct option index (0-based)', required: true, transform: 'number' },
        ],
    },
    'matching': {
        name: 'Matching',
        contentFields: [
            { key: 'pairs', label: 'Pairs (left:right, comma-separated)', required: true, transform: 'pairs' },
        ],
    },
    'sentence-builder': {
        name: 'Sentence Builder',
        contentFields: [
            { key: 'columns', label: 'Columns (label:word1,word2;label2:word3)', required: true, transform: 'columns' },
            { key: 'targetSentences', label: 'Target sentences (comma-separated)', required: true, transform: 'array' },
        ],
    },
    'sorting': {
        name: 'Category Sorting',
        contentFields: [
            { key: 'categories', label: 'Categories (label:item1,item2;label2:item3)', required: true, transform: 'categories' },
        ],
    },
    'writing': {
        name: 'Writing',
        contentFields: [
            { key: 'prompt', label: 'Writing prompt', required: true },
            { key: 'scaffoldLevel', label: 'Scaffold level', required: false, default: 'medium' },
            { key: 'scaffoldHints', label: 'Scaffold hints (comma-separated)', required: false, default: [], transform: 'array' },
            { key: 'starterWords', label: 'Starter words (comma-separated)', required: false, default: [], transform: 'array' },
            { key: 'minLength', label: 'Minimum length', required: true, transform: 'number', default: 20 },
        ],
    },
    'conjugation-table': {
        name: 'Conjugation Table',
        contentFields: [
            { key: 'verb', label: 'Verb', required: true },
            { key: 'tense', label: 'Tense', required: true },
            { key: 'cells', label: 'Cells (person:form:prefilled, ...)', required: true, transform: 'cells' },
        ],
    },
    'connector-insert': {
        name: 'Connector Insert',
        contentFields: [
            { key: 'sentencePart1', label: 'First sentence part', required: true },
            { key: 'sentencePart2', label: 'Second sentence part', required: true },
            { key: 'correctConnector', label: 'Correct connector', required: true },
            { key: 'options', label: 'Options (comma-separated)', required: true, transform: 'array' },
        ],
    },
    'word-order': {
        name: 'Word Order',
        contentFields: [
            { key: 'correctOrder', label: 'Correct order (space-separated words)', required: true, transform: 'words' },
        ],
    },
    'picture-vocabulary': {
        name: 'Picture Vocabulary',
        contentFields: [
            { key: 'picture', label: 'Picture (emoji or symbol)', required: true },
            { key: 'pictureAlt', label: 'Picture alt text (for accessibility)', required: true },
            { key: 'correctAnswer', label: 'Correct answer', required: true },
            { key: 'acceptableAnswers', label: 'Acceptable answers (comma-separated)', required: false, default: [] },
            { key: 'options', label: 'Multiple choice options (comma-separated)', required: false, default: [], transform: 'array' },
        ],
    },
};

/**
 * Create readline interface
 */
function createRL() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
}

/**
 * Prompt for user input
 */
function prompt(rl, question, defaultValue = null) {
    return new Promise((resolve) => {
        const defaultHint = defaultValue !== null ? ` [${defaultValue}]` : '';
        rl.question(`${question}${defaultHint}: `, (answer) => {
            resolve(answer.trim() || defaultValue);
        });
    });
}

/**
 * Prompt for selection from a list
 */
function promptSelect(rl, question, options) {
    return new Promise((resolve) => {
        console.log(`\n${question}`);
        options.forEach((opt, i) => {
            console.log(`  ${colors.cyan}${i + 1}.${colors.reset} ${opt}`);
        });

        rl.question('\nSelect (1-' + options.length + '): ', (answer) => {
            const index = parseInt(answer.trim(), 10) - 1;
            if (index >= 0 && index < options.length) {
                resolve(options[index]);
            } else {
                log.warn('Invalid selection, using first option');
                resolve(options[0]);
            }
        });
    });
}

/**
 * Generate unique exercise ID
 */
function generateId(type, existingIds) {
    const prefix = type.replace(/-/g, '-').substring(0, 20);
    let counter = 1;
    let id;

    do {
        id = `${prefix}-${String(counter).padStart(3, '0')}`;
        counter++;
    } while (existingIds.has(id));

    return id;
}

/**
 * Transform input value based on type
 */
function transformValue(value, transform) {
    if (!value) return value;

    switch (transform) {
        case 'array':
            return value.split(',').map(s => s.trim()).filter(Boolean);

        case 'number':
            return parseInt(value, 10) || 0;

        case 'pairs':
            return value.split(',').map(pair => {
                const [left, right] = pair.split(':').map(s => s.trim());
                return { left, right };
            }).filter(p => p.left && p.right);

        case 'columns':
            return value.split(';').map(col => {
                const [label, words] = col.split(':').map(s => s.trim());
                return { label, words: words ? words.split(',').map(w => w.trim()) : [] };
            }).filter(c => c.label);

        case 'categories':
            return value.split(';').map(cat => {
                const [label, items] = cat.split(':').map(s => s.trim());
                return { label, items: items ? items.split(',').map(i => i.trim()) : [] };
            }).filter(c => c.label);

        case 'cells':
            return value.split(',').map(cell => {
                const [person, correctForm, prefilled] = cell.split(':').map(s => s.trim());
                return { person, correctForm, prefilled: prefilled === 'true' };
            }).filter(c => c.person && c.correctForm);

        case 'words':
            return value.split(/\s+/).filter(Boolean);

        default:
            return value;
    }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        type: null,
        file: join(rootDir, 'src', 'data', 'exercises.json'),
        nonInteractive: false,
        help: false,
    };

    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        switch (arg) {
            case '--type':
                args.type = argv[++i];
                break;
            case '--file':
                args.file = resolve(rootDir, argv[++i]);
                break;
            case '--non-interactive':
                args.nonInteractive = true;
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
${colors.bright}add-exercise.mjs${colors.reset}

Interactive script to add new exercises to the exercises.json file.

${colors.bright}Usage:${colors.reset}
  node scripts/add-exercise.mjs [options]

${colors.bright}Options:${colors.reset}
  --type <type>        Exercise type (skip type prompt)
  --file <path>        Exercises file path (default: src/data/exercises.json)
  --non-interactive    Use defaults for optional fields
  --help, -h           Show this help message

${colors.bright}Exercise Types:${colors.reset}
  1. fill-blank        Fill in the blank exercise
  2. multiple-choice   Multiple choice question
  3. matching          Match items from two columns
  4. sentence-builder  Build sentences from word columns
  5. sorting           Sort items into categories
  6. writing           Free writing with scaffolding
  7. conjugation-table Verb conjugation table
  8. connector-insert  Insert connector between sentence parts
  9. word-order        Arrange words in correct order
  10. picture-vocabulary Identify vocabulary from picture

${colors.bright}Example:${colors.reset}
  node scripts/add-exercise.mjs
  node scripts/add-exercise.mjs --type multiple-choice
`);
}

/**
 * Load existing exercises
 */
function loadExercises(filePath) {
    if (!existsSync(filePath)) {
        return { exercises: [] };
    }

    try {
        const content = readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (Array.isArray(data)) {
            return { exercises: data };
        }

        return data;
    } catch (error) {
        log.error(`Failed to load exercises: ${error.message}`);
        throw error;
    }
}

/**
 * Save exercises to file
 */
function saveExercises(filePath, data) {
    try {
        const content = JSON.stringify(data, null, 2);
        writeFileSync(filePath, content, 'utf-8');
        log.success(`Exercises saved to ${filePath}`);
    } catch (error) {
        log.error(`Failed to save exercises: ${error.message}`);
        throw error;
    }
}

/**
 * Validate exercise
 */
function validateExercise(exercise) {
    const errors = [];

    if (!exercise.id) {
        errors.push('Missing exercise ID');
    }

    if (!exercise.type || !EXERCISE_TYPES[exercise.type]) {
        errors.push(`Invalid exercise type: ${exercise.type}`);
    }

    if (!exercise.areaId) {
        errors.push('Missing area ID');
    }

    if (!exercise.themeId) {
        errors.push('Missing theme ID');
    }

    if (!exercise.instruction) {
        errors.push('Missing instruction');
    }

    if (!exercise.content || Object.keys(exercise.content).length === 0) {
        errors.push('Missing content');
    }

    return errors;
}

/**
 * Main function
 */
async function main(args) {
    log.header('Add New Exercise');

    const rl = createRL();

    try {
        // Load existing exercises
        const data = loadExercises(args.file);
        const exercises = data.exercises || [];
        const existingIds = new Set(exercises.map(e => e.id));

        // Get exercise type
        let type = args.type;
        if (!type) {
            const typeOptions = Object.keys(EXERCISE_TYPES);
            type = await promptSelect(rl, 'Select exercise type:', typeOptions);
        }

        if (!EXERCISE_TYPES[type]) {
            log.error(`Invalid exercise type: ${type}`);
            process.exit(1);
        }

        const typeConfig = EXERCISE_TYPES[type];
        log.info(`Creating ${typeConfig.name} exercise\n`);

        // Generate ID
        const id = generateId(type, existingIds);
        log.info(`Generated ID: ${id}`);

        // Collect common fields
        const exercise = {
            id,
            type,
            areaId: await prompt(rl, 'Area ID (e.g., vocabulary, grammar)', 'vocabulary'),
            themeId: await prompt(rl, 'Theme ID (e.g., everyday-life, school)', 'everyday-life'),
            level: parseInt(await prompt(rl, 'Level (1-6)', '1'), 10),
            difficulty: parseInt(await prompt(rl, 'Difficulty (1-3)', '1'), 10),
            instruction: await prompt(rl, 'Instruction'),
        };

        // Collect content fields
        const content = { type };
        log.info('\nEnter content fields:');

        for (const field of typeConfig.contentFields) {
            let value;

            if (field.required) {
                value = await prompt(rl, field.label);
            } else {
                value = await prompt(rl, field.label, field.default ?? '');
            }

            if (field.transform) {
                value = transformValue(value, field.transform);
            }

            if (value !== null && value !== undefined && value !== '') {
                content[field.key] = value;
            } else if (field.required) {
                log.warn(`Required field '${field.key}' is empty`);
            }
        }

        exercise.content = content;

        // Collect hints and feedback
        log.info('\nEnter hints and feedback:');
        exercise.hints = transformValue(
            await prompt(rl, 'Hints (comma-separated)', ''),
            'array'
        );
        exercise.feedbackCorrect = await prompt(rl, 'Feedback for correct answer', 'Correct!');
        exercise.feedbackIncorrect = await prompt(rl, 'Feedback for incorrect answer', 'Try again!');

        // Validate
        const errors = validateExercise(exercise);
        if (errors.length > 0) {
            log.error('Validation errors:');
            errors.forEach(e => console.log(`  - ${e}`));

            const proceed = await prompt(rl, '\nSave anyway? (y/n)', 'n');
            if (proceed.toLowerCase() !== 'y') {
                log.info('Exercise not saved');
                return;
            }
        }

        // Show summary
        log.header('Exercise Summary');
        console.log(JSON.stringify(exercise, null, 2));

        // Confirm save
        const confirm = await prompt(rl, '\nSave this exercise? (y/n)', 'y');
        if (confirm.toLowerCase() === 'y') {
            exercises.push(exercise);
            data.exercises = exercises;
            saveExercises(args.file, data);
            log.success(`Exercise ${id} added successfully!`);
        } else {
            log.info('Exercise not saved');
        }

    } finally {
        rl.close();
    }
}

// Main entry point
const args = parseArgs();

if (args.help) {
    showHelp();
    process.exit(0);
}

main(args).catch((error) => {
    log.error(`Failed to add exercise: ${error.message}`);
    console.error(error);
    process.exit(1);
});
