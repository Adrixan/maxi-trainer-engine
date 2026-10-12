/**
 * Every exercise of every app must render, both while being answered and when
 * the solution is shown. Rendering uses the real exercise components, so content
 * that does not fit a component (the old fill-blank shapes crashed on
 * `content.sentence.split`) fails here rather than in a child's browser.
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import '@core/i18n';
import { getExerciseComponent } from '@core/components/exercises/ExerciseRenderer';
import type { Exercise } from '@/types/exercise';
import { listAppIds, readJson, unwrap } from '../../scripts/lib/app-files.mjs';

const rootDir = process.cwd();

for (const appId of listAppIds(rootDir)) {
    describe(`${appId} exercises`, () => {
        const exercises = (unwrap(readJson(`${rootDir}/src/apps/${appId}/exercises.json`), 'exercises') ?? []) as Exercise[];

        it('renders every exercise, with and without the solution', () => {
            const failures: string[] = [];
            for (const exercise of exercises) {
                const Component = getExerciseComponent(exercise.type);
                if (!Component) {
                    failures.push(`${exercise.id}: no component for ${exercise.type}`);
                    continue;
                }
                for (const showSolution of [false, true]) {
                    try {
                        const html = renderToString(
                            createElement(Component, {
                                content: exercise.content,
                                hints: exercise.hints,
                                onSubmit: () => undefined,
                                showSolution,
                            }),
                        );
                        if (html.length === 0) failures.push(`${exercise.id}: rendered nothing`);
                    } catch (error) {
                        failures.push(`${exercise.id} (solution=${showSolution}): ${(error as Error).message}`);
                    }
                }
            }
            expect(failures).toEqual([]);
        });
    });
}

describe('render check', () => {
    it('would catch content that does not fit its component', () => {
        const Component = getExerciseComponent('fill-blank');
        const legacy = { type: 'fill-blank', question: 'A ___ B', correctAnswers: ['x'] } as unknown as Exercise['content'];
        expect(() =>
            renderToString(createElement(Component, { content: legacy, onSubmit: () => undefined, showSolution: false })),
        ).toThrow();
    });
});
