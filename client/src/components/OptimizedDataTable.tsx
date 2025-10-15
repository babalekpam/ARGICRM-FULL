import { useMemo, useState, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useOptimizedTable, useOptimizedSearch } from '@/hooks/useVirtualizedList';
import { TableSkeleton } from '@/components/LazyComponentWrapper';

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface OptimizedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  searchKeys?: (keyof T)[];
}

export function OptimizedDataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  searchPlaceholder = "Search...",
  pageSize = 20,
  onRowClick,
  searchKeys
}: OptimizedDataTableProps<T>) {
  // Search functionality
  const [filteredData, setFilteredData] = useState(data);
  
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) => {
      if (searchKeys) {
        return searchKeys.some(key => 
          String(item[key]).toLowerCase().includes(query.toLowerCase())
        );
      } else {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(query.toLowerCase())
        );
      }
    });
    
    setFilteredData(filtered);
  }, [data, searchKeys]);

  const { query, setQuery, isSearching } = useOptimizedSearch('', handleSearch);

  // Update filtered data when original data changes
  useMemo(() => {
    if (!query.trim()) {
      setFilteredData(data);
    } else {
      handleSearch(query);
    }
  }, [data, query, handleSearch]);

  // Table functionality with pagination and sorting
  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    sortConfig,
    handleSort,
    totalPages,
    totalItems,
  } = useOptimizedTable(filteredData, pageSize);

  if (loading) {
    return <TableSkeleton rows={pageSize} cols={columns.length} />;
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
        {isSearching && (
          <div className="absolute right-2 top-2.5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedData.length} of {totalItems} results
        {query && ` for "${query}"`}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={String(column.key)}
                  style={{ width: column.width }}
                  className={column.sortable ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <div className="ml-1">
                        {sortConfig.direction === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow 
                  key={index}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : String(row[column.key] ?? '')
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}