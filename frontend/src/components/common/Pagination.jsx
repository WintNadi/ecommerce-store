import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems = 0,
  siblingCount = 1,
  showPageSize = true,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
}) => {
  if (totalPages <= 1) return null;

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      return [...Array.from({ length: leftItemCount }, (_, i) => i + 1), '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      return [1, '...', ...Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1)];
    }

    return [1, '...', ...Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i), '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Page Size Selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
          {totalItems > 0 && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({totalItems} total)
            </span>
          )}
        </div>
      )}

      {/* Pagination Buttons */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1 text-gray-500 dark:text-gray-400">…</span>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  currentPage === page
                    ? 'bg-orange-500 text-white font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;