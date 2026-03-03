import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import type { WritingContent } from '@/types/exercise';
import { shuffle } from '@/core/utils/shuffle';

interface Props {
    content: WritingContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/** Count words in a string (split on whitespace, filter empties). */
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Normalize text for comparison:
 * - Lowercase
 * - Normalize multiple spaces to single space
 * - Trim whitespace
 */
function normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Writing exercise: scaffolded free-writing with a prompt, starter words,
 * and a minimum word count. When correctSentence is provided, operates in
 * strict mode where only the exact correct sentence is accepted.
 */
export function WritingExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    // Track which word indices have been used (by index in shuffled array) - order matters for backspace
    const [usedWordIndices, setUsedWordIndices] = useState<number[]>([]);

    // Determine if we're in strict mode (correctSentence provided)
    const isStrictMode = Boolean(content.correctSentence);

    // Randomize starter words on mount (only in strict mode)
    const shuffledWords = useMemo(() => {
        if (isStrictMode) {
            return shuffle(content.starterWords);
        }
        return content.starterWords;
    }, [content.starterWords, isStrictMode]);

    const wordCount = useMemo(() => countWords(text), [text]);
    const meetsMinimum = wordCount >= content.minLength;

    // In strict mode, check if the text matches the correct sentence
    const isCorrectSentence = useMemo(() => {
        if (!content.correctSentence) return false;
        return normalizeText(text) === normalizeText(content.correctSentence);
    }, [text, content.correctSentence]);

    // Check if all words have been used (based on tracked indices)
    const usedAllWords = useMemo(() => {
        if (!isStrictMode) return true;
        return usedWordIndices.length === shuffledWords.length;
    }, [usedWordIndices, shuffledWords.length, isStrictMode]);

    const handleCheck = useCallback(() => {
        if (isStrictMode) {
            // In strict mode, only accept if the sentence matches exactly
            if (!isCorrectSentence) return;
            onSubmit(true);
        } else {
            // In free mode, accept if minimum word count is met
            if (!meetsMinimum) return;
            onSubmit(true);
        }
    }, [isStrictMode, isCorrectSentence, meetsMinimum, onSubmit]);

    const handleAddStarterWord = useCallback((word: string, index: number) => {
        if (showSolution) return;
        // In strict mode, track the used index
        if (isStrictMode) {
            setUsedWordIndices(prev => [...prev, index]);
        }
        setText((prev) => (prev ? `${prev} ${word}` : word));
    }, [showSolution, isStrictMode]);

    const handleClear = useCallback(() => {
        if (showSolution) return;
        setText('');
        setUsedWordIndices([]);
    }, [showSolution]);

    const handleBackspace = useCallback(() => {
        if (showSolution || !text) return;
        const words = text.trim().split(/\s+/);
        words.pop();
        setText(words.join(' '));
        // In strict mode, remove the last used word index
        if (isStrictMode && usedWordIndices.length > 0) {
            setUsedWordIndices(prev => prev.slice(0, -1));
        }
    }, [showSolution, text, isStrictMode, usedWordIndices.length]);

    // Determine button disabled state
    const canSubmit = isStrictMode ? isCorrectSentence : meetsMinimum;

