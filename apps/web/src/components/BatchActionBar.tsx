'use client';

import { ArrowRight, Loader2, Trash2 } from 'lucide-react';

interface BatchActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onAddToBinder: () => void;
  onDelete?: () => void;
  isLoading: boolean;
}

export function BatchActionBar({
  selectedCount,
  onClear,
  onAddToBinder,
  onDelete,
  isLoading,
}: BatchActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="animate-in slide-in-from-bottom-4 fixed bottom-8 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-blue-500/60 bg-slate-900/90 px-6 py-3 shadow-[0_0_30px_rgba(59,130,246,0.3)] backdrop-blur-xl">
        <span className="text-sm font-semibold text-slate-200">
          {selectedCount} card{selectedCount !== 1 ? 's' : ''} selected
        </span>

        <div className="h-6 w-px bg-slate-700" />

        <button
          onClick={onClear}
          disabled={isLoading}
          className="text-sm font-medium text-slate-400 transition hover:text-slate-200 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          onClick={onAddToBinder}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              Add to Binder
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
