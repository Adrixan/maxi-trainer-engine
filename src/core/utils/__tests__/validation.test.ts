/**
 * Tests for validation utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrainerConfig,
    validateExercises,
    validateExercise,
    isValidExerciseType,
    isValidDifficulty,
    isValidLocale,
} from '../validation';
import type { TrainerConfig, Exercise } from '@/types';

// Helper to create a minimal valid trainer config
function createValidConfig(): TrainerConfig {
    return {
        id: 'test-trainer',
        name: 'Test Trainer',
        description: 'Test trainer description',
        version: '1.0.0',
        supportedLocales: ['de', 'en'],
        defaultLocale: 'de',
        subject: {
            id: 'german',
            name: 'German as a Second Language',
            description: 'Test subject',
            targetAudience: 'Students',
            primarySkillArea: 'reading',
            enabledExerciseTypes: ['multiple-choice', 'fill-blank', 'matching'],
        },
        observationAreas: [
            {
                id: 'reading',
                name: 'Reading',
                category: 'receptive',
                stages: [],
            },
            {
                id: 'writing',
                name: 'Writing',
                category: 'productive',
                stages: [],
            },
        ],
        themes: [
            {
                id: 'theme-1',
                name: 'Theme 1',
                description: 'Test theme',
                icon: 'book',
                color: '#4F46E5',
                minLevel: 1,
            },
        ],
        badges: [],
        gamification: {
            starStrategy: 'attempts',
            maxStarsPerExercise: 3,
            levelThresholds: [
                { level: 1, starsRequired: 0 },
                { level: 2, starsRequired: 100 },
                { level: 3, starsRequired: 250 },
            ],
            streakConfig: {
                milestones: [3, 7, 14, 30],
            },
        },
        accessibility: {
            defaultFontSize: 'normal',
            defaultHighContrast: false,
            defaultAnimationsEnabled: true,
            defaultSoundEnabled: true,
        },
    };
}

// Helper to create a minimal valid exercise
function createValidExercise(): Exercise {
    return {
        id: 'ex-1',
        type: 'multiple-choice',
        areaId: 'reading',
        themeId: 'theme-1',
        level: 1,
        difficulty: 1,
        instruction: 'Choose the correct answer',
        content: {
            type: 'multiple-choice',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctIndex: 1,
        },
        hints: [],
        feedbackCorrect: 'Correct!',
        feedbackIncorrect: 'Try again.',
    };
}

describe('validateTrainerConfig', () => {
    it('returns valid for a complete configuration', () => {
        const config = createValidConfig();
        const result = validateTrainerConfig(config);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('returns invalid for null input', () => {
        const result = validateTrainerConfig(null);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe('INVALID_TYPE');
    });

    it('returns invalid for non-object input', () => {
        const result = validateTrainerConfig('not an object');
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe('INVALID_TYPE');
    });

    it('requires id field', () => {
        const config = createValidConfig();
        // Use spread to create a new object without id
        const { id: _, ...configWithoutId } = config;
        const result = validateTrainerConfig(configWithoutId);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'MISSING_ID')).toBe(true);
    });

    it('requires name field', () => {
        const config = createValidConfig();
        const { name: _, ...configWithoutName } = config;
        const result = validateTrainerConfig(configWithoutName);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('requires version field', () => {
        const config = createValidConfig();
        const { version: _, ...configWithoutVersion } = config;
        const result = validateTrainerConfig(configWithoutVersion);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'MISSING_VERSION')).toBe(true);
    });

    it('requires subject configuration', () => {
        const config = createValidConfig();
        const { subject: _, ...configWithoutSubject } = config;
        const result = validateTrainerConfig(configWithoutSubject);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === 'MISSING_SUBJECT')).toBe(true);
    });

    it('requires subject.id', () => {
        const config = createValidConfig();
        const { id: _, ...subjectWithoutId } = config.subject;
        const result = validateTrainerConfig({ ...config, subject: subjectWithoutId });
        expect(result.errors.some(e => e.code === 'MISSING_SUBJECT_ID')).toBe(true);
    });

    it('requires subject.name', () => {
        const config = createValidConfig();
        const { name: _, ...subjectWithoutName } = config.subject;
        const result = validateTrainerConfig({ ...config, subject: subjectWithoutName });
        expect(result.errors.some(e => e.code === 'MISSING_SUBJECT_NAME')).toBe(true);
    });

    it('requires enabledExerciseTypes', () => {
        const config = createValidConfig();
        const result = validateTrainerConfig({
            ...config,
            subject: { ...config.subject, enabledExerciseTypes: [] },
        });
        expect(result.errors.some(e => e.code === 'MISSING_EXERCISE_TYPES')).toBe(true);
    });

    it('requires observationAreas array', () => {
        const config = createValidConfig();
        const { observationAreas: _, ...configWithoutAreas } = config;
        const result = validateTrainerConfig(configWithoutAreas);
        expect(result.errors.some(e => e.code === 'MISSING_AREAS')).toBe(true);
    });

    it('detects duplicate area IDs', () => {
        const config = createValidConfig();
        const result = validateTrainerConfig({
            ...config,
            observationAreas: [...config.observationAreas, { ...config.observationAreas[0]! }],
        });
        expect(result.errors.some(e => e.code === 'DUPLICATE_AREA_ID')).toBe(true);
    });

    it('validates primarySkillArea reference', () => {
        const config = createValidConfig();
        const result = validateTrainerConfig({
            ...config,
            subject: { ...config.subject, primarySkillArea: 'nonexistent' },
        });
        expect(result.errors.some(e => e.code === 'INVALID_PRIMARY_SKILL')).toBe(true);
    });

    it('warns when no themes defined', () => {
        const config = createValidConfig();
        const { themes: _, ...configWithoutThemes } = config;
        const result = validateTrainerConfig(configWithoutThemes);
        expect(result.warnings.some(w => w.code === 'NO_THEMES')).toBe(true);
    });

    it('detects duplicate theme IDs', () => {
        const config = createValidConfig();
        const result = validateTrainerConfig({
            ...config,
            themes: [...config.themes, { ...config.themes[0]! }],
        });
        expect(result.errors.some(e => e.code === 'DUPLICATE_THEME_ID')).toBe(true);
    });

    it('warns when no badges defined', () => {
        const config = createValidConfig();
        const { badges: _, ...configWithoutBadges } = config;
        const result = validateTrainerConfig(configWithoutBadges);
        expect(result.warnings.some(w => w.code === 'NO_BADGES')).toBe(true);
    });
});

describe('validateExercises', () => {
    it('returns valid for valid exercises', () => {
        const config = createValidConfig();
        const exercises = [createValidExercise()];
        const result = validateExercises(exercises, config);
        expect(result.valid).toBe(true);
    });

    it('returns invalid for non-array input', () => {
        const config = createValidConfig();
        const result = validateExercises({}, config);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe('INVALID_TYPE');
    });

    it('requires exercise id', () => {
        const config = createValidConfig();
        const exercise = createValidExercise();
        const { id: _, ...exerciseWithoutId } = exercise;
        const result = validateExercises([exerciseWithoutId], config);
        expect(result.errors.some(e => e.code === 'MISSING_EXERCISE_ID')).toBe(true);
    });

    it('detects duplicate exercise ids', () => {
        const config = createValidConfig();
        const exercise1 = createValidExercise();
        const exercise2 = { ...createValidExercise(), id: exercise1.id };
        const result = validateExercises([exercise1, exercise2], config);
        expect(result.errors.some(e => e.code === 'DUPLICATE_EXERCISE_ID')).toBe(true);
    });

    it('requires exercise type', () => {
        const config = createValidConfig();
        const exercise = createValidExercise();
        const { type: _, ...exerciseWithoutType } = exercise;
        const result = validateExercises([exerciseWithoutType], config);
        expect(result.errors.some(e => e.code === 'MISSING_EXERCISE_TYPE')).toBe(true);
    });

    it('warns for disabled exercise type', () => {
        const config = createValidConfig();
        const exercise: Exercise = {
            ...createValidExercise(),
            type: 'writing',
            content: {
                type: 'writing',
                prompt: 'Write something',
                scaffoldLevel: 'none',
                scaffoldHints: [],
                starterWords: [],
                minLength: 10,
            },
        };
        const result = validateExercises([exercise], config);
        expect(result.warnings.some(w => w.code === 'DISABLED_EXERCISE_TYPE')).toBe(true);
    });

    it('requires areaId', () => {
        const config = createValidConfig();
        const exercise = createValidExercise();
        const { areaId: _, ...exerciseWithoutArea } = exercise;
        const result = validateExercises([exerciseWithoutArea], config);
        expect(result.errors.some(e => e.code === 'MISSING_AREA_REF')).toBe(true);
    });

    it('validates areaId reference', () => {
        const config = createValidConfig();
        const exercise = { ...createValidExercise(), areaId: 'nonexistent' };
        const result = validateExercises([exercise], config);
        expect(result.errors.some(e => e.code === 'INVALID_AREA_REF')).toBe(true);
    });

    it('warns for missing themeId', () => {
        const config = createValidConfig();
        const exercise = createValidExercise();
        const { themeId: _, ...exerciseWithoutTheme } = exercise;
        const result = validateExercises([exerciseWithoutTheme], config);
        expect(result.warnings.some(w => w.code === 'MISSING_THEME_REF')).toBe(true);
    });

    it('warns for invalid themeId reference', () => {
        const config = createValidConfig();
        const exercise = { ...createValidExercise(), themeId: 'nonexistent' };
        const result = validateExercises([exercise], config);
        expect(result.warnings.some(w => w.code === 'INVALID_THEME_REF')).toBe(true);
    });

    it('validates level', () => {
        const config = createValidConfig();
        const exercise = { ...createValidExercise(), level: 0 };
        const result = validateExercises([exercise], config);
        expect(result.errors.some(e => e.code === 'INVALID_LEVEL')).toBe(true);
    });

    it('validates difficulty', () => {
        const config = createValidConfig();
        const exercise = { ...createValidExercise(), difficulty: 5 as 1 | 2 | 3 };
        const result = validateExercises([exercise], config);
        expect(result.errors.some(e => e.code === 'INVALID_DIFFICULTY')).toBe(true);
    });

    it('requires content', () => {
        const config = createValidConfig();
        const exercise = createValidExercise();
        const { content: _, ...exerciseWithoutContent } = exercise;
        const result = validateExercises([exerciseWithoutContent], config);
        expect(result.errors.some(e => e.code === 'MISSING_CONTENT')).toBe(true);
    });

    it('validates content type matches exercise type', () => {
        const config = createValidConfig();
        const exercise: Exercise = {
            ...createValidExercise(),
            content: {
                type: 'fill-blank',
                sentence: 'Test {{blank}}',
                correctAnswer: 'test',
                acceptableAnswers: [],
            },
        };
        const result = validateExercises([exercise], config);
        expect(result.errors.some(e => e.code === 'CONTENT_TYPE_MISMATCH')).toBe(true);
    });
});

describe('validateExercise', () => {
    it('returns valid for a valid exercise', () => {
        const exercise = createValidExercise();
        const result = validateExercise(exercise);
        expect(result.valid).toBe(true);
    });

    it('returns invalid for null input', () => {
        const result = validateExercise(null);
        expect(result.valid).toBe(false);
        expect(result.errors[0]?.code).toBe('INVALID_TYPE');
    });

    it('requires id', () => {
        const exercise = createValidExercise();
        const { id: _, ...exerciseWithoutId } = exercise;
        const result = validateExercise(exerciseWithoutId);
        expect(result.errors.some(e => e.code === 'MISSING_ID')).toBe(true);
    });

    it('requires type', () => {
        const exercise = createValidExercise();
        const { type: _, ...exerciseWithoutType } = exercise;
        const result = validateExercise(exerciseWithoutType);
        expect(result.errors.some(e => e.code === 'MISSING_TYPE')).toBe(true);
    });

    it('requires areaId', () => {
        const exercise = createValidExercise();
        const { areaId: _, ...exerciseWithoutArea } = exercise;
        const result = validateExercise(exerciseWithoutArea);
        expect(result.errors.some(e => e.code === 'MISSING_AREA_ID')).toBe(true);
    });

    it('warns for missing instruction', () => {
        const exercise = createValidExercise();
        const { instruction: _, ...exerciseWithoutInstruction } = exercise;
        const result = validateExercise(exerciseWithoutInstruction);
        expect(result.warnings.some(w => w.code === 'MISSING_INSTRUCTION')).toBe(true);
    });

    it('requires content', () => {
        const exercise = createValidExercise();
        const { content: _, ...exerciseWithoutContent } = exercise;
        const result = validateExercise(exerciseWithoutContent);
        expect(result.errors.some(e => e.code === 'MISSING_CONTENT')).toBe(true);
    });

    it('validates content type matches exercise type', () => {
        const exercise: Exercise = {
            ...createValidExercise(),
            content: {
                type: 'fill-blank',
                sentence: 'Test {{blank}}',
                correctAnswer: 'test',
                acceptableAnswers: [],
            },
        };
        const result = validateExercise(exercise);
        expect(result.errors.some(e => e.code === 'CONTENT_TYPE_MISMATCH')).toBe(true);
    });

    describe('multiple-choice validation', () => {
        it('requires at least 2 options', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                content: {
                    type: 'multiple-choice',
                    question: 'Test?',
                    options: ['only one'],
                    correctIndex: 0,
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'INVALID_OPTIONS')).toBe(true);
        });

        it('validates correctIndex is in range', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                content: {
                    type: 'multiple-choice',
                    question: 'Test?',
                    options: ['a', 'b', 'c'],
                    correctIndex: 5,
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'INVALID_CORRECT_INDEX')).toBe(true);
        });

        it('validates correctIndex is not negative', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                content: {
                    type: 'multiple-choice',
                    question: 'Test?',
                    options: ['a', 'b', 'c'],
                    correctIndex: -1,
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'INVALID_CORRECT_INDEX')).toBe(true);
        });
    });

    describe('fill-blank validation', () => {
        it('requires {{blank}} placeholder', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                type: 'fill-blank',
                content: {
                    type: 'fill-blank',
                    sentence: 'No blank here',
                    correctAnswer: 'test',
                    acceptableAnswers: [],
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'INVALID_BLANK_SENTENCE')).toBe(true);
        });

        it('requires correctAnswer', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                type: 'fill-blank',
                content: {
                    type: 'fill-blank',
                    sentence: 'Fill in the {{blank}}',
                    correctAnswer: '',
                    acceptableAnswers: [],
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'MISSING_CORRECT_ANSWER')).toBe(true);
        });
    });

    describe('matching validation', () => {
        it('requires at least 2 pairs', () => {
            const exercise: Exercise = {
                ...createValidExercise(),
                type: 'matching',
                content: {
                    type: 'matching',
                    pairs: [{ left: 'a', right: '1' }],
                },
            };
            const result = validateExercise(exercise);
            expect(result.errors.some(e => e.code === 'INVALID_PAIRS')).toBe(true);
        });
    });
});

describe('isValidExerciseType', () => {
    it('returns true for valid exercise types', () => {
        expect(isValidExerciseType('multiple-choice')).toBe(true);
        expect(isValidExerciseType('fill-blank')).toBe(true);
        expect(isValidExerciseType('matching')).toBe(true);
        expect(isValidExerciseType('sentence-builder')).toBe(true);
        expect(isValidExerciseType('sorting')).toBe(true);
        expect(isValidExerciseType('writing')).toBe(true);
        expect(isValidExerciseType('conjugation-table')).toBe(true);
        expect(isValidExerciseType('connector-insert')).toBe(true);
        expect(isValidExerciseType('word-order')).toBe(true);
        expect(isValidExerciseType('picture-vocabulary')).toBe(true);
    });

    it('returns false for invalid exercise types', () => {
        expect(isValidExerciseType('invalid-type')).toBe(false);
        expect(isValidExerciseType('')).toBe(false);
        expect(isValidExerciseType(null)).toBe(false);
        expect(isValidExerciseType(undefined)).toBe(false);
        expect(isValidExerciseType(123)).toBe(false);
    });
});

describe('isValidDifficulty', () => {
    it('returns true for valid difficulty levels', () => {
        expect(isValidDifficulty(1)).toBe(true);
        expect(isValidDifficulty(2)).toBe(true);
        expect(isValidDifficulty(3)).toBe(true);
    });

    it('returns false for invalid difficulty levels', () => {
        expect(isValidDifficulty(0)).toBe(false);
        expect(isValidDifficulty(4)).toBe(false);
        expect(isValidDifficulty(-1)).toBe(false);
        expect(isValidDifficulty('1')).toBe(false);
        expect(isValidDifficulty(null)).toBe(false);
        expect(isValidDifficulty(undefined)).toBe(false);
    });
});

describe('isValidLocale', () => {
    it('returns true for valid locale codes', () => {
        expect(isValidLocale('en')).toBe(true);
        expect(isValidLocale('de')).toBe(true);
        expect(isValidLocale('fr')).toBe(true);
        expect(isValidLocale('de-AT')).toBe(true);
        expect(isValidLocale('en-US')).toBe(true);
        expect(isValidLocale('fr-CA')).toBe(true);
    });

    it('returns false for invalid locale codes', () => {
        expect(isValidLocale('')).toBe(false);
        expect(isValidLocale('e')).toBe(false); // Too short
        expect(isValidLocale('eng')).toBe(false); // Too long
        expect(isValidLocale('EN')).toBe(false); // Uppercase
        expect(isValidLocale('de-at')).toBe(false); // Lowercase region
        expect(isValidLocale('de_AT')).toBe(false); // Underscore separator
        expect(isValidLocale(123)).toBe(false);
        expect(isValidLocale(null)).toBe(false);
        expect(isValidLocale(undefined)).toBe(false);
    });
});