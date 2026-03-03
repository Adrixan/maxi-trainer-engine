/**
 * Exercise Style Utility
 * Centralized styling patterns for exercise components
 */

import { cva, type VariantProps } from './cva';

/**
 * Base style variants for solution states
 */
export const solutionStateStyles = cva(
    'transition-all duration-200 rounded-lg',
    {
        variants: {
            state: {
                neutral: 'bg-white border-2 border-gray-200',
                correct: 'bg-green-50 border-2 border-green-500',
                incorrect: 'bg-red-50 border-2 border-red-500',
                selected: 'bg-blue-50 border-2 border-blue-500',
                disabled: 'bg-gray-100 opacity-50 cursor-not-allowed',
            },
        },
        defaultVariants: {
            state: 'neutral',
        },
    }
);

/**
 * Feedback container styles
 */
export const feedbackStyles = cva(
    'p-4 rounded-lg mt-4 flex items-center gap-3',
    {
        variants: {
            type: {
                success: 'bg-green-100 text-green-800',
                error: 'bg-red-100 text-red-800',
                info: 'bg-blue-100 text-blue-800',
                warning: 'bg-yellow-100 text-yellow-800',
            },
        },
        defaultVariants: {
            type: 'info',
        },
    }
);

/**
 * Option/choice item styles for multiple choice, matching, etc.
 */
export const optionStyles = cva(
    'p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3',
    {
        variants: {
            variant: {
                default: 'bg-white border-2 border-gray-200 hover:border-blue-400',
                selected: 'bg-blue-50 border-2 border-blue-500',
                correct: 'bg-green-50 border-2 border-green-500',
                incorrect: 'bg-red-50 border-2 border-red-500',
                disabled: 'bg-gray-100 opacity-50 cursor-not-allowed',
            },
            size: {
                sm: 'p-2 text-sm',
                md: 'p-3 text-base',
                lg: 'p-4 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

/**
 * Input field styles for fill-blank, writing exercises
 */
export const inputFieldStyles = cva(
    'w-full px-4 py-2 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500',
    {
        variants: {
            state: {
                neutral: 'border-gray-200 bg-white',
                correct: 'border-green-500 bg-green-50',
                incorrect: 'border-red-500 bg-red-50',
                focused: 'border-blue-500 ring-2 ring-blue-500/20',
            },
        },
        defaultVariants: {
            state: 'neutral',
        },
    }
);

/**
 * Hint button styles
 */
export const hintButtonStyles = cva(
    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
    {
        variants: {
            variant: {
                default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                active: 'bg-yellow-100 text-yellow-800',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

// Export types for consumers
export type SolutionState = VariantProps<typeof solutionStateStyles>['state'];
export type FeedbackType = VariantProps<typeof feedbackStyles>['type'];
export type OptionVariant = VariantProps<typeof optionStyles>['variant'];
export type InputFieldState = VariantProps<typeof inputFieldStyles>['state'];

/**
 * Helper function to combine solution state with additional classes
 */
export function getSolutionClasses(
    state: SolutionState,
    additionalClasses?: string
): string {
    const baseClasses = solutionStateStyles({ state });
    return additionalClasses
        ? `${baseClasses} ${additionalClasses}`
        : baseClasses;
}

/**
 * Helper function to get feedback classes
 */
export function getFeedbackClasses(
    type: FeedbackType,
    additionalClasses?: string
): string {
    const baseClasses = feedbackStyles({ type });
    return additionalClasses
        ? `${baseClasses} ${additionalClasses}`
        : baseClasses;
}
