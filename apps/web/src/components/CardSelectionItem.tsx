'use client';

import { Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface Card {
  id: string;
  name: string;
  image_uri_normal: string | null;
  set_name: string;
  set_code: string;
  rarity: string;
}

interface CardSelectionItemProps {
  card: Card;
  isSelected: boolean;
  onToggleSelect: (cardId: string) => void;
  onQuickAdd: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

const rarityStyles = {
  common: 'border-slate-600 bg-slate-900/60',
  uncommon: 'border-emerald-600/60 bg-emerald-950/40',
  rare: 'border-blue-600/60 bg-blue-950/40',
  mythic:
    'border-purple-600/80 bg-purple-950/60 shadow-[0_0_20px_rgba(168,85,247,0.4)]',
};

export function CardSelectionItem({
  card,
  isSelected,
  onToggleSelect,
  onQuickAdd,
  onDelete,
}: CardSelectionItemProps) {
  const rarityClass =
    rarityStyles[card.rarity as keyof typeof rarityStyles] ||
    rarityStyles.common;

  return (
    <div
      className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 backdrop-blur transition-all duration-300 ${rarityClass} ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900'
          : ''
      }`}
      onClick={() => onToggleSelect(card.id)}
    >
      {/* Checkbox Overlay - Top Left */}
      <div className="absolute top-2 left-2 z-10">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-slate-400 bg-slate-900/80'
          }`}
        >
          {isSelected && (
            <svg
              className="h-3 w-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Quick Add Button - Top Right */}
      <button
        className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-blue-700"
        onClick={e => {
          e.stopPropagation();
          onQuickAdd(card.id);
        }}
        title="Quick add to binder"
      >
        <Plus className="h-4 w-4 text-white" />
      </button>

      {/* Delete Button - Bottom Right */}
      {onDelete && (
        <button
          className="absolute right-2 bottom-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:bg-red-700"
          onClick={e => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          title="Delete card from collection"
        >
          <Trash2 className="h-3.5 w-3.5 text-white" />
        </button>
      )}

      {/* Card Image */}
      <div className="aspect-[5/7] w-full overflow-hidden bg-slate-800">
        {card.image_uri_normal ? (
          <Image
            src={card.image_uri_normal}
            alt={card.name}
            width={300}
            height={420}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            No Image
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-1 p-2">
        <p className="line-clamp-2 text-sm font-semibold text-slate-100">
          {card.name}
        </p>
        <p className="text-xs text-slate-400">
          {card.set_name} • <span className="capitalize">{card.rarity}</span>
        </p>
      </div>
    </div>
  );
}
