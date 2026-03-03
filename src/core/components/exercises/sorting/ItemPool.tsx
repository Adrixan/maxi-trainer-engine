/**
 * ItemPool component for category sorting exercises.
 * 
 * Displays unplaced items that can be dragged or tapped to select.
 */

import { useTranslation } from 'react-i18next';
import { solutionStateStyles } from '@/core/utils/exerciseStyles';
import { DraggableItem } from './DraggableItem';
import type { DragData } from './useCategorySort';

// ============================================================================
// Types
// ============================================================================

export interface ItemPoolProps {
    /** Items currently in the pool */
    items: string[];
    /** Whether the pool is being dragged over */
    isDragOver?: boolean;
    /** Currently selected item (for tap mode) */
    selectedItem?: string | null;
    /** Currently dragging item */
    draggingItem?: string | null;
    /** Whether the exercise is in solution mode */
    showSolution?: boolean;
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
    /** Callback when item is tapped */
    onItemTap?: (item: string) => void;
    /** Callback when dragging over pool */
    onDragOver?: (e: React.DragEvent) => void;
    /** Callback when drag leaves pool */
    onDragLeave?: () => void;
    /** Callback when item is dropped on pool */
    onDrop?: (e: React.DragEvent) => void;
    /** Ref for the pool element */
    ref?: (el: HTMLDivElement | null) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A pool of unplaced items that can be dragged or tapped.
 * 
 * @example
 * ```tsx
 * <ItemPool
 *   items={['Apple', 'Banana', 'Carrot']}
 *   selectedItem={selectedItem}
 *   onItemTap={handleTap}
 *   onDragStart={handleDragStart}
 * />
 * ```
 */
export function ItemPool({
    items,
    isDragOver = false,
    selectedItem,
    draggingItem,
    showSolution = false,
    onDragStart,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onItemTap,
    onDragOver,
    onDragLeave,
    onDrop,
    ref,
}: ItemPoolProps) {
    const { t } = useTranslation();

    // Calculate pool styling using exerciseStyles
    const getPoolStyles = (): string => {
        const baseClasses = 'rounded-xl p-4 transition-colors';

        if (isDragOver) {
            return `${baseClasses} ${solutionStateStyles({ state: 'selected' })} border-primary/30`;
        }

        return `${baseClasses} ${solutionStateStyles({ state: 'neutral' })} border-2 border-transparent`;
    };

    // Don't render in solution mode
    if (showSolution) {
        return null;
    }

    return (
        <div
            ref={ref}
            className={getPoolStyles()}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="region"
            aria-label={t('exercises.sorting.itemPool')}
        >
            <p className="text-xs text-gray-600 mb-2 font-semibold">
                {t('exercises.sorting.dragOrTap')}
            </p>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
                {items.length === 0 ? (
                    <span className="text-gray-300 italic text-sm">
                        {t('exercises.sorting.allSorted')}
                    </span>
                ) : (
                    items.map((item, idx) => (
                        <DraggableItem
                            key={`pool-${idx}`}
                            item={item}
                            source="pool"
                            isSelected={selectedItem === item}
                            isDragging={draggingItem === item}
                            disabled={showSolution}
                            {...(onDragStart && { onDragStart })}
                            {...(onDragEnd && { onDragEnd })}
                            {...(onTouchStart && { onTouchStart })}
                            {...(onTouchMove && { onTouchMove })}
                            {...(onTouchEnd && { onTouchEnd })}
                            {...(onItemTap && { onTap: onItemTap })}
                        />
                    ))
                )}
            </div>
        </div>
    );
}