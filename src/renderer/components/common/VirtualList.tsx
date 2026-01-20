import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: items.length * itemHeight,
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => renderItem(item, visibleRange.startIndex + index))}
        </div>
      </div>
    </div>
  );
}

// Grid version for item picker
interface VirtualGridProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  columns: number;
  gap: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  containerHeight,
  columns,
  gap,
  renderItem,
  overscan = 2,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const itemsPerRow = columns;
    const rowHeight = itemHeight + gap;
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const totalRows = Math.ceil(items.length / itemsPerRow);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length, endRow * itemsPerRow);

    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, columns, items.length, overscan, gap]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  const totalHeight = Math.ceil(items.length / columns) * (itemHeight + gap);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: "relative",
        }}
      >
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            transform: `translateY(${Math.floor(visibleRange.startIndex / columns) * (itemHeight + gap)}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => renderItem(item, visibleRange.startIndex + index))}
        </div>
      </div>
    </div>
  );
}
