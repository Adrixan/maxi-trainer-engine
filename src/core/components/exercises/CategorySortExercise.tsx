/**
 * Category sorting exercise: sort items into categories.
 * 
 * Supports both drag-and-drop and tap-to-select interactions.
 * Fully accessible with keyboard navigation.
 */

import { useTranslation } from 'react-i18next';
import { optionStyles } from '@/core/utils/exerciseStyles';
import { HintButton } from './HintButton';
import { ExerciseFeedback } from './ExerciseFeedback';
import { ItemPool, CategoryBucket, useCategorySort } from './sorting';
import type { SortingContent } from '@/types/exercise';

// ============================================================================
// Types
// ============================================================================

interface Props {
    content: SortingContent;
    hints?: string[];
    onSubmit: (correct: boolean) => void;
    showSolution: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Category sorting exercise: sort items into categories.
 * 
 * @example
 * ```tsx
 * <CategorySortExercise
 *   content={exercise.content}
 *   hints={exercise.hints}
 *   onSubmit={handleSubmit}
 *   showSolution={false}
 * />
 * ```
 */
export function CategorySortExercise({ content, hints, onSubmit, showSolution }: Props) {
    const { t } = useTranslation();

    // Use the extracted hook for all state management
    const {
        pool,
        buckets,
        selectedItem,
        draggingItem,
        dragOverCategory,
        results,
        correctMap,
        allPlaced,
        moveToCategory,
        moveToPool,
        selectItem,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragOverPool,
        handleDragLeave,
        handleDrop,
        handleDropOnPool,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        checkAnswers,
        reset,
        categoryRefs,
        poolRef,
    } = useCategorySort({
        content,
        onSubmit,
    });

    // Handle tap on pool item
    const handleItemTap = (item: string) => {
        if (showSolution) return;
        selectItem(selectedItem === item ? null : item);
    };

    // Handle tap on bucket item (return to pool)
    const handleBucketItemTap = (item: string) => {
        if (showSolution) return;
        // Find which bucket the item is in and move it back to pool
        for (const [catIdx, items] of Object.entries(buckets)) {
            if (items.includes(item)) {
                moveToPool(item, Number(catIdx));
                break;
            }
        }
    };

    // Handle tap on category (place selected item)
    const handleBucketTap = (catIdx: number) => {
        if (!selectedItem || showSolution) return;
        // Find source of selected item
        let source: 'pool' | number = 'pool';
        for (const [idx, items] of Object.entries(buckets)) {
            if (items.includes(selectedItem)) {
                source = Number(idx);
                break;
            }
        }
        // Move item to the tapped category
        moveToCategory(selectedItem, catIdx, source);
    };

    return (
        <div className="space-y-4">
            {/* Item pool */}
            <ItemPool
                items={pool}
                isDragOver={dragOverCategory === -1}
                selectedItem={selectedItem}
                draggingItem={draggingItem}
                showSolution={showSolution}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onItemTap={handleItemTap}
                onDragOver={handleDragOverPool}
                onDragLeave={handleDragLeave}
                onDrop={handleDropOnPool}
                ref={(el) => {
                    if (poolRef) (poolRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }}
            />

            {/* Category buckets */}
            <div
                className={`grid gap-3 ${content.categories.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}
                role="group"
                aria-label={t('exercises.sorting.categories')}
            >
                {content.categories.map((cat, catIdx) => (
                    <CategoryBucket
                        key={catIdx}
                        categoryIndex={catIdx}
                        label={cat.label}
                        items={buckets[catIdx] || []}
                        isDragOver={dragOverCategory === catIdx}
                        showSolution={showSolution}
                        results={results?.[catIdx]}
                        correctMap={correctMap}
                        selectedItem={selectedItem}
                        draggingItem={draggingItem}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onItemTap={handleBucketItemTap}
                        onBucketTap={handleBucketTap}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        ref={(el) => {
                            if (el) categoryRefs.current.set(catIdx, el);
                        }}
                    />
                ))}
            </div>

            {/* Show correct sorting when wrong */}
            {showSolution && results && Object.values(results).some((cat) => Object.values(cat).some((v) => !v)) && (
                <ExerciseFeedback
                    show={true}
                    type="success"
                    message={t('exercises.sorting.correctSorting')}
                    explanation={content.categories.map((cat) => `${cat.label}: ${cat.items.join(', ')}`).join('\n')}
                    className="whitespace-pre-line"
                />
            )}

            {/* Hints */}
            {hints && hints.length > 0 && !showSolution && (
                <HintButton hints={hints} />
            )}

            {/* Buttons */}
            {!showSolution && (
                <div className="flex gap-2">
                    {Object.values(buckets).some((b) => b.length > 0) && (
                        <button
                            onClick={reset}
                            aria-label={t('exercises.reset')}
                            className={optionStyles({ variant: 'default' })}
                        >
                            🔄
                        </button>
                    )}
                    <button
                        onClick={checkAnswers}
                        disabled={!allPlaced}
                        className={`flex-1 py-3 ${optionStyles({ variant: allPlaced ? 'default' : 'disabled', size: 'lg' })} bg-accent-500 text-white font-bold rounded-xl hover:bg-accent-600`}
                    >
                        {t('exercises.check')}
                    </button>
                </div>
            )}
        </div>
    );
}
