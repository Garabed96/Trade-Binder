'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { MilestoneBadges } from './MilestoneBadges';

interface Card {
  id: string;
  name: string;
  image_uri_normal: string | null;
  rarity: string;
}

interface Binder {
  id: string;
  name: string;
  description: string | null;
  target_capacity: number | null;
}

interface BinderProgressSectionProps {
  binder: Binder;
  recentCards: Card[];
  cardCount: number;
  onRemoveCard: (cardId: string) => void;
}

export function BinderProgressSection({
  binder,
  recentCards,
  cardCount,
  onRemoveCard,
}: BinderProgressSectionProps) {
  const progressPercent = binder.target_capacity
    ? Math.min((cardCount / binder.target_capacity) * 100, 100)
    : 0;

  return (
    <div className="space-y-6 border-b border-slate-700/60 pb-6">
      {/* Binder Info */}
      <div>
        <h3 className="text-xl font-bold text-slate-100">{binder.name}</h3>
        {binder.description && (
          <p className="mt-1 text-sm text-slate-400">{binder.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {binder.target_capacity ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="font-semibold text-slate-200">
              {cardCount} / {binder.target_capacity} cards
            </span>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-slate-800/50">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-center text-xs text-slate-500">
            {progressPercent.toFixed(0)}% complete
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3 text-center">
          <p className="text-sm text-slate-400">
            Unlimited capacity • {cardCount} cards
          </p>
        </div>
      )}

      {/* Milestone Badges */}
      <MilestoneBadges
        currentCount={cardCount}
        targetCapacity={binder.target_capacity}
      />

      {/* Recent Cards Preview */}
      {recentCards.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-300">
            Recently Added
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {recentCards.slice(0, 6).map(card => (
              <div
                key={card.id}
                className="group relative aspect-[5/7] overflow-hidden rounded-md border border-slate-700/60 bg-slate-800"
              >
                {card.image_uri_normal ? (
                  <Image
                    src={card.image_uri_normal}
                    alt={card.name}
                    width={150}
                    height={210}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-xs text-slate-500">No Image</span>
                  </div>
                )}

                {/* Remove Button Overlay */}
                <button
                  onClick={() => onRemoveCard(card.id)}
                  className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition group-hover:opacity-100"
                  title={`Remove ${card.name}`}
                >
                  <Trash2 className="h-6 w-6 text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentCards.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
          <p className="text-sm text-slate-500">
            No cards in this binder yet. Start adding cards to begin!
          </p>
        </div>
      )}
    </div>
  );
}
