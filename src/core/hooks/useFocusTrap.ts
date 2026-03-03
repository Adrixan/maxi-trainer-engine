import { useEffect, useRef, useCallback } from 'react';

/**
 * Options for useFocusTrap hook.
 */
interface UseFocusTrapOptions {
    /** Whether the focus trap is active */
    active?: boolean;
    /** Whether to auto-focus the first element when activated */
    autoFocus?: boolean;
    /** Selector for elements to exclude from the focus trap */
    excludeSelector?: string;
    /** Callback when escape key is pressed */
    onEscape?: () => void;
}

/**
 * Hook for trapping focus within a container element.
 * Essential for modal dialogs and other overlay components.
 * 
 * @example
 * ```tsx
 * const Modal = ({ isOpen, onClose }) => {
 *   const containerRef = useFocusTrap({ active: isOpen, onEscape: onClose });
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div ref={containerRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       {/* Other focusable elements *\/}
 *     </div>
 *   );
 * };
 * ```
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
    options: UseFocusTrapOptions = {}
) {
    const {
        active = true,
        autoFocus = true,
        excludeSelector,
        onEscape,
    } = options;

    const containerRef = useRef<T>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    /**
     * Get all focusable elements within the container.
     */
    const getFocusableElements = useCallback(() => {
        const container = containerRef.current;
        if (!container) return [];

        const selector = [
            'button:not([disabled])',
            '[href]',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const elements = Array.from(container.querySelectorAll<HTMLElement>(selector));

        // Filter out excluded elements
        if (excludeSelector) {
            const excluded = new Set(container.querySelectorAll(excludeSelector));
            return elements.filter((el) => !excluded.has(el));
        }

        return elements;
    }, [excludeSelector]);

    /**
     * Handle focus movement.
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!active) return;

        // Handle escape key
        if (e.key === 'Escape' && onEscape) {
            e.preventDefault();
            onEscape();
            return;
        }

        // Handle tab key
        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (!firstElement || !lastElement) return;

        if (e.shiftKey) {
            // Shift + Tab: moving backwards
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab: moving forwards
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }, [active, getFocusableElements, onEscape]);

    // Set up focus trap when active
    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        // Store the previously focused element
        previousFocusRef.current = document.activeElement as HTMLElement;

        // Add event listener
        document.addEventListener('keydown', handleKeyDown);

        // Auto-focus first element
        if (autoFocus) {
            const focusableElements = getFocusableElements();
            if (focusableElements.length > 0) {
                // Use a small timeout to ensure the container is rendered
                setTimeout(() => {
                    focusableElements[0]?.focus();
                }, 50);
            }
        }

        // Cleanup
        return () => {
            document.removeEventListener('keydown', handleKeyDown);

            // Restore focus to the previously focused element
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                previousFocusRef.current.focus();
            }
        };
    }, [active, autoFocus, getFocusableElements, handleKeyDown]);

    return containerRef;
}

/**
 * Hook for managing focus within a list of items.
 * Useful for navigation menus, lists, and grids.
 */
export function useFocusNavigation<T extends HTMLElement = HTMLDivElement>(
    options: {
        /** Selector for focusable items within the container */
        itemSelector?: string;
        /** Whether the navigation is active */
        active?: boolean;
        /** Orientation of the navigation */
        orientation?: 'horizontal' | 'vertical' | 'grid';
        /** Number of columns for grid orientation */
        columns?: number;
        /** Whether to wrap around at the ends */
        wrap?: boolean;
    } = {}
) {
    const {
        itemSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        active = true,
        orientation = 'vertical',
        columns = 1,
        wrap = true,
    } = options;

    const containerRef = useRef<T>(null);
    const focusIndexRef = useRef(0);

    /**
     * Get all focusable items within the container.
     */
    const getItems = useCallback(() => {
        const container = containerRef.current;
        if (!container) return [];
        return Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    }, [itemSelector]);

    /**
     * Focus an item by index.
     */
    const focusItem = useCallback((index: number) => {
        const items = getItems();
        if (items.length === 0) return;

        let newIndex = index;

        if (wrap) {
            if (newIndex < 0) newIndex = items.length - 1;
            if (newIndex >= items.length) newIndex = 0;
        } else {
            newIndex = Math.max(0, Math.min(newIndex, items.length - 1));
        }

        focusIndexRef.current = newIndex;
        items[newIndex]?.focus();
    }, [getItems, wrap]);

    /**
     * Handle keyboard navigation.
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!active) return;

        const items = getItems();
        if (items.length === 0) return;

        const currentIndex = focusIndexRef.current;

        switch (e.key) {
            case 'ArrowDown':
                if (orientation === 'vertical' || orientation === 'grid') {
                    e.preventDefault();
                    const step = orientation === 'grid' ? columns : 1;
                    focusItem(currentIndex + step);
                }
                break;

            case 'ArrowUp':
                if (orientation === 'vertical' || orientation === 'grid') {
                    e.preventDefault();
                    const step = orientation === 'grid' ? columns : 1;
                    focusItem(currentIndex - step);
                }
                break;

            case 'ArrowRight':
                if (orientation === 'horizontal' || orientation === 'grid') {
                    e.preventDefault();
                    focusItem(currentIndex + 1);
                }
                break;

            case 'ArrowLeft':
                if (orientation === 'horizontal' || orientation === 'grid') {
                    e.preventDefault();
                    focusItem(currentIndex - 1);
                }
                break;

            case 'Home':
                e.preventDefault();
                focusItem(0);
                break;

            case 'End':
                e.preventDefault();
                focusItem(items.length - 1);
                break;
        }
    }, [active, getItems, orientation, columns, focusItem]);

    // Set up event listener
    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [active, handleKeyDown]);

    return {
        containerRef,
        focusItem,
        focusFirst: () => focusItem(0),
        focusLast: () => focusItem(getItems().length - 1),
        currentIndex: focusIndexRef.current,
    };
}

/**
 * Hook for managing roving tabindex within a group.
 * Only one element in the group has tabindex="0" at a time.
 */
export function useRovingTabIndex<T extends HTMLElement = HTMLDivElement>(
    options: {
        /** Selector for items within the container */
        itemSelector?: string;
        /** Whether the roving tabindex is active */
        active?: boolean;
    } = {}
) {
    const { itemSelector = 'button, [href], input, select, textarea', active = true } = options;

    const containerRef = useRef<T>(null);
    const currentIndexRef = useRef(0);

    /**
     * Get all items within the container.
     */
    const getItems = useCallback(() => {
        const container = containerRef.current;
        if (!container) return [];
        return Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    }, [itemSelector]);

    /**
     * Update tabindex attributes.
     */
    const updateTabindex = useCallback((focusedIndex: number) => {
        const items = getItems();
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === focusedIndex ? '0' : '-1');
        });
        currentIndexRef.current = focusedIndex;
    }, [getItems]);

    /**
     * Handle focus event.
     */
    const handleFocus = useCallback((e: FocusEvent) => {
        const items = getItems();
        const target = e.target as HTMLElement;
        const index = items.indexOf(target);
        if (index !== -1) {
            updateTabindex(index);
        }
    }, [getItems, updateTabindex]);

    /**
     * Handle keyboard navigation.
     */
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!active) return;

        const items = getItems();
        if (items.length === 0) return;

        const currentIndex = currentIndexRef.current;
        let newIndex = currentIndex;

        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                newIndex = (currentIndex + 1) % items.length;
                break;

            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                newIndex = (currentIndex - 1 + items.length) % items.length;
                break;

            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;

            case 'End':
                e.preventDefault();
                newIndex = items.length - 1;
                break;

            default:
                return;
        }

        updateTabindex(newIndex);
        items[newIndex]?.focus();
    }, [active, getItems, updateTabindex]);

    // Set up event listeners
    useEffect(() => {
        if (!active) return;

        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('focusin', handleFocus);
        container.addEventListener('keydown', handleKeyDown);

        // Initialize tabindex
        updateTabindex(0);

        return () => {
            container.removeEventListener('focusin', handleFocus);
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [active, handleFocus, handleKeyDown, updateTabindex]);

    return {
        containerRef,
        currentIndex: currentIndexRef.current,
        focusItem: (index: number) => {
            const items = getItems();
            if (items[index]) {
                updateTabindex(index);
                items[index]?.focus();
            }
        },
    };
}

export type { UseFocusTrapOptions };
