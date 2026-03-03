/**
 * Custom hook for managing category sorting exercise state.
 * 
 * Handles drag-and-drop, touch interactions, and result checking.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import type { SortingContent } from '@/types/exercise';

// ============================================================================
// Types
// ============================================================================

/** Encodes drag data for both pool and bucket sources. */
export interface DragData {
    item: string;
    source: 'pool' | number; // 'pool' or category index
}

export interface UseCategorySortOptions {
    /** Sorting exercise content */
    content: SortingContent;
    /** Callback when exercise is submitted */
    onSubmit?: (correct: boolean) => void;
}

export interface UseCategorySortReturn {
    /** Items still in the pool (unplaced) */
    pool: string[];
    /** Items placed in each category bucket */
    buckets: Record<number, string[]>;
    /** Currently selected item (for tap mode) */
    selectedItem: string | null;
    /** Currently dragging item */
    draggingItem: string | null;
    /** Category currently being dragged over */
    dragOverCategory: number | null;
    /** Results after checking (item -> correct per category) */
    results: Record<number, Record<string, boolean>> | null;
    /** Map of item -> correct category index */
    correctMap: Map<string, number>;
    /** Whether all items have been placed */
    allPlaced: boolean;
    /** Move an item to a category */
    moveToCategory: (item: string, catIdx: number, source: 'pool' | number) => void;
    /** Move an item back to the pool */
    moveToPool: (item: string, fromCat: number) => void;
    /** Handle item selection (tap mode) */
    selectItem: (item: string | null) => void;
    /** Handle drag start */
    handleDragStart: (e: React.DragEvent, data: DragData) => void;
    /** Handle drag end */
    handleDragEnd: () => void;
    /** Handle drag over category */
    handleDragOver: (e: React.DragEvent, catIdx: number) => void;
    /** Handle drag over pool */
    handleDragOverPool: (e: React.DragEvent) => void;
    /** Handle drag leave */
    handleDragLeave: () => void;
    /** Handle drop on category */
    handleDrop: (e: React.DragEvent, catIdx: number) => void;
    /** Handle drop on pool */
    handleDropOnPool: (e: React.DragEvent) => void;
    /** Handle touch start */
    handleTouchStart: (e: React.TouchEvent, data: DragData) => void;
    /** Handle touch move */
    handleTouchMove: (e: React.TouchEvent) => void;
    /** Handle touch end */
    handleTouchEnd: () => void;
    /** Check answers */
    checkAnswers: () => void;
    /** Reset the exercise */
    reset: () => void;
    /** Refs for category elements */
    categoryRefs: React.MutableRefObject<Map<number, HTMLElement>>;
    /** Ref for pool element */
    poolRef: React.RefObject<HTMLDivElement | null>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Shuffle an array randomly.
 */
function shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = copy[i];
        copy[i] = copy[j] as T;
        copy[j] = tmp as T;
    }
    return copy;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing category sorting exercise state.
 * 
 * @example
 * ```tsx
 * const {
 *   pool,
 *   buckets,
 *   moveToCategory,
 *   checkAnswers,
 * } = useCategorySort({ content, onSubmit });
 * ```
 */
