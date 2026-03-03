/**
 * DraggableItem component for category sorting exercises.
 * 
 * Supports both drag-and-drop and tap-to-select interactions.
 */

import { useTranslation } from 'react-i18next';
import { solutionStateStyles } from '@/core/utils/exerciseStyles';
import type { DragData } from './useCategorySort';

// ============================================================================
// Types
// ============================================================================

export interface DraggableItemProps {
    /** Item text content */
    item: string;
    /** Whether this item is currently selected (tap mode) */
    isSelected?: boolean;
    /** Whether this item is currently being dragged */
    isDragging?: boolean;
    /** Whether the exercise is in solution mode */
    disabled?: boolean;
    /** Whether the item is placed correctly (for solution display) */
    isCorrect?: boolean | null;
    /** Source identifier ('pool' or category index) */
    source: 'pool' | number;
    /** Callback when drag starts - receives DragData object */
    onDragStart?: (e: React.DragEvent, data: DragData) => void;
    /** Callback when drag ends */
    onDragEnd?: () => void;
    /** Callback when touch starts - receives DragData object */
    onTouchStart?: (e: React.TouchEvent, data: DragData) => void;
    /** Callback when touch moves */
    onTouchMove?: (e: React.TouchEvent) => void;
    /** Callback when touch ends */
    onTouchEnd?: () => void;
    /** Callback when item is tapped/clicked */
    onTap?: (item: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A draggable item that supports both mouse drag-and-drop and touch interactions.
 * 
 * @example
 * ```tsx
 * <DraggableItem
 *   item="Apple"
 *   source="pool"
 *   isSelected={selectedItem === 'Apple'}
 *   onDragStart={handleDragStart}
 *   onTap={handleTap}
 * />
 * ```
 */
export function DraggableItem({
    item,
    isSelected = false,
    isDragging = false,
    disabled = false,
    isCorrect = null,
    source,
    onDragStart,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTap,
}: DraggableItemProps) {
    const { t } = useTranslation();

    // Determine styling based on state using exerciseStyles
    const getStyles = (): string => {
        const baseClasses = 'px-3 py-1.5 rounded-lg font-bold text-sm transition-all shadow-sm select-none touch-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';

        if (disabled && isCorrect !== null) {
            // Solution mode - use exerciseStyles for correct/incorrect states
            const state = isCorrect ? 'correct' : 'incorrect';
            return `${baseClasses} ${solutionStateStyles({ state })}`;
        }

        if (isDragging) {
            return `${baseClasses} opacity-40 scale-95`;
        }

        if (isSelected) {
            return `${baseClasses} ${solutionStateStyles({ state: 'selected' })} scale-105`;
        }

        // Default state
        return `${baseClasses} bg-white border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary active:scale-95 cursor-grab active:cursor-grabbing`;
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (disabled) return;
        onDragStart?.(e, { item, source });
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (disabled) return;
        onTouchStart?.(e, { item, source });
    };

    const handleClick = () => {
        if (disabled) return;
        onTap?.(item);
    };

    return (
        <button
            type="button"
            draggable={!disabled}
            onDragStart={handleDragStart}
            onDragEnd={onDragEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={handleClick}
            aria-pressed={isSelected}
            aria-label={`${item}${isSelected ? `, ${t('exercises.sorting.selected')}` : ''}`}
            aria-disabled={disabled}
            className={getStyles()}
        >
            {item}
            {disabled && isCorrect !== null && (
                <span className="ml-2" aria-hidden="true">
                    {isCorrect ? '✓' : '✗'}
                </span>
            )}
        </button>
    );
}
