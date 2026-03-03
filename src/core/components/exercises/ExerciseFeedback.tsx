/**
 * ExerciseFeedback Component
 * Centralized feedback display for exercise components
 */

import React, { useEffect } from 'react';
import { feedbackStyles } from '@core/utils/exerciseStyles';
import { useAccessibility } from '@core/hooks/useAccessibility';

export type FeedbackType = 'success' | 'error' | 'info' | 'warning';

export interface ExerciseFeedbackProps {
    /** Whether to show the feedback */
    show: boolean;
    /** Type of feedback */
    type: FeedbackType;
    /** Main feedback message */
    message: string;
    /** Optional detailed explanation */
    explanation?: string;
    /** Optional hint to show */
    hint?: string;
    /** Whether to announce to screen readers */
    announce?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Callback when hint is requested */
    onHintRequest?: () => void;
}

/**
 * Icons for each feedback type
 */
const FeedbackIcon: Record<FeedbackType, React.JSX.Element> = {
    success: (
        <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
            />
        </svg>
    ),
    error: (
        <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
            />
        </svg>
    ),
    info: (
        <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
            />
        </svg>
    ),
    warning: (
        <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
        >
            <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
            />
        </svg>
    ),
};

/**
 * ExerciseFeedback Component
 * 
 * Displays feedback for exercise answers with support for:
 * - Success/error/info/warning states
 * - Optional explanations and hints
 * - Screen reader announcements
 * - Accessible styling
 */
export function ExerciseFeedback({
    show,
    type,
    message,
    explanation,
    hint,
    announce = true,
    className,
    onHintRequest,
}: ExerciseFeedbackProps): React.JSX.Element | null {
    const { announce: announceToScreenReader } = useAccessibility();

    // Announce feedback to screen readers
    useEffect(() => {
        if (show && announce) {
            announceToScreenReader(message, 'polite');
        }
    }, [show, announce, message, announceToScreenReader]);

    if (!show) {
        return null;
    }

    const baseClasses = feedbackStyles({ type });

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`${baseClasses} ${className || ''}`}
        >
            <div className="flex-shrink-0">
                {FeedbackIcon[type]}
            </div>

            <div className="flex-1 min-w-0">
                <p className="font-medium">{message}</p>

                {explanation && (
                    <p className="mt-1 text-sm opacity-90">{explanation}</p>
                )}

                {hint && (
                    <button
                        type="button"
                        onClick={onHintRequest}
                        className="mt-2 text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                    >
                        {hint}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ExerciseFeedback;