export function useCategorySort({
    content,
    onSubmit,
}: UseCategorySortOptions): UseCategorySortReturn {
    // All items scrambled (computed once)
    const allItems = useMemo(() => {
        const items = content.categories.flatMap((cat) => cat.items);
        return shuffle(items);
    }, [content]);

    // State
    const [pool, setPool] = useState<string[]>(allItems);
    const [buckets, setBuckets] = useState<Record<number, string[]>>(
        Object.fromEntries(content.categories.map((_, i) => [i, []]))
    );
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [results, setResults] = useState<Record<number, Record<string, boolean>> | null>(null);
    const [dragOverCategory, setDragOverCategory] = useState<number | null>(null);
    const [draggingItem, setDraggingItem] = useState<string | null>(null);

    // Refs
    const categoryRefs = useRef<Map<number, HTMLElement>>(new Map());
    const poolRef = useRef<HTMLDivElement>(null);
    const touchRef = useRef<{
        data: DragData;
        ghostEl: HTMLDivElement | null;
        startX: number;
        startY: number;
        moved: boolean;
    } | null>(null);

    // Build correct lookup: item -> category index
    const correctMap = useMemo(() => {
        const map = new Map<string, number>();
        content.categories.forEach((cat, idx) => {
            cat.items.forEach((item) => map.set(item, idx));
        });
        return map;
    }, [content]);

    // --- Move helpers ---
    const moveToCategory = useCallback((item: string, catIdx: number, source: 'pool' | number) => {
        if (source === 'pool') {
            setPool((prev) => prev.filter((i) => i !== item));
        } else {
            setBuckets((prev) => ({
                ...prev,
                [source]: (prev[source] || []).filter((i) => i !== item),
            }));
        }
        setBuckets((prev) => ({
            ...prev,
            [catIdx]: [...(prev[catIdx] || []), item],
        }));
        setSelectedItem(null);
    }, []);

    const moveToPool = useCallback((item: string, fromCat: number) => {
        setBuckets((prev) => ({
            ...prev,
            [fromCat]: (prev[fromCat] || []).filter((i) => i !== item),
        }));
        setPool((prev) => [...prev, item]);
    }, []);

    const selectItem = useCallback((item: string | null) => {
        setSelectedItem(item);
    }, []);

    // --- HTML5 Drag & Drop handlers ---
    const handleDragStart = useCallback((e: React.DragEvent, data: DragData) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(data));
        setDraggingItem(data.item);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingItem(null);
        setDragOverCategory(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, catIdx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCategory(catIdx);
    }, []);

    const handleDragOverPool = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverCategory(-1); // -1 = pool
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverCategory(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, catIdx: number) => {
        e.preventDefault();
        setDragOverCategory(null);
        setDraggingItem(null);
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.source === catIdx) return; // dropped on same category
            moveToCategory(data.item, catIdx, data.source);
        } catch { /* invalid drag data */ }
    }, [moveToCategory]);

    const handleDropOnPool = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOverCategory(null);
        setDraggingItem(null);
        try {
            const data: DragData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (data.source === 'pool') return;
            moveToPool(data.item, data.source as number);
        } catch { /* invalid drag data */ }
    }, [moveToPool]);

    // --- Touch drag handlers ---
    const findCategoryAtPoint = useCallback((x: number, y: number): number | 'pool' | null => {
        // Check pool first
        if (poolRef.current) {
            const rect = poolRef.current.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return 'pool';
            }
        }
        // Check category buckets
        for (const [catIdx, el] of categoryRefs.current.entries()) {
            const rect = el.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return catIdx;
            }
        }
        return null;
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent, data: DragData) => {
        const touch = e.touches[0];
        if (!touch) return;
        // Create ghost element
        const ghost = document.createElement('div');
        ghost.textContent = data.item;
        ghost.className = 'fixed z-50 px-3 py-1.5 rounded-lg font-bold text-sm bg-primary text-white shadow-lg pointer-events-none';
        ghost.style.left = `${touch.clientX - 30}px`;
        ghost.style.top = `${touch.clientY - 20}px`;
        ghost.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ghost);

        touchRef.current = {
            data,
            ghostEl: ghost,
            startX: touch.clientX,
            startY: touch.clientY,
            moved: false,
        };
        setDraggingItem(data.item);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;
        const dx = Math.abs(touch.clientX - touchRef.current.startX);
        const dy = Math.abs(touch.clientY - touchRef.current.startY);
        if (dx > 5 || dy > 5) {
            touchRef.current.moved = true;
            e.preventDefault();
        }

        if (touchRef.current.ghostEl) {
            touchRef.current.ghostEl.style.left = `${touch.clientX - 30}px`;
            touchRef.current.ghostEl.style.top = `${touch.clientY - 20}px`;
        }

        // Update drag-over highlight
        const target = findCategoryAtPoint(touch.clientX, touch.clientY);
        if (target === 'pool') {
            setDragOverCategory(-1);
        } else if (target !== null) {
            setDragOverCategory(target);
        } else {
            setDragOverCategory(null);
        }
    }, [findCategoryAtPoint]);

    const handleTouchEnd = useCallback(() => {
        if (!touchRef.current) return;
        const td = touchRef.current;

        let dropX = 0;
        let dropY = 0;
        if (td.ghostEl) {
            dropX = parseFloat(td.ghostEl.style.left) + 30;
            dropY = parseFloat(td.ghostEl.style.top) + 20;
            document.body.removeChild(td.ghostEl);
        }

        if (td.moved && dropX > 0 && dropY > 0) {
            const target = findCategoryAtPoint(dropX, dropY);
            if (target === 'pool' && td.data.source !== 'pool') {
                moveToPool(td.data.item, td.data.source as number);
            } else if (typeof target === 'number' && target !== td.data.source) {
                moveToCategory(td.data.item, target, td.data.source);
            }
        }

        touchRef.current = null;
        setDraggingItem(null);
        setDragOverCategory(null);
    }, [findCategoryAtPoint, moveToCategory, moveToPool]);

    // --- Check answers ---
    const checkAnswers = useCallback(() => {
        const res: Record<number, Record<string, boolean>> = {};
        let allCorrect = true;

        content.categories.forEach((_, catIdx) => {
            res[catIdx] = {};
            (buckets[catIdx] || []).forEach((item) => {
                const isCorrect = correctMap.get(item) === catIdx;
                const bucket = res[catIdx];
                if (bucket) {
                    bucket[item] = isCorrect;
                }
                if (!isCorrect) allCorrect = false;
            });
        });

        setResults(res);
        onSubmit?.(allCorrect);
    }, [content, buckets, correctMap, onSubmit]);

    // --- Reset ---
    const reset = useCallback(() => {
        setPool(allItems);
        setBuckets(Object.fromEntries(content.categories.map((_, i) => [i, []])));
        setSelectedItem(null);
        setResults(null);
        setDraggingItem(null);
        setDragOverCategory(null);
    }, [allItems, content]);

    const allPlaced = pool.length === 0;

    return {
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
    };
}
