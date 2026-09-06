import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import Loading from './Loading';
import EmptyState from './EmptyState';

export interface Column<T = any> {
  key: string;
  label: React.ReactNode;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  pagination?: PaginationProps;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
}

const SHOW_ENTRIES_OPTIONS = [10, 25, 50, 100];

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No records found',
  emptyActionLabel,
  onEmptyAction,
  searchable = true,
  searchPlaceholder = 'Search records...',
  onSearch,
  pagination,
  onRowClick,
  actions,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setLocalPage(1);
    if (onSearch) {
      onSearch(term);
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Client-side filtering if onSearch is not provided
  const filteredData = useMemo(() => {
    if (!searchTerm || onSearch) return data;
    const lower = searchTerm.toLowerCase();
    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      });
    });
  }, [data, searchTerm, onSearch]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination calculation
  const currentPage = pagination ? pagination.page : localPage;
  const pageSize = pagination ? pagination.pageSize : localPageSize;
  const totalRecords = pagination ? pagination.total : sortedData.length;
  const totalPages = pageSize === 0 ? 1 : Math.ceil(totalRecords / pageSize) || 1;

  const paginatedData = useMemo(() => {
    if (pagination) return sortedData; // Server-side or externally managed
    if (localPageSize === 0) return sortedData;
    const start = (localPage - 1) * localPageSize;
    return sortedData.slice(start, start + localPageSize);
  }, [sortedData, pagination, localPage, localPageSize]);

  const handlePageChange = (newPage: number) => {
    if (pagination) {
      pagination.onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E9EBEF] shadow-xs overflow-hidden">
      {(searchable || actions || !pagination) && (
        <div className="p-3 sm:p-5 border-b border-[#E9EBEF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white">
          {searchable ? (
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <input
                id="table-search-input"
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-xs font-medium bg-[#F5F6F8] border border-[#E9EBEF] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] focus:bg-white text-[#1A1A1A] transition-all placeholder-[#6B7280]"
              />
            </div>
          ) : (
            <div />
          )}
          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto justify-end">
              {actions}
            </div>
          )}
          {!pagination && (
            <label className="flex items-center gap-2 whitespace-nowrap text-[11px] font-semibold text-[#6B7280]">
              Show entries
              <select
                value={localPageSize}
                onChange={(event) => {
                  setLocalPageSize(Number(event.target.value));
                  setLocalPage(1);
                }}
                className="rounded-lg border border-[#E9EBEF] bg-[#F5F6F8] px-2 py-2 text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
              >
                {SHOW_ENTRIES_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                <option value={0}>All</option>
              </select>
            </label>
          )}
        </div>
      )}

      <div className="overflow-x-auto min-h-[200px] relative scrollbar-thin">
        {loading ? (
          <div className="py-16">
            <Loading message="Loading records..." />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No records found"
              message={searchTerm ? `No matching records found for "${searchTerm}".` : emptyMessage}
              actionLabel={onEmptyAction ? emptyActionLabel : undefined}
              onAction={onEmptyAction}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[580px]">
            <thead>
              <tr className="bg-[#F5F6F8] border-b border-[#E9EBEF] text-[10px] sm:text-[11px] font-black text-[#6B7280] uppercase tracking-wider">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`px-3.5 sm:px-6 py-3 sm:py-4 select-none ${
                      col.sortable ? 'cursor-pointer hover:text-[#1B3A5C]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {col.sortable && (
                        <span className="text-[#6B7280]">
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-[#1B3A5C]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-[#1B3A5C]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9EBEF] text-xs text-[#1A1A1A]">
              {paginatedData.map((row, idx) => (
                <tr
                  key={`${row.id || row.asset_id || row.purch_id || row.maint_id || 'row'}-${idx}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-[#F5F6F8]' : 'hover:bg-[#F5F6F8]/60'
                  } ${idx % 2 === 1 ? 'bg-[#F5F6F8]/30' : 'bg-white'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3.5 sm:px-6 py-3 sm:py-4 whitespace-nowrap font-medium">
                      {col.render ? col.render(row) : row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalRecords > 0 && pageSize !== 0 && (
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-t border-[#E9EBEF] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] font-semibold">
          <div className="text-[11px] sm:text-xs text-center sm:text-left">
            Showing{' '}
            <span className="font-black text-[#1A1A1A]">
              {Math.min((currentPage - 1) * pageSize + 1, totalRecords)}
            </span>{' '}
            to{' '}
            <span className="font-black text-[#1A1A1A]">
              {Math.min(currentPage * pageSize, totalRecords)}
            </span>{' '}
            of <span className="font-black text-[#1A1A1A]">{totalRecords}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              id="table-prev-page"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-xl border border-[#E9EBEF] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 sm:px-3 py-1 font-bold text-[#1A1A1A] text-[11px] sm:text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              id="table-next-page"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-xl border border-[#E9EBEF] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:cursor-not-allowed text-[#1A1A1A] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
