/**
 * useKeyboardNavigation Hook
 * Centralized keyboard navigation for exercise components
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface KeyboardNavigationOptions<T> {
    /** List of items to navigate */
    items: T[];
    /** Callback when an item is selected */
    onSelect: (item: T, index: number) => void;
    /** Callback when navigation is cancelled */
    onCancel?: () => void;
    /** Whether navigation is enabled */
    enabled?: boolean;
    /** Whether to wrap around at boundaries */
    wrap?: boolean;
    /** Initial focused index */
    initialIndex?: number;
    /** Key to use for moving to next item (default: ArrowDown) */
    nextKey?: string;
    /** Key to use for moving to previous item (default: ArrowUp) */
    prevKey?: string;
    /** Key to use for selection (default: Enter) */
    selectKey?: string;
    /** Whether to auto-focus on mount */
    autoFocus?: boolean;
}

export interface KeyboardNavigationResult<T> {
    /** Currently focused item index */
    focusedIndex: number;
    /** Currently focused item (null if none) */
    focusedItem: T | null;
    /** Ref to attach to the container element */
    containerRef: React.RefObject<HTMLDivElement | null>;
    /** Refs to attach to individual items */
    itemRefs: React.RefObject<(HTMLElement | null)[]>;
    /** Manually set focus to a specific index */
    setFocusedIndex: (index: number) => void;
    /** Reset to initial state */
    reset: () => void;
    /** Focus the container */
    focus: () => void;
}

/**
 * Hook for keyboard navigation in exercise components
 * 
 * Provides:
 * - Arrow key navigation
 * - Enter/Space selection
 * - Escape to cancel
 * - Tab handling
 */
export function useKeyboardNavigation<T>({
    items,
    onSelect,
    onCancel,
    enabled = true,
    wrap = true,
    initialIndex = -1,
    nextKey = 'ArrowDown',
    prevKey = 'ArrowUp',
    selectKey = 'Enter',
    autoFocus = false,
}: KeyboardNavigationOptions<T>): KeyboardNavigationResult<T> {
    const [focusedIndex, setFocusedIndex] = useState(initialIndex);
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);

    // Move focus to next item
    const moveToNext = useCallback(() => {
        setFocusedIndex((prev) => {
            if (items.length === 0) return prev;

            let next = prev + 1;
            if (next >= items.length) {
                next = wrap ? 0 : items.length - 1;
            }

            // Focus the item element
            itemRefs.current[next]?.focus();

            return next;
        });
    }, [items.length, wrap]);

    // Move focus to previous item
    const moveToPrev = useCallback(() => {
        setFocusedIndex((prev) => {
            if (items.length === 0) return prev;

            let next = prev - 1;
            if (next < 0) {
                next = wrap ? items.length - 1 : 0;
            }

            // Focus the item element
            itemRefs.current[next]?.focus();

            return next;
        });
    }, [items.length, wrap]);

    // Select current item
    const selectCurrent = useCallback(() => {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            if (item !== undefined) {
                onSelect(item, focusedIndex);
            }
        }
    }, [focusedIndex, items, onSelect]);

    // Handle keyboard events
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            switch (event.key) {
                case nextKey:
                    event.preventDefault();
                    moveToNext();
                    break;
                case prevKey:
                    event.preventDefault();
                    moveToPrev();
                    break;
                case selectKey:
                case ' ':
                    event.preventDefault();
                    selectCurrent();
                    break;
                case 'Escape':
                    event.preventDefault();
                    onCancel?.();
                    break;
                default:
                    break;
            }
        },
        [enabled, nextKey, prevKey, selectKey, moveToNext, moveToPrev, selectCurrent, onCancel]
    );

    // Attach event listener
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !enabled) return;

        container.addEventListener('keydown', handleKeyDown);
        return () => container.removeEventListener('keydown', handleKeyDown);
    }, [enabled, handleKeyDown]);

    // Auto-focus on mount
    useEffect(() => {
        if (autoFocus && containerRef.current) {
            containerRef.current.focus();
        }
    }, [autoFocus]);

    // Update item refs when items change
    useEffect(() => {
        itemRefs.current = itemRefs.current.slice(0, items.length);
    }, [items.length]);

    // Reset function
    const reset = useCallback(() => {
        setFocusedIndex(initialIndex);
    }, [initialIndex]);

    // Focus function
    const focus = useCallback(() => {
        containerRef.current?.focus();
    }, []);

    return {
        focusedIndex,
        focusedItem: focusedIndex >= 0 && focusedIndex < items.length ? items[focusedIndex] ?? null : null,
        containerRef,
        itemRefs,
        setFocusedIndex,
        reset,
        focus,
    };
}

export default useKeyboardNavigation;