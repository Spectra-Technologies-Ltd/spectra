import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  currentCount: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, currentCount, totalCount, onPrev, onNext }: PaginationProps) {
  return (
    <div className="border-t border-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-secondary/10">
      <span className="text-xs text-muted-foreground text-center sm:text-left">
        Showing <span className="font-medium text-foreground">{currentCount}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount}</span> entries
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 1}
          aria-label="Previous page"
          className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium px-2 text-foreground whitespace-nowrap">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={onNext}
          disabled={page === totalPages || totalPages === 0}
          aria-label="Next page"
          className="p-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
