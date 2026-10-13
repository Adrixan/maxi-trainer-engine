/**
 * Tests for MatchingExercise component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchingExercise } from '../MatchingExercise';
import type { MatchingContent } from '@/types/exercise';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => ({ 'exercises.check': 'Check', 'exercises.reset': 'Reset' })[key] ?? key,
    }),
}));

// Keep the right column in a deterministic order.
vi.mock('@core/utils/shuffle', () => ({ shuffle: <T,>(items: readonly T[]) => [...items] }));

const content: MatchingContent = {
    type: 'matching',
    pairs: [
        { left: 'Kohlendioxid', right: 'wird aufgenommen' },
        { left: 'Wasser', right: 'wird aufgenommen' },
        { left: 'Sauerstoff', right: 'wird abgegeben' },
    ],
};

/** Match left item `left` with the n-th (0-based) button of the right column. */
function match(left: string, rightIndex: number) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${left}`) }));
    const right = screen
        .getAllByRole('button')
        .filter((b) => ['wird aufgenommen', 'wird abgegeben'].includes(b.getAttribute('aria-label') ?? ''));
    fireEvent.click(right[rightIndex] as HTMLElement);
}

describe('MatchingExercise', () => {
    it('lets several left items share the same right-hand answer', () => {
        const onSubmit = vi.fn();
        render(<MatchingExercise content={content} onSubmit={onSubmit} showSolution={false} />);

        match('Kohlendioxid', 0);
        match('Wasser', 1);
        match('Sauerstoff', 2);

        const check = screen.getByRole('button', { name: 'Check' });
        expect(check).toBeEnabled();
        fireEvent.click(check);
        expect(onSubmit).toHaveBeenCalledWith(true);
    });

    it('accepts either of two identical right-hand items for a left item', () => {
        const onSubmit = vi.fn();
        render(<MatchingExercise content={content} onSubmit={onSubmit} showSolution={false} />);

        // Cross-assign the two identical answers
        match('Kohlendioxid', 1);
        match('Wasser', 0);
        match('Sauerstoff', 2);
        fireEvent.click(screen.getByRole('button', { name: 'Check' }));
        expect(onSubmit).toHaveBeenCalledWith(true);
    });

    it('reports a wrong assignment as incorrect', () => {
        const onSubmit = vi.fn();
        render(<MatchingExercise content={content} onSubmit={onSubmit} showSolution={false} />);

        match('Kohlendioxid', 2);
        match('Wasser', 0);
        match('Sauerstoff', 1);
        fireEvent.click(screen.getByRole('button', { name: 'Check' }));
        expect(onSubmit).toHaveBeenCalledWith(false);
    });

    it('unmatches a left item when it is clicked again', () => {
        render(<MatchingExercise content={content} onSubmit={vi.fn()} showSolution={false} />);

        match('Wasser', 0);
        expect(screen.getByRole('button', { name: /^Wasser/ }).getAttribute('aria-label')).toContain('matched with');
        fireEvent.click(screen.getByRole('button', { name: /^Wasser/ }));
        expect(screen.getByRole('button', { name: /^Wasser/ }).getAttribute('aria-label')).not.toContain('matched with');
    });

    it('keeps the check button disabled until every item is matched', () => {
        render(<MatchingExercise content={content} onSubmit={vi.fn()} showSolution={false} />);
        match('Wasser', 0);
        expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    });
});
