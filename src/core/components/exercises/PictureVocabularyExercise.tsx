import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { optionStyles, type OptionVariant } from '@core/utils/exerciseStyles';
import type { PictureVocabularyContent } from '@/types/exercise';

interface Props {
    content: PictureVocabularyContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Picture vocabulary exercise: shows an image (emoji/picture) and
 * asks the child to choose the correct word.
 */
export function PictureVocabularyExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<number | null>(null);

    const hasOptions = content.options && content.options.length > 0;

    const handleSelect = (index: number) => {
        if (showSolution) return;
        setSelected(index);
    };

    const handleCheck = () => {
        if (selected === null || !content.options) return;
        const selectedWord = content.options[selected];
        if (!selectedWord) return;
        const isCorrect =
            selectedWord === content.correctAnswer ||
            (content.acceptableAnswers && content.acceptableAnswers.includes(selectedWord));
        onSubmit(isCorrect);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (showSolution) return;

        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                handleSelect(index);
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                if (content.options && index < content.options.length - 1) {
                    const nextButton = document.getElementById(`pic-option-${index + 1}`);
                    nextButton?.focus();
                }
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                if (index > 0) {
                    const prevButton = document.getElementById(`pic-option-${index - 1}`);
                    prevButton?.focus();
                }
                break;
        }
    };

    return (
        <div className="space-y-4">
            {/* Picture display */}
            <div
                className="bg-white rounded-xl shadow-sm p-6 text-center"
                role="img"
                aria-label={content.pictureAlt}
            >
                <div
                    className="text-8xl mb-3 select-none"
                    aria-hidden="true"
                >
                    {content.picture}
                </div>
                <p className="text-lg font-bold text-gray-700">
                    {t('exercises.pictureVocabulary.whatIsThis')}
                </p>
            </div>

            {/* Multiple-choice options */}
            {hasOptions && content.options && (
                <div
                    className="space-y-2"
                    role="radiogroup"
                    aria-label={t('exercises.pictureVocabulary.options')}
                >
                    {content.options.map((option, idx) => {
                        const isSelected = selected === idx;
                        const isCorrect =
                            option === content.correctAnswer ||
                            content.acceptableAnswers?.includes(option);

                        const getVariant = (): OptionVariant => {
                            if (showSolution) {
                                if (isCorrect) return 'correct';
                                if (isSelected && !isCorrect) return 'incorrect';
                                return 'disabled';
                            }
                            if (isSelected) return 'selected';
                            return 'default';
                        };

                        return (
                            <button
                                key={idx}
                                id={`pic-option-${idx}`}
                                onClick={() => handleSelect(idx)}
                                onKeyDown={(e) => handleKeyDown(e, idx)}
                                disabled={showSolution}
                                role="radio"
                                aria-checked={isSelected}
                                aria-label={`${String.fromCharCode(65 + idx)}: ${option}`}
                                className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${optionStyles({ variant: getVariant() })}`}
                            >
                                <span className="inline-flex items-center gap-3">
                                    <span
                                        className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold"
                                        aria-hidden="true"
                                    >
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{option}</span>
                                    {showSolution && isCorrect && (
                                        <span className="ml-auto" aria-label={t('exercises.correct')}>✓</span>
                                    )}
                                    {showSolution && isSelected && !isCorrect && (
                                        <span className="ml-auto" aria-label={t('exercises.incorrect')}>✗</span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Show correct answer in solution mode */}
            {showSolution && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={t('exercises.pictureVocabulary.correctAnswer')}
                    explanation={content.correctAnswer}
                />
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Check button */}
            {!showSolution && hasOptions && (
                <button
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
