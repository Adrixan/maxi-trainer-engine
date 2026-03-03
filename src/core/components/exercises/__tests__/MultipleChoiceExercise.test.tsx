/**
 * Tests for MultipleChoiceExercise component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultipleChoiceExercise } from '../MultipleChoiceExercise';
import type { MultipleChoiceContent } from '@/types/exercise';

// Mock window.matchMedia for useAccessibility hook
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'exercises.multipleChoice.question': 'Question',
                'exercises.multipleChoice.options': 'Options',
                'exercises.correct': 'Correct',
                'exercises.incorrect': 'Incorrect',
                'exercises.check': 'Check',
            };
            return translations[key] ?? key;
        },
    }),
}));

describe('MultipleChoiceExercise', () => {
    const defaultContent: MultipleChoiceContent = {
        type: 'multiple-choice',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctIndex: 1,
    };

    const mockOnSubmit = vi.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
    });

    describe('rendering', () => {
        it('renders the question', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
        });

        it('renders all options', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByText('London')).toBeInTheDocument();
            expect(screen.getByText('Paris')).toBeInTheDocument();
            expect(screen.getByText('Berlin')).toBeInTheDocument();
            expect(screen.getByText('Madrid')).toBeInTheDocument();
        });

        it('renders option labels (A, B, C, D)', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByText('A')).toBeInTheDocument();
            expect(screen.getByText('B')).toBeInTheDocument();
            expect(screen.getByText('C')).toBeInTheDocument();
            expect(screen.getByText('D')).toBeInTheDocument();
        });

        it('renders check button', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument();
        });

        it('renders hints when provided', () => {
            const hints = ['Think about famous landmarks', 'It\'s known as the City of Light'];

            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    hints={hints}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            // The hint button has aria-label "exercises.hintShow"
            expect(screen.getByRole('button', { name: 'exercises.hintShow' })).toBeInTheDocument();
        });

        it('does not render hints when showSolution is true', () => {
            const hints = ['Think about famous landmarks'];

            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    hints={hints}
                    onSubmit={mockOnSubmit}
                    showSolution={true}
                />
            );

            expect(screen.queryByText('Hint')).not.toBeInTheDocument();
        });
    });

    describe('interaction', () => {
        it('allows selecting an option', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            fireEvent.click(parisOption);

            expect(parisOption).toHaveAttribute('aria-checked', 'true');
        });

        it('allows changing selection', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const londonOption = screen.getByRole('radio', { name: /A: London/ });
            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });

            fireEvent.click(londonOption);
            expect(londonOption).toHaveAttribute('aria-checked', 'true');

            fireEvent.click(parisOption);
            expect(parisOption).toHaveAttribute('aria-checked', 'true');
            expect(londonOption).toHaveAttribute('aria-checked', 'false');
        });

        it('disables check button when no option is selected', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const checkButton = screen.getByRole('button', { name: 'Check' });
            expect(checkButton).toBeDisabled();
        });

        it('enables check button when an option is selected', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            fireEvent.click(parisOption);

            const checkButton = screen.getByRole('button', { name: 'Check' });
            expect(checkButton).not.toBeDisabled();
        });

        it('disables options when showSolution is true', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={true}
                />
            );

            const options = screen.getAllByRole('radio');
            options.forEach(option => {
                expect(option).toBeDisabled();
            });
        });
    });

    describe('answer handling', () => {
        it('calls onSubmit with true when correct answer is selected', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            fireEvent.click(parisOption);

            const checkButton = screen.getByRole('button', { name: 'Check' });
            fireEvent.click(checkButton);

            expect(mockOnSubmit).toHaveBeenCalledWith(true);
        });

        it('calls onSubmit with false when incorrect answer is selected', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const londonOption = screen.getByRole('radio', { name: /A: London/ });
            fireEvent.click(londonOption);

            const checkButton = screen.getByRole('button', { name: 'Check' });
            fireEvent.click(checkButton);

            expect(mockOnSubmit).toHaveBeenCalledWith(false);
        });
    });

    describe('solution display', () => {
        it('shows correct answer indicator when showSolution is true', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={true}
                />
            );

            // The correct answer (Paris) should have a checkmark
            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            expect(parisOption).toHaveTextContent('✓');
        });

        it('hides check button when showSolution is true', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={true}
                />
            );

            expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument();
        });
    });

    describe('accessibility', () => {
        it('has correct radiogroup role', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        });

        it('has correct aria-checked attribute', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            const options = screen.getAllByRole('radio');
            options.forEach(option => {
                expect(option).toHaveAttribute('aria-checked', 'false');
            });

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            fireEvent.click(parisOption);

            expect(parisOption).toHaveAttribute('aria-checked', 'true');
        });

        it('has accessible labels for options', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            expect(screen.getByRole('radio', { name: 'A: London' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: 'B: Paris' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: 'C: Berlin' })).toBeInTheDocument();
            expect(screen.getByRole('radio', { name: 'D: Madrid' })).toBeInTheDocument();
        });
    });

    describe('keyboard navigation', () => {
        it('selects option on Enter key via container navigation', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            // The keyboard navigation works at the container level
            const radiogroup = screen.getByRole('radiogroup');

            // Navigate to second option (Paris) using ArrowDown
            fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
            fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });

            // Select with Enter
            fireEvent.keyDown(radiogroup, { key: 'Enter' });

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            expect(parisOption).toHaveAttribute('aria-checked', 'true');
        });

        it('selects option on Space key via container navigation', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={false}
                />
            );

            // The keyboard navigation works at the container level
            const radiogroup = screen.getByRole('radiogroup');

            // Navigate to second option (Paris) using ArrowDown
            fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
            fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });

            // Select with Space
            fireEvent.keyDown(radiogroup, { key: ' ' });

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            expect(parisOption).toHaveAttribute('aria-checked', 'true');
        });

        it('does not respond to keyboard when showSolution is true', () => {
            render(
                <MultipleChoiceExercise
                    content={defaultContent}
                    onSubmit={mockOnSubmit}
                    showSolution={true}
                />
            );

            const parisOption = screen.getByRole('radio', { name: /B: Paris/ });
            const initialState = parisOption.getAttribute('aria-checked');

            const radiogroup = screen.getByRole('radiogroup');
            fireEvent.keyDown(radiogroup, { key: 'ArrowDown' });
            fireEvent.keyDown(radiogroup, { key: 'Enter' });

            // State should not change
            expect(parisOption).toHaveAttribute('aria-checked', initialState);
        });
    });
});
