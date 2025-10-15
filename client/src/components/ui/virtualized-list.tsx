import { memo, useMemo } from 'react';
import { useVirtualizedList } from '@/hooks/useVirtualizedList';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  keyExtractor?: (item: T, index: number) => string | number;
}

function VirtualizedListComponent<T>({
  items,
  itemHeight,
  height,
  renderItem,
  className = '',
  overscan = 5,
  keyExtractor = (_, index) => index
}: VirtualizedListProps<T>) {
  const {
    scrollElementRef,
    visibleData,
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualizedList({
    items,
    itemHeight,
    containerHeight: height,
    overscan
  });

  const visibleItemsWithIndices = useMemo(() => {
    return visibleData.map((item, dataIndex) => ({
      item,
      originalIndex: visibleItems.startIndex + dataIndex,
      key: keyExtractor(item, visibleItems.startIndex + dataIndex)
    }));
  }, [visibleData, visibleItems.startIndex, keyExtractor]);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItemsWithIndices.map(({ item, originalIndex, key }) => (
            <div
              key={key}
              style={{ height: itemHeight }}
              className="flex-shrink-0"
            >
              {renderItem(item, originalIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Memoized component to prevent unnecessary re-renders
export const VirtualizedList = memo(VirtualizedListComponent) as <T>(
  props: VirtualizedListProps<T>
) => JSX.Element;

// Simple virtualized table row component
interface VirtualizedTableRowProps {
  data: any[];
  columns: Array<{
    key: string;
    render: (value: any, row: any) => React.ReactNode;
  }>;
}

export const VirtualizedTableRow = memo<VirtualizedTableRowProps>(
  ({ data, columns }) => (
    <div className="flex border-b">
      {columns.map((column) => (
        <div key={column.key} className="flex-1 p-2">
          {column.render(data[column.key], data)}
        </div>
      ))}
    </div>
  )
);

// Optimized grid component for large datasets
interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  itemWidth: number;
  containerHeight: number;
  containerWidth: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
}

export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemWidth,
  containerHeight,
  containerWidth,
  renderItem,
  gap = 8
}: VirtualizedGridProps<T>) {
  const itemsPerRow = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const totalRows = Math.ceil(items.length / itemsPerRow);
  
  const gridItems = useMemo(() => {
    const rows = [];
    for (let i = 0; i < totalRows; i++) {
      const rowItems = items.slice(i * itemsPerRow, (i + 1) * itemsPerRow);
      rows.push(rowItems);
    }
    return rows;
  }, [items, itemsPerRow, totalRows]);

  return (
    <VirtualizedList
      items={gridItems}
      itemHeight={itemHeight + gap}
      height={containerHeight}
      renderItem={(rowItems, rowIndex) => (
        <div className="flex" style={{ gap }}>
          {rowItems.map((item, colIndex) => (
            <div
              key={rowIndex * itemsPerRow + colIndex}
              style={{ width: itemWidth, height: itemHeight }}
            >
              {renderItem(item, rowIndex * itemsPerRow + colIndex)}
            </div>
          ))}
        </div>
      )}
    />
  );
}