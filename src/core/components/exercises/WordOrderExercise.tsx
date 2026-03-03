import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import type { WordOrderContent } from '@/types/exercise';

interface Props {
    content: WordOrderContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/**
 * Check if the placed words match any valid order.
 */
function checkAgainstAllOrders(placed: string[], content: WordOrderContent): boolean {
    // Check primary order
    if (placed.length === content.correctOrder.length &&
        placed.every((w, i) => w === content.correctOrder[i])) {
        return true;
    }

    // Check alternate orders
    if (content.alternateOrders) {
        for (const order of content.alternateOrders) {
            if (placed.length === order.length &&
                placed.every((w, i) => w === order[i])) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Get all valid orders for display.
 */
function getAllValidOrders(content: WordOrderContent): string[][] {
    const orders = [content.correctOrder];
    if (content.alternateOrders) {
        orders.push(...content.alternateOrders);
    }
    return orders;
}

/**
 * Word order exercise: arrange scrambled words into correct order.
 * Users tap words to place them in sequence.
 */
export function WordOrderExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    // Pool of words still available to place
    const [available, setAvailable] = useState<string[]>([...content.scrambled]);
    // Words the child has placed in order
    const [placed, setPlaced] = useState<string[]>([]);
    const [result, setResult] = useState<boolean | null>(null);

    // Get all valid orders for display
    const allValidOrders = useMemo(() => getAllValidOrders(content), [content]);

    const handleTapWord = (word: string, idx: number) => {
        if (showSolution) return;
        // Move from available to placed
        setAvailable((prev) => {
            const copy = [...prev];
            copy.splice(idx, 1);
            return copy;
        });
        setPlaced((prev) => [...prev, word]);
        // Reset wrong-answer state when re-arranging
        if (result === false) setResult(null);
    };

    const handleTapPlaced = (word: string, idx: number) => {
        if (showSolution) return;
        // Move back from placed to available
        setPlaced((prev) => {
            const copy = [...prev];
            copy.splice(idx, 1);
            return copy;
        });
        setAvailable((prev) => [...prev, word]);
        if (result === false) setResult(null);
    };

    const handleCheck = () => {
        if (placed.length !== content.correctOrder.length) return;
        const isCorrect = checkAgainstAllOrders(placed, content);
        setResult(isCorrect);
        onSubmit(isCorrect);
    };

    const handleReset = () => {
        setAvailable([...content.scrambled]);
        setPlaced([]);
        setResult(null);
    };

    // Find which order matches the placed words for highlighting
    const getMatchingOrder = (placedWords: string[]): string[] | null => {
        if (placedWords.length === 0) return null;

        // Check primary order
        if (placedWords.every((w, i) => w === content.correctOrder[i])) {
            return content.correctOrder;
        }

        // Check alternate orders
        if (content.alternateOrders) {
            for (const order of content.alternateOrders) {
                if (placedWords.every((w, i) => w === order[i])) {
                    return order;
                }
            }
        }

        return null;
    };

    return (
        <div className="space-y-4">
            {/* Sentence construction area */}
            <div
                className="bg-white rounded-xl shadow-sm p-4 min-h-[60px]"
                role="region"
                aria-label={t('exercises.wordOrder.yourSentence')}
            >
                <p className="text-xs text-gray-600 mb-2 font-semibold">
                    {t('exercises.wordOrder.yourSentence')}
                </p>
                <div
                    className="flex flex-wrap gap-2 min-h-[40px]"
                    role="list"
                    aria-label={t('exercises.wordOrder.placedWords')}
                    aria-live="polite"
                >
                    {placed.length === 0 ? (
                        <span className="text-gray-300 italic text-sm">
                            {t('exercises.wordOrder.tapToPlace')}
                        </span>
                    ) : (
                        placed.map((word, idx) => {
                            const matchingOrder = getMatchingOrder(placed.slice(0, idx + 1));
                            const isCorrectSoFar = matchingOrder !== null;

                            return (
                                <button
                                    key={`placed-${idx}`}
                                    onClick={() => handleTapPlaced(word, idx)}
                                    disabled={showSolution}
                                    role="listitem"
                                    aria-label={`${word}, position ${idx + 1}. Click to remove.`}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${showSolution
                                        ? result
                                            ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                            : word === content.correctOrder[idx]
                                                ? 'bg-green-100 text-green-800 border-2 border-green-300'
                                                : 'bg-red-100 text-red-700 border-2 border-red-300'
                                        : isCorrectSoFar
                                            ? 'bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 active:scale-95'
                                            : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200 active:scale-95'
                                        }`}
                                >
                                    {word}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Available words pool */}
            {!showSolution && (
                <div
                    className="bg-gray-50 rounded-xl p-4"
                    role="region"
                    aria-label={t('exercises.wordOrder.availableWords')}
                >
                    <p className="text-xs text-gray-600 mb-2 font-semibold">
                        {t('exercises.wordOrder.availableWords')}
                    </p>
                    <div
                        className="flex flex-wrap gap-2 min-h-[40px]"
                        role="list"
                        aria-label={t('exercises.wordOrder.availableWords')}
                    >
                        {available.length === 0 ? (
                            <span className="text-gray-300 italic text-sm">
                                {t('exercises.wordOrder.allPlaced')}
                            </span>
                        ) : (
                            available.map((word, idx) => (
                                <button
                                    key={`avail-${idx}`}
                                    onClick={() => handleTapWord(word, idx)}
                                    aria-label={`${word}. Click to place.`}
                                    className="px-3 py-1.5 rounded-lg font-bold text-sm bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary active:scale-95 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                >
                                    {word}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Show all correct orders when wrong */}
            {showSolution && result === false && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={allValidOrders.length > 1
                        ? t('exercises.wordOrder.correctOrders', 'Correct sentences:')
                        : t('exercises.wordOrder.correctOrder')}
                    explanation={allValidOrders.map((order) => order.join(' ')).join('\n')}
                    className="whitespace-pre-line"
                />
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Buttons */}
            {!showSolution && (
                <div className="flex gap-2">
                    {placed.length > 0 && (
                        <button
                            onClick={handleReset}
                            aria-label={t('exercises.reset')}
                            className="px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        >
                            🔄
                        </button>
                    )}
                    <button
                        onClick={handleCheck}
                        disabled={placed.length !== content.correctOrder.length}
                        className="flex-1 py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                    >
                        {t('exercises.check')}
                    </button>
                </div>
            )}
        </div>
    );
}
