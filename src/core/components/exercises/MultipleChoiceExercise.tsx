import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { optionStyles, type OptionVariant } from '@core/utils/exerciseStyles';
import { useKeyboardNavigation } from '@core/hooks/useKeyboardNavigation';
import { ExerciseFeedback } from './ExerciseFeedback';
import { HintButton } from './HintButton';
import type { MultipleChoiceContent } from '@/types/exercise';

interface Props {
    content: MultipleChoiceContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Multiple choice exercise: select one correct answer from options.
 * Supports keyboard navigation and screen readers.
 * 
 * The onSubmit callback is called with the correctness of the answer.
 * The parent component handles attempt tracking and solution display.
 */
export function MultipleChoiceExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<number | null>(null);
    const checkButtonRef = useRef<HTMLButtonElement>(null);

    // Auto-focus check button after selection
    useEffect(() => {
        if (selected !== null && !showSolution) {
            checkButtonRef.current?.focus();
        }
    }, [selected, showSolution]);

    const handleSelect = useCallback((index: number) => {
        if (showSolution) return;
        setSelected(index);
    }, [showSolution]);

    const handleCheck = useCallback(() => {
        if (selected === null) return;
        // Submit the answer - parent handles attempts and feedback
        onSubmit(selected === content.correctIndex);
    }, [selected, content.correctIndex, onSubmit]);

    // Keyboard navigation hook
    const { focusedIndex, containerRef, itemRefs, focus } = useKeyboardNavigation({
        items: content.options,
        onSelect: (_option, index) => handleSelect(index),
        enabled: !showSolution,
        wrap: true,
        autoFocus: true,
    });

    // Focus first option on mount when no selection made
    useEffect(() => {
        if (!showSolution && selected === null) {
            // Delay slightly to ensure DOM is ready
            const timer = setTimeout(() => {
                focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showSolution, selected, focus]);

    // Determine option variant for styling
    const getOptionVariant = (idx: number): OptionVariant => {
        const isSelected = selected === idx;
        const isCorrectOption = idx === content.correctIndex;

        if (showSolution) {
            if (isCorrectOption) return 'correct';
            if (isSelected && !isCorrectOption) return 'incorrect';
            return 'disabled';
        }
        if (isSelected) return 'selected';
        return 'default';
    };

    // Determine if answer is correct for feedback
    const answerIsCorrect = selected === content.correctIndex;
    const showFeedback = showSolution && selected !== null;

    return (
        <div className="space-y-4">
            {/* Question */}
            <div
                className="bg-white rounded-xl shadow-sm p-4"
                role="region"
                aria-label={t('exercises.multipleChoice.question')}
            >
                <p className="text-lg font-bold text-gray-800">{content.question}</p>
            </div>

            {/* Options */}
            <div
                ref={containerRef}
                className="space-y-2"
                role="radiogroup"
                aria-label={t('exercises.multipleChoice.options')}
                tabIndex={-1}
            >
                {content.options.map((option, idx) => {
                    const isSelected = selected === idx;
                    const isCorrectOption = idx === content.correctIndex;
                    const variant = getOptionVariant(idx);
                    const isFocused = focusedIndex === idx;

                    return (
                        <button
                            key={idx}
                            ref={(el) => { itemRefs.current[idx] = el; }}
                            onClick={() => handleSelect(idx)}
                            disabled={showSolution}
                            role="radio"
                            aria-checked={isSelected}
                            aria-label={`${String.fromCharCode(65 + idx)}: ${option}`}
                            className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${optionStyles({ variant })} ${showSolution ? 'cursor-default' : 'hover:border-primary/50'} ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        >
                            <span className="inline-flex items-center gap-3">
                                <span
                                    className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
                                    aria-hidden="true"
                                >
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{option}</span>
                                {showSolution && isCorrectOption && (
                                    <span className="ml-auto" aria-label={t('exercises.correct')}>&#10003;</span>
                                )}
                                {showSolution && isSelected && !isCorrectOption && (
                                    <span className="ml-auto" aria-label={t('exercises.incorrect')}>&#10007;</span>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Feedback */}
            <ExerciseFeedback
                show={showFeedback}
                type={answerIsCorrect ? 'success' : 'error'}
                message={answerIsCorrect ? t('exercises.correct') : t('exercises.incorrect')}
            />

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Check button */}
            {!showSolution && (
                <button
                    ref={checkButtonRef}
                    onClick={handleCheck}
                    disabled={selected === null}
                    className="w-full py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                    {t('exercises.check')}
                </button>
            )}
        </div>
    );
}
