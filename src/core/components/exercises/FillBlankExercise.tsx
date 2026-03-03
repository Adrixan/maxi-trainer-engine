import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { inputFieldStyles } from '@core/utils/exerciseStyles';
import type { FillBlankContent } from '@/types/exercise';

interface Props {
    content: FillBlankContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

/** Check whether a string is purely a number (digit characters). */
function isNumericAnswer(s: string): boolean {
    return /^\d+$/.test(s.trim());
}

/**
 * Fill-in-the-blank exercise: fill in missing words in sentences.
 * Supports case-sensitive checking with case-error feedback.
 * Includes follow-up for numeric answers requiring word form.
 */
export function FillBlankExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();
    const [answer, setAnswer] = useState('');
    const [caseWrong, setCaseWrong] = useState(false);

    // Ref for the first input for focus management
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Focus first input on mount and when a new exercise loads
    useEffect(() => {
        if (!showSolution) {
            firstInputRef.current?.focus();
        }
    }, [content, showSolution]);

    // Follow-up state: when the child answers with a digit and numericWordForm is set
    const [followUpActive, setFollowUpActive] = useState(false);
    const [followUpAnswer, setFollowUpAnswer] = useState('');
    const [followUpWrong, setFollowUpWrong] = useState(false);
    const followUpRef = useRef<HTMLInputElement>(null);

    const parts = content.sentence.split('{{blank}}');

    // Case-sensitive list for exact matching
    const allAcceptableExact = [content.correctAnswer, ...(content.acceptableAnswers || [])];
    // Case-insensitive list for detecting "right word, wrong case"
    const allAcceptableLower = allAcceptableExact.map((a) => a.toLowerCase());

    const isAnswerExactCorrect = (val: string) => allAcceptableExact.includes(val.trim());
    const isAnswerCaseInsensitive = (val: string) =>
        allAcceptableLower.includes(val.trim().toLowerCase());

    const handleCheck = () => {
        if (!answer.trim()) return;
        const trimmed = answer.trim();

        if (isAnswerExactCorrect(trimmed)) {
            // Fully correct — right word and right case
            setCaseWrong(false);

            if (content.numericWordForm && isNumericAnswer(trimmed)) {
                setFollowUpActive(true);
                setFollowUpWrong(false);
                setTimeout(() => followUpRef.current?.focus(), 50);
                return;
            }

            onSubmit(true);
        } else if (isAnswerCaseInsensitive(trimmed)) {
            // Right word, wrong case — let user fix without counting an attempt
            setCaseWrong(true);
        } else {
            // Wrong answer
            setCaseWrong(false);
            onSubmit(false);
        }
    };

    const handleFollowUpCheck = () => {
        if (!followUpAnswer.trim()) return;
        const wordForm = (content.numericWordForm ?? '').toLowerCase();
        if (followUpAnswer.trim().toLowerCase() === wordForm) {
            // Child wrote the word form correctly → pass
            onSubmit(true);
        } else {
            // Wrong word form — let them try again
            setFollowUpWrong(true);
        }
    };

    const handleFollowUpSkip = () => {
        // Skip the follow-up - the child already got the main answer correct
        onSubmit(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && answer.trim() && !showSolution && !followUpActive) {
            handleCheck();
        }
    };

    const handleAnswerChange = (val: string) => {
        if (showSolution || followUpActive) return;
        setAnswer(val);
        // Clear case-wrong feedback when user edits their answer
        if (caseWrong) setCaseWrong(false);
    };

    const handleFollowUpKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && followUpAnswer.trim() && !showSolution) {
            handleFollowUpCheck();
        }
    };

    // Determine input field state for styling
    const getInputState = (): 'neutral' | 'correct' | 'incorrect' | 'focused' => {
        if (showSolution) {
            return isAnswerExactCorrect(answer) ? 'correct' : 'incorrect';
        }
        if (caseWrong) {
            return 'focused'; // Amber/warning state - use focused with custom override
        }
        if (followUpActive) {
            return 'correct';
        }
        return 'neutral';
    };

    // Custom styling for case-wrong state (amber)
    const caseWrongOverride = caseWrong && !showSolution && !followUpActive
        ? 'border-amber-400 bg-amber-50 text-amber-800'
        : '';

    return (
        <div className="space-y-4">
            {/* Sentence with blank */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <p className="text-lg font-bold text-gray-800 leading-relaxed">
                    {parts[0]}
                    <span className="inline-block align-middle mx-1">
                        <input
                            ref={firstInputRef}
                            type="text"
                            value={answer}
                            onChange={(e) => handleAnswerChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={showSolution || followUpActive}
                            aria-label={t('exercises.fillBlank.answerLabel')}
                            className={`inline-block w-40 px-3 py-1.5 text-base font-bold border-b-4 rounded-lg text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${inputFieldStyles({ state: getInputState() })} ${caseWrongOverride}`}
                            placeholder="..."
                        />
                    </span>
                    {parts[1]}
                </p>
            </div>

            {/* Case-wrong feedback */}
            <ExerciseFeedback
                show={caseWrong && !showSolution && !followUpActive}
                type="warning"
                message={t('exercises.fillBlank.wrongCase')}
                className="animate-bounceIn"
            />

            {/* Follow-up: write the number as a word */}
            {followUpActive && !showSolution && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-fadeIn space-y-3">
                    <p className="text-sm font-semibold text-amber-800">
                        {t('exercises.fillBlank.followUp')}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                            {t('exercises.fillBlank.followUpHint')}
                        </span>
                        <input
                            ref={followUpRef}
                            type="text"
                            value={followUpAnswer}
                            onChange={(e) => setFollowUpAnswer(e.target.value)}
                            onKeyDown={handleFollowUpKeyDown}
                            aria-label={t('exercises.fillBlank.followUpLabel')}
                            className={`flex-1 px-3 py-1.5 text-base font-bold border-b-4 rounded-lg text-center transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 ${inputFieldStyles({ state: followUpWrong ? 'incorrect' : 'neutral' })}`}
                            placeholder={content.numericWordForm ? '...' : ''}
                        />
                    </div>
                    {followUpWrong && (
                        <ExerciseFeedback
                            show={true}
                            type="error"
                            message={t('exercises.incorrect')}
                            className="animate-bounceIn"
                        />
                    )}
                    <button
                        onClick={handleFollowUpCheck}
                        disabled={!followUpAnswer.trim()}
                        className="w-full py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                    >
                        {t('exercises.check')}
                    </button>
                    <button
                        onClick={handleFollowUpSkip}
                        className="w-full py-2 bg-transparent text-amber-600 font-semibold rounded-xl hover:bg-amber-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300"
                    >
                        {t('exercises.skip')}
                    </button>
                </div>
            )}

            {/* Show correct answer when wrong */}
            <ExerciseFeedback
                show={showSolution && !isAnswerExactCorrect(answer)}
                type="success"
                message={t('exercises.fillBlank.correctAnswer')}
                explanation={content.correctAnswer}
                className="animate-fadeIn"
            />

            {/* Hint button + hint text */}
            {hints && hints.length > 0 && !showSolution && !followUpActive && (
                <HintButton hints={hints} />
            )}

            {/* Check button (hidden during follow-up) */}
            {!showSolution && !followUpActive && (
                <button
                    onClick={handleCheck}
                    disabled={!answer.trim()}
                    className="w-full py-3 bg-accent-500 text-white font-bold rounded-xl border-2 border-accent-600 hover:bg-accent-600 disabled:bg-gray-200 disabled:text-gray-600 disabled:border-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2"
                >
                    {t('exercises.check')}
                </button>
            )}
        </div>
    );
}