    return (
        <div className="space-y-4">
            {/* Prompt */}
            <div
                className="bg-primary/5 rounded-xl p-4 border border-primary/10"
                role="region"
                aria-label={t('exercises.writing.prompt')}
            >
                <p className="text-base font-semibold text-gray-800">
                    {content.prompt}
                </p>
            </div>

            {/* Scaffold hints (starter words) */}
            {content.starterWords.length > 0 && !showSolution && (
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                        {t('exercises.writing.starterWords')}
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label={t('exercises.writing.starterWords')}>
                        {shuffledWords.map((word, idx) => {
                            const isUsed = usedWordIndices.includes(idx);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAddStarterWord(word, idx)}
                                    disabled={isUsed}
                                    aria-label={`${t('exercises.writing.addWord')}: ${word}`}
                                    className={`px-2.5 py-1 border-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isUsed
                                        ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border-primary/20 text-primary hover:bg-primary/10'
                                        }`}
                                >
                                    {word}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Scaffold level hint */}
            {content.scaffoldHints.length > 0 && !showSolution && (
                <div
                    className="bg-yellow-50 border border-yellow-200 rounded-xl p-3"
                    role="region"
                    aria-label={t('exercises.writing.scaffoldHints')}
                >
                    {content.scaffoldHints.map((hint, idx) => (
                        <p key={idx} className="text-sm text-yellow-800 font-medium">
                            💡 {hint}
                        </p>
                    ))}
                </div>
            )}

            {/* Text area / Sentence display */}
            <div>
                {isStrictMode ? (
                    // In strict mode, show the constructed sentence as a display area
                    <div
                        className={`w-full min-h-[5rem] p-3 rounded-xl border-2 text-sm font-medium transition-colors ${showSolution
                            ? 'bg-gray-50 border-gray-200 text-gray-600'
                            : 'bg-white border-gray-200 text-gray-800'
                            } ${usedAllWords && !isCorrectSentence ? 'border-orange-300 bg-orange-50' : ''} ${usedAllWords && isCorrectSentence ? 'border-green-300 bg-green-50' : ''
                            }`}
                        aria-live="polite"
                        aria-label={t('exercises.writing.yourSentence')}
                    >
                        {text || (
                            <span className="text-gray-400 italic">
                                {t('exercises.writing.clickWordsPrompt')}
                            </span>
                        )}
                    </div>
                ) : (
                    // In free mode, show a textarea for free writing
                    <>
                        <label className="sr-only" htmlFor="writing-textarea">
                            {t('exercises.writing.placeholder')}
                        </label>
                        <textarea
                            id="writing-textarea"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={showSolution}
                            placeholder={t('exercises.writing.placeholder')}
                            aria-describedby="word-count"
                            className={`w-full h-32 p-3 rounded-xl border-2 text-sm font-medium resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${showSolution
                                ? 'bg-gray-50 border-gray-200 text-gray-600'
                                : 'bg-white border-gray-200 text-gray-800 focus:border-primary'
                                }`}
                        />
                    </>
                )}

                {/* Word count indicator (only in free mode) */}
                {!isStrictMode && (
                    <div id="word-count" className="flex items-center justify-between mt-1">
                        <span className={`text-xs font-semibold ${meetsMinimum ? 'text-green-600' : 'text-gray-600'}`}>
                            {t('exercises.writing.wordCount', { count: wordCount })}
                        </span>
                        <span className="text-xs text-gray-600">
                            {t('exercises.writing.minLength', { count: content.minLength })}
                        </span>
                    </div>
                )}

                {/* Strict mode feedback */}
                {isStrictMode && text && !showSolution && (
                    <div className="mt-1">
                        {isCorrectSentence ? (
                            <span className="text-xs text-green-600 font-semibold">
                                ✓ {t('exercises.writing.correctSentence')}
                            </span>
                        ) : usedAllWords ? (
                            <span className="text-xs text-orange-500 font-semibold">
                                {t('exercises.writing.tryAgain')}
                            </span>
                        ) : (
                            <span className="text-xs text-gray-600">
                                {t('exercises.writing.useAllWords')}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Too short warning (only in free mode) */}
            {!isStrictMode && !showSolution && wordCount > 0 && !meetsMinimum && (
                <p
                    className="text-xs text-orange-500 font-semibold animate-fadeIn"
                    role="alert"
                    aria-live="polite"
                >
                    {t('exercises.writing.tooShort')}
                </p>
            )}

            {/* Control buttons for strict mode */}
            {isStrictMode && !showSolution && (
                <div className="flex gap-2">
                    <button
                        onClick={handleBackspace}
                        disabled={!text}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        aria-label={t('exercises.writing.removeLastWord')}
                    >
                        ⌫ {t('exercises.writing.backspace')}
                    </button>
                    <button
                        onClick={handleClear}
                        disabled={!text}
                        className="flex-1 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                        aria-label={t('exercises.writing.clearAll')}
                    >
                        {t('exercises.writing.clear')}
                    </button>
                </div>
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Check button */}
            {!showSolution && (
                <button
                    onClick={handleCheck}
                    disabled={!canSubmit}
                    className="w-full py-3 bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                    {t('exercises.check')}
                </button>
            )}

            {/* Show correct answer in solution mode */}
            {showSolution && content.correctSentence && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={t('exercises.writing.correctAnswer')}
                    explanation={content.correctSentence}
                />
            )}
        </div>
    );
}
