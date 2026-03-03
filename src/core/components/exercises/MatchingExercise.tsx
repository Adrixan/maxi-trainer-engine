import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { optionStyles } from '@core/utils/exerciseStyles';
import type { MatchingContent } from '@/types/exercise';
import { shuffle } from '@core/utils/shuffle';
import { useKeyboardNavigation } from '@core/hooks/useKeyboardNavigation';

interface Props {
    content: MatchingContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Matching exercise: match items from left column to right column.
 * Supports tap-to-select and keyboard navigation.
 * Cross-column keyboard navigation: selecting left switches focus to right and vice versa.
 */
export function MatchingExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();

    // Shuffle the right-hand side once on mount
    const shuffledRight = useMemo(
        () => shuffle(content.pairs.map((p) => p.right)),
        // content.pairs is stable from props, only shuffle once on mount
        [],
    );

    const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
    const [matches, setMatches] = useState<Record<number, string>>({});

    // Refs for both columns
    const leftColumnRef = useRef<HTMLDivElement>(null);
    const rightColumnRef = useRef<HTMLDivElement>(null);
    const leftButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const rightButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const checkButtonRef = useRef<HTMLButtonElement>(null);

    // Keyboard navigation for left column
    const leftNav = useKeyboardNavigation<number>({
        items: content.pairs.map((_, i) => i),
        onSelect: useCallback((item: number) => {
            handleLeftSelect(item);
        }, [showSolution]),
        onCancel: useCallback(() => {
            setSelectedLeft(null);
        }, []),
        enabled: !showSolution,
        wrap: true,
        initialIndex: -1,
    });

    // Get available right items (not already used)
    const availableRightItems = useMemo(() => {
        return shuffledRight
            .map((rightValue, rIdx) => ({ rightValue, rIdx }))
            .filter(({ rightValue }) => !Object.values(matches).includes(rightValue));
    }, [shuffledRight, matches]);

    // Keyboard navigation for right column
    const rightNav = useKeyboardNavigation<{ rightValue: string; rIdx: number }>({
        items: availableRightItems,
        onSelect: useCallback((item: { rightValue: string; rIdx: number }) => {
            handleRightSelect(item.rightValue);
        }, [selectedLeft, showSolution]),
        onCancel: useCallback(() => {
            // Return focus to left column
            setSelectedLeft(null);
        }, []),
        enabled: !showSolution && selectedLeft !== null,
        wrap: true,
        initialIndex: -1,
    });

    // Sync button refs for left column
    useEffect(() => {
        leftNav.itemRefs.current = leftButtonRefs.current;
    }, [leftNav]);

    // Sync button refs for right column
    useEffect(() => {
        rightNav.itemRefs.current = rightButtonRefs.current;
    }, [rightNav]);

    // Handle left column selection (keyboard or click)
    const handleLeftSelect = (idx: number) => {
        if (showSolution) return;

        // If this left item already has a match, unmatch it
        if (matches[idx] !== undefined) {
            setMatches((prev) => {
                const next = { ...prev };
                delete next[idx];
                return next;
            });
            setSelectedLeft(null);
            return;
        }

        // Select this left item and switch focus to right column
        setSelectedLeft(idx);

        // Focus the first available (not used) item in the right column
        setTimeout(() => {
            const firstAvailableIdx = rightButtonRefs.current.findIndex((btn) => btn && !btn.disabled);
            if (firstAvailableIdx !== -1 && rightButtonRefs.current[firstAvailableIdx]) {
                rightButtonRefs.current[firstAvailableIdx]?.focus();
            }
        }, 10);
    };

    const handleLeftClick = (idx: number) => {
        handleLeftSelect(idx);
    };

    const handleRightClick = (rightValue: string) => {
        handleRightSelect(rightValue);
    };

    // Handle right column selection (keyboard or click)
    const handleRightSelect = (rightValue: string) => {
        if (showSolution || selectedLeft === null) return;

        // Get the match before updating state
        const currentSelectedLeft = selectedLeft;

        setMatches((prev) => {
            const newMatches = { ...prev, [currentSelectedLeft]: rightValue };
            const isAllMatched = Object.keys(newMatches).length === content.pairs.length;

            // If all pairs are matched, focus the check button
            if (isAllMatched) {
                setTimeout(() => {
                    checkButtonRef.current?.focus();
                }, 10);
            }

            return newMatches;
        });
        setSelectedLeft(null);

        // Switch focus back to left column - find first unmatched item (only if not all matched)
        if (Object.keys(matches).length < content.pairs.length - 1) {
            setTimeout(() => {
                const firstUnmatchedIdx = content.pairs.findIndex((_, idx) => matches[idx] === undefined);
                if (firstUnmatchedIdx !== -1 && leftButtonRefs.current[firstUnmatchedIdx]) {
                    leftButtonRefs.current[firstUnmatchedIdx]?.focus();
                }
            }, 10);
        }
    };

    const handleReset = () => {
        setMatches({});
        setSelectedLeft(null);
    };

    const allMatched = Object.keys(matches).length === content.pairs.length;
    const hasAnyMatch = Object.keys(matches).length > 0;

    const handleCheck = () => {
        if (!allMatched) return;
        const allCorrect = content.pairs.every(
            (pair, idx) => matches[idx] === pair.right,
        );
        onSubmit(allCorrect);
    };

    const rightUsed = new Set(Object.values(matches));

    return (
        <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-600" id="matching-instruction">
                {t('exercises.matching.instruction')}
            </p>

            <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="matching-instruction">
                {/* Left column */}
                <div className="space-y-2" ref={leftColumnRef} role="radiogroup" aria-label={t('exercises.matching.leftColumn')}>
                    {content.pairs.map((pair, idx) => {
                        const isSelected = selectedLeft === idx;
                        const matchedValue = matches[idx];
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
                                onClick={() => handleLeftClick(idx)}
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
                <div className="space-y-2" ref={rightColumnRef} role="group" aria-label={t('exercises.matching.rightColumn')}>
                    {shuffledRight.map((rightValue, rIdx) => {
                        const used = rightUsed.has(rightValue);

                        // Determine option variant for styling
                        const getVariant = (): 'default' | 'selected' | 'correct' | 'incorrect' | 'disabled' => {
                            if (used && !showSolution) return 'disabled';
                            if (showSolution) {
                                const matchEntries = Object.entries(matches);
                                const matchedIdx = matchEntries.find(([, v]) => v === rightValue);
                                if (matchedIdx) {
                                    const idx = Number(matchedIdx[0]);
                                    const correct = content.pairs[idx]?.right === rightValue;
                                    return correct ? 'correct' : 'incorrect';
                                }
                            }
                            return 'default';
                        };

                        return (
                            <button
                                key={`right-${rIdx}`}
                                ref={(el) => { rightButtonRefs.current[rIdx] = el; }}
                                onClick={() => handleRightClick(rightValue)}
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
