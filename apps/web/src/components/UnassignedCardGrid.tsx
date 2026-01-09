'use client';

import { useMemo, useState } from 'react';
import { CardSelectionItem } from './CardSelectionItem';

interface Card {
  id: string;
  name: string;
  image_uri_normal: string | null;
  set_name: string;
  set_code: string;
  rarity: string;
}

interface CardSet {
  code: string;
  name: string;
}

interface UnassignedCardGridProps {
  cards: Card[];
  sets: CardSet[];
  selectedCardIds: Set<string>;
  onToggleSelect: (cardId: string) => void;
  onQuickAdd: (cardId: string) => void;
  onDelete?: (cardId: string) => void;
}

export function UnassignedCardGrid({
  cards,
  sets,
  selectedCardIds,
  onToggleSelect,
  onQuickAdd,
  onDelete,
}: UnassignedCardGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSet, setFilterSet] = useState('');
  const [filterRarity, setFilterRarity] = useState('');

  // Filter cards based on search and filters
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      // Search filter (name)
      if (
        searchQuery &&
        !card.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Set filter
      if (filterSet && card.set_code !== filterSet) {
        return false;
      }

      // Rarity filter
      if (filterRarity && card.rarity !== filterRarity) {
        return false;
      }

      return true;
    });
  }, [cards, searchQuery, filterSet, filterRarity]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search Binder cards by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-slate-200 placeholder-slate-500 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
        />

        {/* Set and Rarity Filters */}
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filterSet}
            onChange={e => setFilterSet(e.target.value)}
            className="rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-200 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Sets</option>
            {sets.map(set => (
              <option key={set.code} value={set.code}>
                {set.name}
              </option>
            ))}
          </select>

          <select
            value={filterRarity}
            onChange={e => setFilterRarity(e.target.value)}
            className="rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm text-slate-200 transition outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <p className="text-sm text-slate-400">
          Showing {filteredCards.length} of {cards.length} cards
        </p>
        {(searchQuery || filterSet || filterRarity) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterSet('');
              setFilterRarity('');
            }}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Card Grid */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filteredCards.map(card => (
            <CardSelectionItem
              key={card.id}
              card={card}
              isSelected={selectedCardIds.has(card.id)}
              onToggleSelect={onToggleSelect}
              onQuickAdd={onQuickAdd}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
          <p className="text-slate-400">
            {searchQuery || filterSet || filterRarity
              ? 'No cards match your filters'
              : 'No unassigned cards available'}
          </p>
          {(searchQuery || filterSet || filterRarity) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterSet('');
                setFilterRarity('');
              }}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
