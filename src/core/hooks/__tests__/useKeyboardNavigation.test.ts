/**
 * Tests for useKeyboardNavigation hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createElement, useEffect } from 'react';
import { render } from '@testing-library/react';
import { useKeyboardNavigation } from '../useKeyboardNavigation';

// Test wrapper component that properly attaches the ref
function TestWrapper({
    items,
    onSelect,
    onCancel,
    enabled,
    wrap,
    initialIndex,
    nextKey,
    prevKey,
    selectKey,
    onStateChange,
}: {
    items: string[];
    onSelect: (item: string, index: number) => void;
    onCancel?: () => void;
    enabled?: boolean;
    wrap?: boolean;
    initialIndex?: number;
    nextKey?: string;
    prevKey?: string;
    selectKey?: string;
    onStateChange?: (state: { focusedIndex: number; focusedItem: string | null }) => void;
}) {
    const options = {
        items,
        onSelect,
        ...(onCancel !== undefined && { onCancel }),
        ...(enabled !== undefined && { enabled }),
        ...(wrap !== undefined && { wrap }),
        ...(initialIndex !== undefined && { initialIndex }),
        ...(nextKey !== undefined && { nextKey }),
        ...(prevKey !== undefined && { prevKey }),
        ...(selectKey !== undefined && { selectKey }),
    };

    const result = useKeyboardNavigation(options);

    useEffect(() => {
        onStateChange?.({
            focusedIndex: result.focusedIndex,
            focusedItem: result.focusedItem,
        });
    }, [result.focusedIndex, result.focusedItem, onStateChange]);

    return createElement('div', {
        ref: result.containerRef,
        'data-testid': 'container',
        tabIndex: 0,
    });
}

describe('useKeyboardNavigation', () => {
    const mockItems = ['item1', 'item2', 'item3', 'item4', 'item5'];
    const mockOnSelect = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                })
            );

            expect(result.current.focusedIndex).toBe(-1);
            expect(result.current.focusedItem).toBeNull();
            expect(result.current.containerRef).toBeDefined();
            expect(result.current.itemRefs).toBeDefined();
        });

        it('should initialize with custom initialIndex', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 2,
                })
            );

            expect(result.current.focusedIndex).toBe(2);
            expect(result.current.focusedItem).toBe('item3');
        });

        it('should handle empty items array', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: [],
                    onSelect: mockOnSelect,
                })
            );

            expect(result.current.focusedIndex).toBe(-1);
            expect(result.current.focusedItem).toBeNull();
        });
    });

    describe('arrow key navigation', () => {
        it('should move to next item on ArrowDown', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
                );
            });

            // Check the last state change
            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(1);
        });

        it('should move to previous item on ArrowUp', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 2,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
                );
            });

            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(1);
        });

        it('should use custom nextKey and prevKey', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 1,
                    nextKey: 'ArrowRight',
                    prevKey: 'ArrowLeft',
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
                );
            });

            let lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(2);

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
                );
            });

            lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(1);
        });
    });

    describe('wrap-around behavior', () => {
        it('should wrap to first item when at end and wrap is true', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 4,
                    wrap: true,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
                );
            });

            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(0);
        });

        it('should wrap to last item when at start and wrap is true', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                    wrap: true,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
                );
            });

            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(4);
        });

        it('should not wrap when wrap is false (at end)', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 4,
                    wrap: false,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
                );
            });

            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(4);
        });

        it('should not wrap when wrap is false (at start)', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                    wrap: false,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
                );
            });

            const lastState = stateChanges[stateChanges.length - 1];
            expect(lastState?.focusedIndex).toBe(0);
        });
    });

    describe('selection', () => {
        it('should call onSelect when Enter is pressed', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 2,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
                );
            });

            expect(mockOnSelect).toHaveBeenCalledTimes(1);
            expect(mockOnSelect).toHaveBeenCalledWith('item3', 2);
        });

        it('should call onSelect when Space is pressed', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 1,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: ' ', bubbles: true })
                );
            });

            expect(mockOnSelect).toHaveBeenCalledTimes(1);
            expect(mockOnSelect).toHaveBeenCalledWith('item2', 1);
        });

        it('should use custom selectKey', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                    selectKey: 'Space',
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Space', bubbles: true })
                );
            });

            expect(mockOnSelect).toHaveBeenCalledTimes(1);
            expect(mockOnSelect).toHaveBeenCalledWith('item1', 0);
        });

        it('should not call onSelect when no item is focused', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: -1,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
                );
            });

            expect(mockOnSelect).not.toHaveBeenCalled();
        });
    });

    describe('cancel', () => {
        it('should call onCancel when Escape is pressed', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    onCancel: mockOnCancel,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
                );
            });

            expect(mockOnCancel).toHaveBeenCalledTimes(1);
        });

        it('should not throw when Escape is pressed without onCancel', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            expect(() => {
                act(() => {
                    containerElement.dispatchEvent(
                        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
                    );
                });
            }).not.toThrow();
        });
    });

    describe('disabled state', () => {
        it('should not respond to keys when disabled', () => {
            const stateChanges: Array<{ focusedIndex: number; focusedItem: string | null }> = [];

            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    onCancel: mockOnCancel,
                    enabled: false,
                    initialIndex: 0,
                    onStateChange: (state) => stateChanges.push(state),
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            // Clear initial state changes from mount
            stateChanges.length = 0;

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
                );
            });

            // No state change should occur when disabled
            expect(stateChanges.length).toBe(0);

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
                );
            });

            expect(mockOnSelect).not.toHaveBeenCalled();

            act(() => {
                containerElement.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
                );
            });

            expect(mockOnCancel).not.toHaveBeenCalled();
        });
    });

    describe('focus management', () => {
        it('should focus container when focus() is called', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                })
            );

            const mockFocus = vi.fn();
            const mockContainer = {
                focus: mockFocus,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };

            (result.current.containerRef as React.MutableRefObject<HTMLDivElement | null>).current = mockContainer as unknown as HTMLDivElement;

            act(() => {
                result.current.focus();
            });

            expect(mockFocus).toHaveBeenCalledTimes(1);
        });

        it('should reset to initial index when reset() is called', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 2,
                })
            );

            // First verify initial state
            expect(result.current.focusedIndex).toBe(2);

            // Navigate to change index
            act(() => {
                result.current.setFocusedIndex(4);
            });

            expect(result.current.focusedIndex).toBe(4);

            // Reset
            act(() => {
                result.current.reset();
            });

            expect(result.current.focusedIndex).toBe(2);
        });

        it('should allow manual index change via setFocusedIndex', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                })
            );

            act(() => {
                result.current.setFocusedIndex(3);
            });

            expect(result.current.focusedIndex).toBe(3);
            expect(result.current.focusedItem).toBe('item4');
        });
    });

    describe('focusedItem calculation', () => {
        it('should return null when focusedIndex is -1', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: -1,
                })
            );

            expect(result.current.focusedItem).toBeNull();
        });

        it('should return null when focusedIndex is out of bounds (negative)', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                })
            );

            act(() => {
                result.current.setFocusedIndex(-5);
            });

            expect(result.current.focusedItem).toBeNull();
        });

        it('should return null when focusedIndex is out of bounds (too high)', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                })
            );

            act(() => {
                result.current.setFocusedIndex(100);
            });

            expect(result.current.focusedItem).toBeNull();
        });

        it('should return correct item for valid index', () => {
            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 3,
                })
            );

            expect(result.current.focusedItem).toBe('item4');
        });
    });

    describe('with object items', () => {
        interface TestItem {
            id: string;
            label: string;
        }

        const objectItems: TestItem[] = [
            { id: 'a', label: 'Item A' },
            { id: 'b', label: 'Item B' },
            { id: 'c', label: 'Item C' },
        ];

        it('should return correct focusedItem for object items', () => {
            const onSelectObject = vi.fn();

            const { result } = renderHook(() =>
                useKeyboardNavigation({
                    items: objectItems,
                    onSelect: onSelectObject,
                    initialIndex: 1,
                })
            );

            expect(result.current.focusedItem).toEqual({ id: 'b', label: 'Item B' });

            act(() => {
                result.current.setFocusedIndex(2);
            });

            expect(result.current.focusedItem).toEqual({ id: 'c', label: 'Item C' });
        });
    });

    describe('event prevention', () => {
        it('should prevent default on navigation keys', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            const event = new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true, bubbles: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            act(() => {
                containerElement.dispatchEvent(event);
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default on selection keys', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    initialIndex: 0,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true, bubbles: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            act(() => {
                containerElement.dispatchEvent(event);
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default on Escape key', () => {
            const { container } = render(
                createElement(TestWrapper, {
                    items: mockItems,
                    onSelect: mockOnSelect,
                    onCancel: mockOnCancel,
                })
            );

            const containerElement = container.querySelector('[data-testid="container"]') as HTMLElement;

            const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            act(() => {
                containerElement.dispatchEvent(event);
            });

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });
});
