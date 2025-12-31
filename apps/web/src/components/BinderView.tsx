// apps/web/src/components/BinderView.tsx
'use client';

import { trpc } from '@/src/utils/trpc';
import { Button } from '@/src/components/ui/button';
import { AddCardDialog } from './AddCardDialog';
import { Plus } from 'lucide-react';

interface BinderViewProps {
  binderId: string;
}

export function BinderView({ binderId }: BinderViewProps) {
  const { data: binder } = trpc.binder.getById.useQuery({ id: binderId });
  const { data: cards, isLoading } = trpc.binder.getCards.useQuery({ binderId });

  const utils = trpc.useUtils();
  // const removeCardMutation = trpc.binder.removeCard.useMutation({
  //   onSuccess: () => {
  //     utils.binder.getCards.invalidate({ binderId });
  //   },
  //   onError: () => {
  //     console.error('Failed to remove card');
  //   },
  // });
  //
  // const handleRemoveCard = (userCardId: string) => {
  //   removeCardMutation.mutate({ userCardId });
  // };

  if (!binder) return <div>Binder not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{binder.name}</h1>
        <AddCardDialog binderId={binderId}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Cards
          </Button>
        </AddCardDialog>
      </div>

      {isLoading ? (
        <div>Loading cards...</div>
      ) : cards?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No cards in this binder yet</p>
          <AddCardDialog binderId={binderId}>
            <Button>Add your first card</Button>
          </AddCardDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards?.map((card) => (
            <div key={card.user_card_id} className="border rounded-lg p-4">
              {card.image_uri_normal && (
                <img
                  src={card.image_uri_normal}
                  alt={card.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
              )}
              <h3 className="font-semibold text-sm">{card.name}</h3>
              <p className="text-xs text-gray-600">{card.set_name}</p>
              {card.condition && (
                <p className="text-xs text-gray-500">Condition: {card.condition}</p>
              )}
              {card.is_foil && <p className="text-xs text-yellow-600">★ Foil</p>}
              <Button
                size="sm"
                variant="destructive"
                // onClick={() => handleRemoveCard(card.user_card_id)}
                className="w-full mt-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
