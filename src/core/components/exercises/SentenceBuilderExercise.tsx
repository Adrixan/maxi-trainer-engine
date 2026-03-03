import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { optionStyles, type OptionVariant } from '@core/utils/exerciseStyles';
import { isValidSubjectVerbAgreement, findSubjectVerbColumns } from '@/core/data';
import type { SentenceBuilderContent } from '@/types/exercise';

interface Props {
    content: SentenceBuilderContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Sentence builder exercise: construct sentences from word columns.
 * Users select one word from each column to build a valid sentence.
 */
export function SentenceBuilderExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [selections, setSelections] = useState<(string | null)[]>(
        content.columns.map(() => null),
    );

    const builtSentence = selections.filter(Boolean).join(' ');
    const allSelected = selections.every((s) => s !== null);

    // Detect subject and verb columns for grammatical validation
    const subjectVerbColumns = useMemo(() => findSubjectVerbColumns(content.columns), [content.columns]);

    const handleSelectWord = (colIndex: number, word: string) => {
        if (showSolution) return;
        const next = [...selections];
        next[colIndex] = selections[colIndex] === word ? null : word;
        setSelections(next);
    };

    const handleCheck = () => {
        if (!allSelected) return;
        const sentence = selections.join(' ').trim();

        // First check if the sentence matches any target sentence exactly
        const matchesTarget = content.targetSentences.some(
            (target) => target.toLowerCase() === sentence.toLowerCase(),
        );

        let isCorrect = matchesTarget;

        // If no exact match, check grammatical validity for subject-verb agreement
        if (!isCorrect && subjectVerbColumns) {
            const subject = selections[subjectVerbColumns.subjectIdx];
            const verb = selections[subjectVerbColumns.verbIdx];

            if (subject && verb) {
                // Check if subject-verb agreement is valid
                const hasValidAgreement = isValidSubjectVerbAgreement(subject, verb);

                // For a valid sentence, we need:
                // 1. Valid subject-verb agreement
                // 2. All columns filled (already checked by allSelected)
                if (hasValidAgreement) {
                    isCorrect = true;
                }
            }
        }

        onSubmit(isCorrect);
    };

    return (
        <div className="space-y-4">
            {/* Instruction */}
            <p className="text-sm font-semibold text-gray-600" id="sentence-builder-instruction">
                {t('exercises.sentenceBuilder.instruction')}
            </p>

            {/* Column word selectors */}
            <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${content.columns.length}, 1fr)` }}
                role="group"
                aria-labelledby="sentence-builder-instruction"
            >
                {content.columns.map((col, colIdx) => (
                    <div key={col.label} className="space-y-1">
                        <div className="text-xs font-bold text-gray-600 uppercase text-center">
                            {col.label}
                        </div>
                        <div className="space-y-1" role="radiogroup" aria-label={col.label}>
                            {col.words.map((word) => {
                                const isSelected = selections[colIdx] === word;
                                const getVariant = (): OptionVariant => {
                                    if (showSolution) {
                                        return isSelected ? 'correct' : 'disabled';
                                    }
                                    return isSelected ? 'selected' : 'default';
                                };

                                return (
                                    <button
                                        key={word}
                                        onClick={() => handleSelectWord(colIdx, word)}
                                        disabled={showSolution}
                                        role="radio"
                                        aria-checked={isSelected}
                                        aria-label={word}
                                        className={`w-full py-2 px-3 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${optionStyles({ variant: getVariant(), size: 'sm' })}`}
                                    >
                                        {word}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Built sentence preview */}
            <div className="bg-gray-50 rounded-xl p-4 min-h-[56px]">
                <div className="text-xs text-gray-600 mb-1">
                    {t('exercises.sentenceBuilder.yourSentence')}
                </div>
                <div
                    className="text-lg font-bold text-gray-800"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {builtSentence || (
                        <span className="text-gray-300 italic">
                            {t('exercises.sentenceBuilder.selectWord')}
                        </span>
                    )}
                </div>
            </div>

            {/* Solution display - show all possible sentences */}
            {showSolution && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={content.targetSentences.length > 1
                        ? t('exercises.sentenceBuilder.possibleSentences', 'Mögliche Sätze:')
                        : t('exercises.solved')}
                    explanation={content.targetSentences.join('\n')}
                    className="whitespace-pre-line"
                />
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Check button */}
            {!showSolution && (
                <button
                    onClick={handleCheck}
                    disabled={!allSelected}
                    className="w-full py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                    {t('exercises.check')}
                </button>
            )}
        </div>
    );
}
