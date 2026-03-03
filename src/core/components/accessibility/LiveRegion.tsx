/**
 * Live Region Component for Screen Reader Announcements.
 * 
 * Provides ARIA live regions for announcing dynamic content
 * changes to screen reader users. Supports both polite and
 * assertive announcement modes.
 * 
 * Follows WCAG 2.1 AA guidelines (Success Criterion 4.1.3).
 */

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

/**
 * Announcement priority levels.
 * - 'polite': Waits for user to pause before announcing (default)
 * - 'assertive': Interrupts current announcement immediately
 */
export type AnnouncementPriority = 'polite' | 'assertive';

/**
 * Context for live region announcements.
 */
interface LiveRegionContextValue {
    /** Announce a message to screen readers */
    announce: (message: string, priority?: AnnouncementPriority) => void;
    /** Clear all announcements */
    clear: () => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

/**
 * Hook to access the live region context.
 * Must be used within a LiveRegionProvider.
 */
export function useLiveRegion(): LiveRegionContextValue {
    const context = useContext(LiveRegionContext);
    if (!context) {
        throw new Error('useLiveRegion must be used within a LiveRegionProvider');
    }
    return context;
}

/**
 * Props for LiveRegionProvider component.
 */
interface LiveRegionProviderProps {
    /** Child components */
    children: ReactNode;
}

/**
 * Provider component for live region announcements.
 * 
 * Creates visually hidden live regions that screen readers
 * can use to announce dynamic content changes.
 * 
 * @example
 * ```tsx
 * <LiveRegionProvider>
 *   <App />
 * </LiveRegionProvider>
 * 
 * // In a component:
 * const { announce } = useLiveRegion();
 * announce('Exercise completed successfully!');
 * ```
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
    const politeRegionRef = useRef<HTMLDivElement>(null);
    const assertiveRegionRef = useRef<HTMLDivElement>(null);

    const announce = useCallback((message: string, priority: AnnouncementPriority = 'polite') => {
        const region = priority === 'assertive' ? assertiveRegionRef.current : politeRegionRef.current;
        if (!region) return;

        // Clear the region first to ensure the same message can be announced again
        region.textContent = '';

        // Use a small timeout to ensure the clear is processed
        setTimeout(() => {
            region.textContent = message;
        }, 50);
    }, []);

    const clear = useCallback(() => {
        if (politeRegionRef.current) {
            politeRegionRef.current.textContent = '';
        }
        if (assertiveRegionRef.current) {
            assertiveRegionRef.current.textContent = '';
        }
    }, []);

    return (
        <LiveRegionContext.Provider value={{ announce, clear }}>
            {children}
            {/* Polite live region */}
            <div
                ref={politeRegionRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />
            {/* Assertive live region */}
            <div
                ref={assertiveRegionRef}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className="sr-only"
            />
        </LiveRegionContext.Provider>
    );
}

/**
 * Props for LiveRegion component (standalone usage).
 */
interface LiveRegionProps {
    /** Content to announce */
    children?: ReactNode;
    /** Announcement priority */
    priority?: AnnouncementPriority;
    /** Whether to announce when content changes */
    atomic?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Standalone Live Region component.
 * 
 * Use this for declarative announcements when you want to
 * announce content that's already in the DOM.
 * 
 * @example
 * ```tsx
 * <LiveRegion priority="polite">
 *   {score} points earned!
 * </LiveRegion>
 * ```
 */
export function LiveRegion({
    children,
    priority = 'polite',
    atomic = true,
    className = '',
}: LiveRegionProps) {
    return (
        <div
            role={priority === 'assertive' ? 'alert' : 'status'}
            aria-live={priority}
            aria-atomic={atomic}
            className={`sr-only ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * Announce a message to screen readers without a component.
 * Creates a temporary live region, announces, and removes it.
 * 
 * Useful for imperative announcements in event handlers.
 * 
 * @example
 * ```tsx
 * announce('Item added to cart');
 * announce('Error: Please try again', 'assertive');
 * ```
 */
export function announce(message: string, priority: AnnouncementPriority = 'polite'): void {
    const region = document.createElement('div');
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    document.body.appendChild(region);

    // Clear first, then set message
    region.textContent = '';
    setTimeout(() => {
        region.textContent = message;
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(region);
        }, 1000);
    }, 50);
}

export default LiveRegion;
