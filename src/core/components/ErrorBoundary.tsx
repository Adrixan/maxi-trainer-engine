/**
 * Error Boundary components for graceful error handling.
 * 
 * Provides granular error boundaries at different levels of the application.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { useTranslation } from 'react-i18next';

// ============================================================================
// Types
// ============================================================================

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** Optional name for debugging */
    name?: string;
}

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

// ============================================================================
// Error Boundary Component
// ============================================================================

/**
 * Generic error boundary component.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary name="ExerciseSection" fallback={<ErrorFallback />}>
 *   <ExerciseContent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console in development
        console.error(`ErrorBoundary[${this.props.name ?? 'unnamed'}]:`, error, errorInfo);

        // Call optional error handler
        this.props.onError?.(error, errorInfo);
    }

    private handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    override render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <ErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                    name={this.props.name}
                />
            );
        }

        return this.props.children;
    }
}

// ============================================================================
// Error Fallback Component
// ============================================================================

export interface ErrorFallbackProps {
    error: Error | null;
    onRetry?: (() => void) | undefined;
    name?: string | undefined;
}

/**
 * Default error fallback UI.
 */
export function ErrorFallback({ error, onRetry, name }: ErrorFallbackProps): ReactNode {
    const { t } = useTranslation();

    return (
        <div
            className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-xl"
            role="alert"
            aria-live="assertive"
        >
            <div className="text-4xl mb-4" aria-hidden="true">
                😕
            </div>
            <h2 className="text-lg font-semibold text-red-800 mb-2">
                {t('error.title', 'Something went wrong')}
            </h2>
            <p className="text-sm text-red-600 mb-4 text-center max-w-md">
                {error?.message ?? t('error.unknown', 'An unexpected error occurred')}
            </p>
            {name && (
                <p className="text-xs text-red-400 mb-4">
                    {t('error.component', 'Component')}: {name}
                </p>
            )}
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                    {t('error.retry', 'Try Again')}
                </button>
            )}
        </div>
    );
}

// ============================================================================
// Specialized Error Boundaries
// ============================================================================

/**
 * Error boundary for exercise components.
 * Shows a simplified error message with retry option.
 */
export function ExerciseErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary name="Exercise">
            {children}
        </ErrorBoundary>
    );
}

/**
 * Error boundary for gamification components.
 * Shows a non-intrusive error message without retry.
 */
export function GamificationErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary
            name="Gamification"
            fallback={
                <div className="text-sm text-gray-500 p-2" role="status">
                    {/* Gamification errors are non-critical, just show nothing */}
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

/**
 * Error boundary for settings/profile sections.
 * Shows an error message with retry option.
 */
export function SettingsErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    return (
        <ErrorBoundary name="Settings">
            {children}
        </ErrorBoundary>
    );
}

/**
 * Error boundary for navigation/routing.
 * Shows a full-page error with home navigation.
 */
export function NavigationErrorBoundary({ children }: { children: ReactNode }): ReactNode {
    const { t } = useTranslation();

    return (
        <ErrorBoundary
            name="Navigation"
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
                    <div className="text-6xl mb-4" aria-hidden="true">
                        🧭
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        {t('error.navigation', 'Navigation Error')}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        {t('error.navigationMessage', 'We couldn\'t load this page. Please try going back home.')}
                    </p>
                    <button
                        onClick={() => window.location.hash = '#/'}
                        className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t('common.goHome', 'Go Home')}
                    </button>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}
