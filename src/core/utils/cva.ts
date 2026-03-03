/**
 * Utility for creating variant-styled components using CVA.
 * 
 * @see https://cva.style/docs
 */

import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// Button Variants
// ============================================================================

export const buttonVariants = cva(
    // Base styles
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    {
        variants: {
            variant: {
                primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
                secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
                accent: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
                danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
                ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
            },
            size: {
                sm: 'py-1.5 px-3 text-sm',
                md: 'py-2 px-4 text-base',
                lg: 'py-3 px-6 text-lg',
            },
            fullWidth: {
                true: 'w-full',
                false: '',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            fullWidth: false,
        },
    }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

// ============================================================================
// Card Variants
// ============================================================================

export const cardVariants = cva(
    // Base styles
    'rounded-xl border bg-white',
    {
        variants: {
            variant: {
                default: 'border-gray-200',
                elevated: 'border-gray-200 shadow-lg',
                outline: 'border-gray-300',
            },
            padding: {
                none: '',
                sm: 'p-3',
                md: 'p-4',
                lg: 'p-6',
            },
        },
        defaultVariants: {
            variant: 'default',
            padding: 'md',
        },
    }
);

export type CardVariants = VariantProps<typeof cardVariants>;

// ============================================================================
// Badge Variants
// ============================================================================

export const badgeVariants = cva(
    // Base styles
    'inline-flex items-center rounded-full font-medium',
    {
        variants: {
            variant: {
                default: 'bg-gray-100 text-gray-800',
                success: 'bg-green-100 text-green-800',
                warning: 'bg-yellow-100 text-yellow-800',
                danger: 'bg-red-100 text-red-800',
                info: 'bg-blue-100 text-blue-800',
            },
            size: {
                sm: 'px-2 py-0.5 text-xs',
                md: 'px-2.5 py-1 text-sm',
                lg: 'px-3 py-1.5 text-base',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;

// ============================================================================
// Input Variants
// ============================================================================

export const inputVariants = cva(
    // Base styles
    'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
    {
        variants: {
            variant: {
                default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
                error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
                success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
            },
            size: {
                sm: 'py-1.5 px-3 text-sm',
                md: 'py-2 px-4 text-base',
                lg: 'py-3 px-5 text-lg',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'md',
        },
    }
);

export type InputVariants = VariantProps<typeof inputVariants>;

// ============================================================================
// Progress Bar Variants
// ============================================================================

export const progressVariants = cva(
    // Base styles
    'h-2 rounded-full overflow-hidden bg-gray-200',
    {
        variants: {
            size: {
                sm: 'h-1',
                md: 'h-2',
                lg: 'h-3',
            },
        },
        defaultVariants: {
            size: 'md',
        },
    }
);

export const progressBarVariants = cva(
    // Base styles
    'h-full transition-all duration-300',
    {
        variants: {
            variant: {
                default: 'bg-blue-600',
                success: 'bg-green-600',
                warning: 'bg-yellow-600',
                danger: 'bg-red-600',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export type ProgressVariants = VariantProps<typeof progressVariants>;
export type ProgressBarVariants = VariantProps<typeof progressBarVariants>;

// ============================================================================
// Re-export CVA utilities
// ============================================================================

export { cva, type VariantProps };
