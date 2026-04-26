import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationControls = ({
  page,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPreviousPage,
}) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPreviousPage}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        Previous
      </button>
      <span className="text-sm font-medium text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default PaginationControls;
