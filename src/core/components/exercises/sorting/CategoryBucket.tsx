/**
 * CategoryBucket component for category sorting exercises.
 * 
 * A drop zone for items belonging to a specific category.
 */

import { useTranslation } from 'react-i18next';
import { solutionStateStyles } from '@/core/utils/exerciseStyles';
import { DraggableItem } from './DraggableItem';
import type { DragData } from './useCategorySort';

// ============================================================================
// Types
// ============================================================================

export interface CategoryBucketProps {
    /** Category index */
    categoryIndex: number;
    /** Category label */
    label: string;
    /** Items currently in this bucket */
    items: string[];
    /** Whether this bucket is currently being dragged over */
    isDragOver?: boolean;
    /** Whether the exercise is in solution mode */
    showSolution?: boolean;
    /** Results for items in this bucket (item -> correct) */
    results?: Record<string, boolean> | undefined;
    /** Correct category for each item (for solution display) */
    correctMap?: Map<string, number>;
    /** Currently selected item from pool */
    selectedItem?: string | null;
    /** Currently dragging item */
    draggingItem?: string | null;
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
    /** Callback when item in bucket is tapped */
    onItemTap?: (item: string) => void;
    /** Callback when bucket is tapped (to place selected item) */
    onBucketTap?: (categoryIndex: number) => void;
    /** Callback when dragging over bucket */
    onDragOver?: (e: React.DragEvent, categoryIndex: number) => void;
    /** Callback when drag leaves bucket */
    onDragLeave?: () => void;
    /** Callback when item is dropped */
    onDrop?: (e: React.DragEvent, categoryIndex: number) => void;
    /** Ref callback for the bucket element */
    ref?: (el: HTMLElement | null) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * A category bucket that accepts dropped items.
 * 
 * @example
 * ```tsx
 * <CategoryBucket
 *   categoryIndex={0}
 *   label="Fruits"
 *   items={['Apple', 'Banana']}
 *   onDrop={handleDrop}
 * />
 * ```
 */
export function CategoryBucket({
    categoryIndex,
    label,
    items,
    isDragOver = false,
    showSolution = false,
    results,
    correctMap,
    selectedItem,
    draggingItem,
    onDragStart,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onItemTap,
    onBucketTap,
    onDragOver,
    onDragLeave,
    onDrop,
    ref,
}: CategoryBucketProps) {
    const { t } = useTranslation();

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        onDragOver?.(e, categoryIndex);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        onDrop?.(e, categoryIndex);
    };

    const handleBucketClick = () => {
        if (selectedItem) {
            onBucketTap?.(categoryIndex);
        }
    };

    // Calculate bucket styling using exerciseStyles
    const getBucketStyles = (): string => {
        const baseClasses = 'rounded-xl p-4 transition-colors min-h-[80px]';

        if (isDragOver) {
            return `${baseClasses} ${solutionStateStyles({ state: 'selected' })} border-primary/30`;
        }

        return `${baseClasses} ${solutionStateStyles({ state: 'neutral' })}`;
    };

    return (
        <div
            ref={ref}
            className={getBucketStyles()}
            onDragOver={handleDragOver}
            onDragLeave={onDragLeave}
            onDrop={handleDrop}
            onClick={handleBucketClick}
            role="region"
            aria-label={t('exercises.sorting.category', { name: label })}
        >
            {/* Category label */}
            <p className="text-sm font-bold text-gray-700 mb-2">{label}</p>

            {/* Items in bucket */}
            <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <span className="text-gray-300 italic text-sm">
                        {t('exercises.sorting.dropHere')}
                    </span>
                ) : (
                    items.map((item, idx) => {
                        const isCorrect = results?.[item];

                        return (
                            <DraggableItem
                                key={`bucket-${categoryIndex}-${idx}`}
                                item={item}
                                source={categoryIndex}
                                isSelected={selectedItem === item}
                                isDragging={draggingItem === item}
                                disabled={showSolution}
                                isCorrect={showSolution ? isCorrect ?? null : null}
                                {...(onDragStart && { onDragStart })}
                                {...(onDragEnd && { onDragEnd })}
                                {...(onTouchStart && { onTouchStart })}
                                {...(onTouchMove && { onTouchMove })}
                                {...(onTouchEnd && { onTouchEnd })}
                                {...(onItemTap && { onTap: onItemTap })}
                            />
                        );
                    })
                )}
            </div>

            {/* Show correct category hint in solution mode */}
            {showSolution && items.some((item) => correctMap?.get(item) !== categoryIndex) && (
                <div className="mt-2 text-xs text-gray-500">
                    {items
                        .filter((item) => correctMap?.get(item) !== categoryIndex)
                        .map((item) => (
                            <span key={`hint-${item}`} className="block">
                                {item} → {t('exercises.sorting.wrongCategory')}
                            </span>
                        ))}
                </div>
            )}
        </div>
    );
}
