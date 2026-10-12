/**
 * Content integrity tests: every exercise of every app must satisfy the
 * schema the engine relies on (see scripts/lib/exercise-schema.mjs).
 */

import { describe, it, expect } from 'vitest';
import { join } from 'node:path';
import { listAppIds } from '../../scripts/lib/app-files.mjs';
import { validateAppDir, validateContent } from '../../scripts/lib/app-validation.mjs';

// Vitest runs from the project root.
const rootDir = process.cwd();
const defaultConfigDir = join(rootDir, 'src', 'config');

describe('app content', () => {
    for (const appId of listAppIds(rootDir)) {
        it(`${appId}: all exercises are valid`, () => {
            const { errors } = validateAppDir(rootDir, appId, defaultConfigDir);
            expect(errors.map((e) => `${e.path}: ${e.message}`)).toEqual([]);
        });
    }
});

describe('content validator', () => {
    const base = {
        label: 'test',
        areas: [{ id: 'a' }],
        themes: [{ id: 't' }],
        subject: { enabledExerciseTypes: ['matching', 'fill-blank', 'multiple-choice'] },
    };
    const exercise = (content: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
        id: 'x1', type: content.type, areaId: 'a', themeId: 't', level: 1, difficulty: 1,
        instruction: 'Do it', content, hints: [], feedbackCorrect: 'yes', feedbackIncorrect: 'no', ...extra,
    });
    const errorsFor = (content: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
        validateContent({ ...base, exercises: [exercise(content, extra)] }).errors.map((e) => e.message);

    it('accepts a valid fill-blank', () => {
        expect(errorsFor({ type: 'fill-blank', sentence: 'A {{blank}} B', correctAnswer: 'x', acceptableAnswers: [] })).toEqual([]);
    });

    it('rejects the legacy fill-blank shape', () => {
        const errors = errorsFor({ type: 'fill-blank', question: 'A ___ B', correctAnswers: ['x'] });
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rejects a multiple-choice with an out-of-range answer', () => {
        expect(errorsFor({ type: 'multiple-choice', question: 'q', options: ['a', 'b'], correctIndex: 2 }).join())
            .toContain('out of range of options');
    });

    it('allows case-only differences between options', () => {
        expect(errorsFor({ type: 'multiple-choice', question: 'q', options: ['Der Hund', 'der Hund'], correctIndex: 0 })).toEqual([]);
    });

    it('allows shared right-hand items in matching but not shared left-hand items', () => {
        const ok = errorsFor({ type: 'matching', pairs: [{ left: 'a', right: 'x' }, { left: 'b', right: 'x' }] });
        expect(ok).toEqual([]);
        const bad = errorsFor({ type: 'matching', pairs: [{ left: 'a', right: 'x' }, { left: 'a', right: 'y' }] });
        expect(bad.join()).toContain('left items must be unique');
    });

    it('rejects unknown area and theme references and duplicate ids', () => {
        const result = validateContent({
            ...base,
            exercises: [
                exercise({ type: 'multiple-choice', question: 'q', options: ['a', 'b'], correctIndex: 0 }, { areaId: 'zzz' }),
                exercise({ type: 'multiple-choice', question: 'q', options: ['a', 'b'], correctIndex: 0 }),
                exercise({ type: 'multiple-choice', question: 'q2', options: ['a', 'b'], correctIndex: 1 }),
            ],
        });
        const messages = result.errors.map((e) => e.message);
        expect(messages).toContain("unknown areaId 'zzz'");
        expect(messages).toContain("duplicate id 'x1'");
    });

    it('requires enabledExerciseTypes to cover the used types', () => {
        const { errors } = validateContent({
            ...base,
            subject: { enabledExerciseTypes: ['multiple-choice'] },
            exercises: [exercise({ type: 'matching', pairs: [{ left: 'a', right: 'x' }, { left: 'b', right: 'y' }] })],
        });
        expect(errors.map((e) => e.message).join()).toContain('lacks types used by exercises: matching');
    });
});
