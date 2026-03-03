/**
 * Reusable Button component with variants.
 * 
 * Provides consistent styling across the application with support
 * for different intents, sizes, and states.
 */

import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

export type ButtonIntent = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Visual style variant */
    intent?: ButtonIntent;
    /** Size variant */
    size?: ButtonSize;
    /** Full width button */
    fullWidth?: boolean;
    /** Loading state */
    loading?: boolean;
    /** Icon to display before the label */
    startIcon?: React.ReactNode;
    /** Icon to display after the label */
    endIcon?: React.ReactNode;
}

// ============================================================================
// Style Variants
// ============================================================================

const intentStyles: Record<ButtonIntent, string> = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 border border-slate-200',
    accent: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-400',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-base rounded-xl',
    lg: 'px-6 py-3 text-lg rounded-xl',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Button component with consistent styling and accessibility features.
 * 
 * @example
 * // Primary button
 * <Button intent="primary" onClick={handleClick}>
 *   Submit
 * </Button>
 * 
 * @example
 * // Loading state
 * <Button loading>Saving...</Button>
 * 
 * @example
 * // With icons
 * <Button startIcon={<PlusIcon />} endIcon={<ArrowIcon />}>
 *   Add Item
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            intent = 'primary',
            size = 'md',
            fullWidth = false,
            loading = false,
            startIcon,
            endIcon,
            disabled,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const { t } = useTranslation();

        const baseStyles = 'font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 inline-flex items-center justify-center gap-2';
        const disabledStyles = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none';

        const combinedClassName = [
            baseStyles,
            intentStyles[intent],
            sizeStyles[size],
            fullWidth ? 'w-full' : '',
            disabledStyles,
            className,
        ].join(' ').trim();

        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={combinedClassName}
                aria-busy={loading}
                {...props}
            >
                {loading && (
                    <span
                        className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                        aria-hidden="true"
                    />
                )}
                {!loading && startIcon && (
                    <span aria-hidden="true">{startIcon}</span>
                )}
                <span>{loading ? t('common.loading') : children}</span>
                {!loading && endIcon && (
                    <span aria-hidden="true">{endIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
