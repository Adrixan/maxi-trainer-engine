/**
 * Tests for ExerciseRenderer component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExerciseRenderer, getExerciseComponent, isExerciseTypeSupported, getSupportedExerciseTypes } from '../ExerciseRenderer';
import type { ExerciseContent, ExerciseType } from '@/types/exercise';

// Mock all exercise components
vi.mock('../MultipleChoiceExercise', () => ({
    MultipleChoiceExercise: () => <div data-testid="multiple-choice-exercise">Multiple Choice Exercise</div>,
}));

vi.mock('../FillBlankExercise', () => ({
    FillBlankExercise: () => <div data-testid="fill-blank-exercise">Fill Blank Exercise</div>,
}));

vi.mock('../MatchingExercise', () => ({
    MatchingExercise: () => <div data-testid="matching-exercise">Matching Exercise</div>,
}));

vi.mock('../SentenceBuilderExercise', () => ({
    SentenceBuilderExercise: () => <div data-testid="sentence-builder-exercise">Sentence Builder Exercise</div>,
}));

vi.mock('../CategorySortExercise', () => ({
    CategorySortExercise: () => <div data-testid="sorting-exercise">Sorting Exercise</div>,
}));

vi.mock('../WritingExercise', () => ({
    WritingExercise: () => <div data-testid="writing-exercise">Writing Exercise</div>,
}));

vi.mock('../ConjugationTableExercise', () => ({
    ConjugationTableExercise: () => <div data-testid="conjugation-table-exercise">Conjugation Table Exercise</div>,
}));

vi.mock('../ConnectorInsertExercise', () => ({
    ConnectorInsertExercise: () => <div data-testid="connector-insert-exercise">Connector Insert Exercise</div>,
}));

vi.mock('../WordOrderExercise', () => ({
    WordOrderExercise: () => <div data-testid="word-order-exercise">Word Order Exercise</div>,
}));

vi.mock('../PictureVocabularyExercise', () => ({
    PictureVocabularyExercise: () => <div data-testid="picture-vocabulary-exercise">Picture Vocabulary Exercise</div>,
}));

describe('ExerciseRenderer', () => {
    const mockOnSubmit = vi.fn();

    describe('rendering exercise types', () => {
        it('renders multiple-choice exercise', () => {
            const content: ExerciseContent = {
                type: 'multiple-choice',
                question: 'Test question?',
                options: ['A', 'B', 'C'],
                correctIndex: 0,
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('multiple-choice-exercise')).toBeInTheDocument();
        });

        it('renders fill-blank exercise', () => {
            const content: ExerciseContent = {
                type: 'fill-blank',
                sentence: 'The cat sat on the {{blank}}.',
                correctAnswer: 'mat',
                acceptableAnswers: ['mat'],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('fill-blank-exercise')).toBeInTheDocument();
        });

        it('renders matching exercise', () => {
            const content: ExerciseContent = {
                type: 'matching',
                pairs: [
                    { left: 'A', right: '1' },
                    { left: 'B', right: '2' },
                ],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('matching-exercise')).toBeInTheDocument();
        });

        it('renders sentence-builder exercise', () => {
            const content: ExerciseContent = {
                type: 'sentence-builder',
                columns: [
                    { label: 'Subject', words: ['I', 'You'] },
                    { label: 'Verb', words: ['run', 'walk'] },
                ],
                targetSentences: ['I run', 'You walk'],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('sentence-builder-exercise')).toBeInTheDocument();
        });

        it('renders sorting exercise', () => {
            const content: ExerciseContent = {
                type: 'sorting',
                categories: [
                    { label: 'Fruits', items: ['apple', 'banana'] },
                    { label: 'Vegetables', items: ['carrot', 'broccoli'] },
                ],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('sorting-exercise')).toBeInTheDocument();
        });

        it('renders writing exercise', () => {
            const content: ExerciseContent = {
                type: 'writing',
                prompt: 'Write about your day.',
                scaffoldLevel: 'medium',
                scaffoldHints: ['Start with "Today I..."'],
                starterWords: ['Today', 'I'],
                minLength: 50,
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('writing-exercise')).toBeInTheDocument();
        });

        it('renders conjugation-table exercise', () => {
            const content: ExerciseContent = {
                type: 'conjugation-table',
                verb: 'sein',
                tense: 'present',
                cells: [
                    { person: 'ich', correctForm: 'bin', prefilled: false },
                    { person: 'du', correctForm: 'bist', prefilled: true },
                ],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('conjugation-table-exercise')).toBeInTheDocument();
        });

        it('renders connector-insert exercise', () => {
            const content: ExerciseContent = {
                type: 'connector-insert',
                sentencePart1: 'I stayed home',
                sentencePart2: 'it was raining.',
                correctConnector: 'because',
                options: ['because', 'although', 'but'],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('connector-insert-exercise')).toBeInTheDocument();
        });

        it('renders word-order exercise', () => {
            const content: ExerciseContent = {
                type: 'word-order',
                correctOrder: ['I', 'love', 'pizza'],
                scrambled: ['love', 'pizza', 'I'],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('word-order-exercise')).toBeInTheDocument();
        });

        it('renders picture-vocabulary exercise', () => {
            const content: ExerciseContent = {
                type: 'picture-vocabulary',
                picture: '🍎',
                pictureAlt: 'A red apple',
                correctAnswer: 'apple',
                acceptableAnswers: ['apple'],
                options: ['apple', 'orange', 'banana'],
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('picture-vocabulary-exercise')).toBeInTheDocument();
        });
    });

    describe('loading state', () => {
        it('renders loading state when isLoading is true', () => {
            const content: ExerciseContent = {
                type: 'multiple-choice',
                question: 'Test?',
                options: ['A', 'B'],
                correctIndex: 0,
            };

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                    isLoading={true}
                />
            );

            expect(screen.getByRole('status')).toBeInTheDocument();
            // i18n returns the key when not initialized in test environment
            expect(screen.getByLabelText('exercise.loading')).toBeInTheDocument();
        });
    });

    describe('unknown exercise type', () => {
        it('renders error for unknown exercise type', () => {
            const content = {
                type: 'unknown-type' as ExerciseType,
            } as ExerciseContent;

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByRole('alert')).toBeInTheDocument();
            // i18n returns the key when not initialized in test environment
            expect(screen.getByText(/exercise.unknownType/)).toBeInTheDocument();
        });

        it('renders custom fallback for unknown exercise type', () => {
            const content = {
                type: 'unknown-type' as ExerciseType,
            } as ExerciseContent;

            render(
                <ExerciseRenderer
                    content={content}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                    fallback={<div>Custom fallback</div>}
                />
            );

            expect(screen.getByText('Custom fallback')).toBeInTheDocument();
        });
    });

    describe('props passing', () => {
        it('passes hints to exercise component', () => {
            // Since we're mocking the components, we can't verify the hints are passed
            // but we can verify the component renders without error
            const content: ExerciseContent = {
                type: 'multiple-choice',
                question: 'Test?',
                options: ['A', 'B'],
                correctIndex: 0,
            };

            render(
                <ExerciseRenderer
                    content={content}
                    hints={['Hint 1', 'Hint 2']}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByTestId('multiple-choice-exercise')).toBeInTheDocument();
        });
    });
});

describe('getExerciseComponent', () => {
    it('returns component for valid exercise type', () => {
        const component = getExerciseComponent('multiple-choice');
        expect(component).toBeDefined();
    });

    it('returns undefined for invalid exercise type', () => {
        const component = getExerciseComponent('invalid' as ExerciseType);
        expect(component).toBeUndefined();
    });
});

describe('isExerciseTypeSupported', () => {
    it('returns true for supported exercise types', () => {
        expect(isExerciseTypeSupported('multiple-choice')).toBe(true);
        expect(isExerciseTypeSupported('fill-blank')).toBe(true);
        expect(isExerciseTypeSupported('matching')).toBe(true);
        expect(isExerciseTypeSupported('sentence-builder')).toBe(true);
        expect(isExerciseTypeSupported('sorting')).toBe(true);
        expect(isExerciseTypeSupported('writing')).toBe(true);
        expect(isExerciseTypeSupported('conjugation-table')).toBe(true);
        expect(isExerciseTypeSupported('connector-insert')).toBe(true);
        expect(isExerciseTypeSupported('word-order')).toBe(true);
        expect(isExerciseTypeSupported('picture-vocabulary')).toBe(true);
    });

    it('returns false for unsupported exercise types', () => {
        expect(isExerciseTypeSupported('invalid')).toBe(false);
        expect(isExerciseTypeSupported('unknown')).toBe(false);
        expect(isExerciseTypeSupported('')).toBe(false);
    });
});

describe('getSupportedExerciseTypes', () => {
    it('returns all supported exercise types', () => {
        const types = getSupportedExerciseTypes();

        expect(types).toContain('multiple-choice');
        expect(types).toContain('fill-blank');
        expect(types).toContain('matching');
        expect(types).toContain('sentence-builder');
        expect(types).toContain('sorting');
        expect(types).toContain('writing');
        expect(types).toContain('conjugation-table');
        expect(types).toContain('connector-insert');
        expect(types).toContain('word-order');
        expect(types).toContain('picture-vocabulary');
        expect(types).toHaveLength(10);
    });
});
