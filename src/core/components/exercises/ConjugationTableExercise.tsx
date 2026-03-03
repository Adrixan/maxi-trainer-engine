import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { inputFieldStyles } from '@core/utils/exerciseStyles';
import type { ConjugationTableContent } from '@/types/exercise';

interface Props {
    content: ConjugationTableContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Conjugation table exercise: fill in verb conjugation forms.
 * Supports case-sensitive checking with case-error feedback.
 */
export function ConjugationTableExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [inputs, setInputs] = useState<Record<number, string>>({});
    const [results, setResults] = useState<Record<number, boolean | null>>({});
    const [caseWrongCells, setCaseWrongCells] = useState<Record<number, boolean>>({});
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Focus first input on mount and when showing new problem
    useEffect(() => {
        if (!showSolution) {
            firstInputRef.current?.focus();
        }
    }, [showSolution]);

    const handleInputChange = (cellIndex: number, value: string) => {
        if (showSolution) return;
        setInputs((prev) => ({ ...prev, [cellIndex]: value }));
        // Clear case-wrong for this cell on edit
        if (caseWrongCells[cellIndex]) {
            setCaseWrongCells((prev) => ({ ...prev, [cellIndex]: false }));
        }
    };

    const editableCells = content.cells
        .map((cell, idx) => ({ cell, idx }))
        .filter(({ cell }) => !cell.prefilled);

    const allFilled = editableCells.every(
        ({ idx }) => (inputs[idx] ?? '').trim().length > 0,
    );

    const handleCheck = () => {
        if (!allFilled) return;

        const cellResults: Record<number, boolean> = {};
        const cellCaseWrong: Record<number, boolean> = {};
        let allCorrect = true;
        let hasCaseError = false;

        for (const { cell, idx } of editableCells) {
            const userAnswer = (inputs[idx] ?? '').trim();
            const exactCorrect = userAnswer === cell.correctForm;
            const caseInsensitiveCorrect = userAnswer.toLowerCase() === cell.correctForm.toLowerCase();

            if (exactCorrect) {
                cellResults[idx] = true;
                cellCaseWrong[idx] = false;
            } else if (caseInsensitiveCorrect) {
                // Right word, wrong case — don't mark as wrong, flag for case feedback
                cellCaseWrong[idx] = true;
                hasCaseError = true;
                allCorrect = false;
            } else {
                cellResults[idx] = false;
                cellCaseWrong[idx] = false;
                allCorrect = false;
            }
        }

        if (hasCaseError && Object.values(cellResults).every((v) => v === undefined || v === true)) {
            // Only case errors — show case feedback, don't submit
            setCaseWrongCells(cellCaseWrong);
            return;
        }

        setCaseWrongCells({});
        setResults(cellResults);
        onSubmit(allCorrect);
    };

    return (
        <div className="space-y-4">
            {/* Instruction */}
            <p className="text-sm font-semibold text-gray-600" id="conjugation-instruction">
                {t('exercises.conjugationTable.instruction')}
            </p>

            {/* Verb + Tense header */}
            <div className="flex items-center gap-4 bg-primary/10 rounded-xl px-4 py-3">
                <div>
                    <span className="text-xs text-gray-500">{t('exercises.conjugationTable.verb')}:</span>
                    <span className="ml-1 font-bold text-primary text-lg">{content.verb}</span>
                </div>
                <div>
                    <span className="text-xs text-gray-500">{t('exercises.conjugationTable.tense')}:</span>
                    <span className="ml-1 font-semibold text-gray-700">{content.tense}</span>
                </div>
            </div>

            {/* Conjugation table */}
            <div
                className="bg-white rounded-xl shadow overflow-hidden"
                role="grid"
                aria-labelledby="conjugation-instruction"
            >
                {/* Header row */}
                <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200" role="row">
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase" role="columnheader">
                        {t('exercises.conjugationTable.person')}
                    </div>
                    <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase" role="columnheader">
                        {t('exercises.conjugationTable.form')}
                    </div>
                </div>

                {/* Data rows */}
                {content.cells.map((cell, idx) => {
                    const result = results[idx];
                    const isEditable = !cell.prefilled;

                    let rowBg = '';
                    if (showSolution && isEditable) {
                        rowBg = result ? 'bg-green-50' : 'bg-red-50';
                    }

                    return (
                        <div
                            key={cell.person}
                            className={`grid grid-cols-2 border-b border-gray-100 last:border-0 ${rowBg}`}
                            role="row"
                        >
                            <div className="px-4 py-3 font-semibold text-gray-700 text-sm" role="cell">
                                {cell.person}
                            </div>
                            <div className="px-4 py-2 flex items-center" role="cell">
                                {cell.prefilled ? (
                                    <span className="text-sm text-gray-500 italic">{cell.correctForm}</span>
                                ) : (
                                    <div className="relative w-full">
                                        <label className="sr-only" htmlFor={`conjugation-${idx}`}>
                                            {cell.person}
                                        </label>
                                        <input
                                            ref={idx === editableCells[0]?.idx ? firstInputRef : null}
                                            id={`conjugation-${idx}`}
                                            type="text"
                                            value={inputs[idx] ?? ''}
                                            onChange={(e) => handleInputChange(idx, e.target.value)}
                                            disabled={showSolution}
                                            aria-label={cell.person}
                                            aria-invalid={result === false}
                                            aria-describedby={result === false ? `correct-${idx}` : undefined}
                                            className={`w-full px-3 py-1.5 text-sm border-2 rounded-lg focus:outline-none transition-colors ${inputFieldStyles({
                                                state: showSolution
                                                    ? (result === true ? 'correct' : result === false ? 'incorrect' : 'neutral')
                                                    : 'neutral'
                                            })}`}
                                            placeholder="..."
                                        />
                                        {/* Show correct answer on solution */}
                                        {showSolution && result === false && (
                                            <div
                                                id={`correct-${idx}`}
                                                className="text-xs text-green-600 mt-0.5 font-semibold"
                                            >
                                                → {cell.correctForm}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Case-wrong feedback */}
            {Object.values(caseWrongCells).some(Boolean) && !showSolution && (
                <ExerciseFeedback
                    show={true}
                    type="warning"
                    message={t('exercises.fillBlank.wrongCase')}
                />
            )}

            {/* Hints - only show after 3 failed attempts (when showSolution is true) */}
            {hints && hints.length > 0 && showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Check button */}
            {!showSolution && (
                <button
                    onClick={handleCheck}
                    disabled={!allFilled}
                    className="w-full py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                    {t('exercises.check')}
                </button>
            )}
        </div>
    );
}
