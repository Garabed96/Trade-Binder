'use client';

import { Book } from 'lucide-react';

interface Binder {
  id: string;
  name: string;
  description: string | null;
  target_capacity: number | null;
  card_count: number;
}

interface BinderSidebarCardProps {
  binder: Binder;
  isSelected: boolean;
  onClick: () => void;
}

export function BinderSidebarCard({
  binder,
  isSelected,
  onClick,
}: BinderSidebarCardProps) {
  const progressPercent = binder.target_capacity
    ? Math.min((binder.card_count / binder.target_capacity) * 100, 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
          : 'border-slate-700/60 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg p-2 ${
            isSelected
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          <Book className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className={`truncate text-sm font-bold ${
              isSelected ? 'text-blue-400' : 'text-slate-200'
            }`}
            title={binder.name}
          >
            {binder.name}
          </h3>
          {binder.description && (
            <p
              className="mt-1 truncate text-xs text-slate-400"
              title={binder.description}
            >
              {binder.description}
            </p>
          )}
          <div className="mt-2 text-xs text-slate-400">
            {binder.target_capacity ? (
              <>
                {binder.card_count} / {binder.target_capacity} cards
              </>
            ) : (
              <>{binder.card_count} cards</>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {binder.target_capacity && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/50">
          <div
            className={`h-full transition-all duration-500 ${
              isSelected
                ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                : 'bg-slate-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </button>
  );
}
