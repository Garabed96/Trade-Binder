// apps/web/src/components/CardBrowser.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';

interface CardBrowserProps {
  onCardSelect: (card: any) => void;
}

export function CardBrowser({ onCardSelect }: CardBrowserProps) {
  const [query, setQuery] = useState('');
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data: sets } = trpc.card.listSets.useQuery();
  const { data: cardData, isLoading } = trpc.card.search.useQuery({
    query: query || undefined,
    set_code: selectedSet || undefined,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select value={selectedSet} onValueChange={setSelectedSet}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All sets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sets</SelectItem>
            {sets?.map((set) => (
              <SelectItem key={set.code} value={set.code}>
                {set.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div>Loading cards...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardData?.cards.map((card) => (
            <div key={card.id} className="border rounded-lg p-4">
              {card.image_uri_normal && (
                <img
                  src={card.image_uri_normal}
                  alt={card.name}
                  className="w-full h-64 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold">{card.name}</h3>
              <p className="text-sm text-gray-600">{card.set_name}</p>
              {card.price_usd && <p className="text-sm font-medium">${card.price_usd}</p>}
              <Button onClick={() => onCardSelect(card)} className="w-full mt-2">
                Add to Binder
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
