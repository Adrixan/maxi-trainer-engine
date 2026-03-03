/**
 * Reusable Card component for consistent container styling.
 * 
 * Provides a flexible container with optional header, footer,
 * and various style variants.
 */

import { forwardRef } from 'react';

// ============================================================================
// Types
// ============================================================================

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Visual style variant */
    variant?: CardVariant;
    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg';
    /** Whether the card is interactive (hover effects) */
    interactive?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Title text */
    title?: string;
    /** Subtitle text */
    subtitle?: string;
    /** Action element (e.g., button) */
    action?: React.ReactNode;
    /** Icon to display before title */
    icon?: React.ReactNode;
}

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Padding override */
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Align content */
    align?: 'left' | 'center' | 'right' | 'between';
}

// ============================================================================
// Style Variants
// ============================================================================

const cardVariantStyles: Record<CardVariant, string> = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-md',
    outlined: 'bg-white border border-gray-200',
    filled: 'bg-gray-50',
};

const paddingStyles: Record<NonNullable<CardProps['padding']>, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
};

const footerAlignStyles: Record<NonNullable<CardFooterProps['align']>, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
};

// ============================================================================
// Components
// ============================================================================

/**
 * Card container component.
 * 
 * @example
 * <Card variant="elevated" padding="lg">
 *   <CardHeader title="Exercise 1" subtitle="Multiple Choice" />
 *   <CardBody>Content here</CardBody>
 *   <CardFooter align="right">
 *     <Button>Next</Button>
 *   </CardFooter>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            interactive = false,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'rounded-xl overflow-hidden';
        const interactiveStyles = interactive
            ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] focus-within:ring-2 focus-within:ring-primary/50'
            : '';

        const combinedClassName = [
            baseStyles,
            cardVariantStyles[variant],
            paddingStyles[padding],
            interactiveStyles,
            className,
        ].join(' ').trim();

        return (
            <div ref={ref} className={combinedClassName} {...props}>
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

/**
 * Card header with title, subtitle, and optional action.
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
    (
        {
            title,
            subtitle,
            action,
            icon,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`flex items-start gap-3 pb-3 border-b border-gray-100 ${className}`}
                {...props}
            >
                {icon && (
                    <span className="flex-shrink-0 text-2xl" aria-hidden="true">
                        {icon}
                    </span>
                )}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                    )}
                    {children}
                </div>
                {action && (
                    <div className="flex-shrink-0">{action}</div>
                )}
            </div>
        );
    }
);

CardHeader.displayName = 'CardHeader';

/**
 * Card body for main content.
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
    (
        {
            padding = 'none',
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`${paddingStyles[padding]} ${className}`.trim()}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardBody.displayName = 'CardBody';

/**
 * Card footer for actions and secondary content.
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
    (
        {
            align = 'right',
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        return (
            <div
                ref={ref}
                className={`flex items-center gap-3 pt-3 mt-3 border-t border-gray-100 ${footerAlignStyles[align]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

CardFooter.displayName = 'CardFooter';
