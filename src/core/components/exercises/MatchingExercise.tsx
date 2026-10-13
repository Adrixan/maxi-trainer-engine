import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { optionStyles } from '@core/utils/exerciseStyles';
import type { MatchingContent } from '@/types/exercise';
import { shuffle } from '@core/utils/shuffle';

interface Props {
    content: MatchingContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Matching exercise: match items from the left column to the right column.
 *
 * Matches are tracked by position (left index -> index in the shuffled right
 * column), not by text, so several left items may share the same right-hand
 * answer. All controls are native buttons, which gives keyboard operation
 * (Tab, Enter, Space) for free.
 */
export function MatchingExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();

    // Shuffle the right-hand side once per exercise
    const shuffledRight = useMemo(
        () => shuffle(content.pairs.map((p) => p.right)),
        [content.pairs],
    );

    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    /** left index -> index into shuffledRight */
    const [matches, setMatches] = useState<Record<number, number>>({});

    const leftButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const rightButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const checkButtonRef = useRef<HTMLButtonElement>(null);

    const matchCount = Object.keys(matches).length;
    const allMatched = matchCount === content.pairs.length;
    const rightUsed = new Set(Object.values(matches));

    const textOf = (rightIdx: number | undefined): string | undefined =>
        rightIdx === undefined ? undefined : shuffledRight[rightIdx];

    const focusSoon = (focus: () => void) => {
        setTimeout(focus, 0);
    };

    // Left column: select an item, or unmatch an already matched one
    const handleLeftSelect = (idx: number) => {
        if (showSolution) return;

        if (matches[idx] !== undefined) {
            setMatches((prev) => {
                const next = { ...prev };
                delete next[idx];
                return next;
            });
            setSelectedLeft(null);
            return;
        }

        setSelectedLeft(idx);
        focusSoon(() => {
            const firstFree = shuffledRight.findIndex((_, rIdx) => !rightUsed.has(rIdx));
            rightButtonRefs.current[firstFree]?.focus();
        });
    };

    // Right column: pair the selected left item with this right item
    const handleRightSelect = (rightIdx: number) => {
        if (showSolution || selectedLeft === null || rightUsed.has(rightIdx)) return;

        const next = { ...matches, [selectedLeft]: rightIdx };
        setMatches(next);
        setSelectedLeft(null);

        if (Object.keys(next).length === content.pairs.length) {
            focusSoon(() => checkButtonRef.current?.focus());
        } else {
            const firstUnmatched = content.pairs.findIndex((_, i) => next[i] === undefined);
            focusSoon(() => leftButtonRefs.current[firstUnmatched]?.focus());
        }
    };

    const handleReset = () => {
        setMatches({});
        setSelectedLeft(null);
    };

    const handleCheck = () => {
        if (!allMatched) return;
        const allCorrect = content.pairs.every(
            (pair, idx) => textOf(matches[idx]) === pair.right,
        );
        onSubmit(allCorrect);
    };

    const hasAnyMatch = matchCount > 0;

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-600" id="matching-instruction">
                {t('exercises.matching.instruction')}
            </p>

            <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="matching-instruction">
                {/* Left column */}
                <div className="space-y-2" role="radiogroup" aria-label={t('exercises.matching.leftColumn')}>
                    {content.pairs.map((pair, idx) => {
                        const isSelected = selectedLeft === idx;
                        const matchedValue = textOf(matches[idx]);
                        const isCorrect = showSolution && matchedValue === pair.right;
                        const isWrong = showSolution && matchedValue !== undefined && matchedValue !== pair.right;

                        // Determine option variant for styling
                        const getVariant = (): 'default' | 'selected' | 'correct' | 'incorrect' => {
                            if (isCorrect) return 'correct';
                            if (isWrong) return 'incorrect';
                            if (isSelected) return 'selected';
                            if (matchedValue && !showSolution) return 'selected';
                            return 'default';
                        };

                        return (
                            <button
                                key={idx}
                                ref={(el) => { leftButtonRefs.current[idx] = el; }}
                                onClick={() => handleLeftSelect(idx)}
                                disabled={showSolution}
                                aria-pressed={isSelected}
                                aria-label={`${pair.left}${matchedValue ? `, matched with ${matchedValue}` : ''}`}
                                className={`w-full text-left rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${optionStyles({ variant: getVariant(), size: 'sm' })}`}
                            >
                                <span className="text-gray-800">{pair.left}</span>
                                {matchedValue && !showSolution && (
                                    <span className="flex items-center gap-1 text-xs mt-0.5 text-primary/60">
                                        <span>→ {matchedValue}</span>
                                        <span
                                            className="ml-auto bg-gray-200 text-gray-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] leading-none"
                                            aria-hidden="true"
                                        >
                                            ✕
                                        </span>
                                    </span>
                                )}
                                {matchedValue && showSolution && (
                                    <span className="block text-xs mt-0.5 text-gray-400">
                                        → {matchedValue}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Right column (shuffled) */}
                <div className="space-y-2" role="group" aria-label={t('exercises.matching.rightColumn')}>
                    {shuffledRight.map((rightValue, rIdx) => {
                        const used = rightUsed.has(rIdx);

                        // Determine option variant for styling
                        const getVariant = (): 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' => {
                            if (used && !showSolution) return 'disabled';
                            if (showSolution) {
                                const matchedLeft = Object.entries(matches).find(([, v]) => v === rIdx);
                                if (matchedLeft) {
                                    const correct = content.pairs[Number(matchedLeft[0])]?.right === rightValue;
                                    return correct ? 'correct' : 'incorrect';
                                }
                            }
                            return 'default';
                        };

                        return (
                            <button
                                key={`right-${rIdx}`}
                                ref={(el) => { rightButtonRefs.current[rIdx] = el; }}
                                onClick={() => handleRightSelect(rIdx)}
                                disabled={showSolution || used}
                                aria-disabled={used && !showSolution}
                                aria-label={rightValue}
                                className={`w-full text-left rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${optionStyles({ variant: getVariant(), size: 'sm' })}`}
                            >
                                {rightValue}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Show correct answers on solution */}
            {showSolution && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={t('exercises.matching.solution')}
                    explanation={content.pairs.map((pair) => `${pair.left} → ${pair.right}`).join('\n')}
                    className="whitespace-pre-line"
                />
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Reset + Check buttons */}
            {!showSolution && (
                <div className="flex gap-2">
                    {hasAnyMatch && (
                        <button
                            onClick={handleReset}
                            className="py-3 px-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        >
                            {t('exercises.reset')}
                        </button>
                    )}
                    <button
                        ref={checkButtonRef}
                        onClick={handleCheck}
                        disabled={!allMatched}
                        className="flex-1 py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                    >
                        {t('exercises.check')}
                    </button>
                </div>
            )}
        </div>
    );
}
