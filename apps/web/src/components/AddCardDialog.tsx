// apps/web/src/components/AddCardDialog.tsx
'use client';

import { useState } from 'react';
import { trpc } from '@/src/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Checkbox } from '@/src/components/ui/checkbox';
import { CardBrowser } from './CardBrowser';

interface AddCardDialogProps {
  binderId: string;
  children: React.ReactNode;
}

export function AddCardDialog({ binderId, children }: AddCardDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [condition, setCondition] = useState('Near Mint');
  const [isFoil, setIsFoil] = useState(false);
  const [language, setLanguage] = useState('en');
  const [quantity, setQuantity] = useState(1);

  const utils = trpc.useUtils();
  const addCardMutation = trpc.binder.addCard.useMutation({
    onSuccess: () => {
      utils.binder.getCards.invalidate({ binderId });
      setIsOpen(false);
      setSelectedCard(null);
    },
  });

  const handleAddCard = () => {
    if (!selectedCard) return;

    addCardMutation.mutate({
      binderId,
      printingId: selectedCard.id,
      condition: condition as any,
      isFoil,
      language,
      quantity,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Cards to Binder</DialogTitle>
        </DialogHeader>

        {!selectedCard ? (
          <CardBrowser onCardSelect={setSelectedCard} />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setSelectedCard(null)}>
                ← Back to search
              </Button>
              <h3 className="font-semibold">Adding: {selectedCard.name}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Near Mint">Near Mint</SelectItem>
                    <SelectItem value="Lightly Played">Lightly Played</SelectItem>
                    <SelectItem value="Moderately Played">Moderately Played</SelectItem>
                    <SelectItem value="Heavily Played">Heavily Played</SelectItem>
                    <SelectItem value="Damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="foil" checked={isFoil} onCheckedChange={setIsFoil} />
              <Label htmlFor="foil">Foil</Label>
            </div>

            <Button onClick={handleAddCard} disabled={addCardMutation.isPending} className="w-full">
              {addCardMutation.isPending ? 'Adding...' : `Add ${quantity} card(s)`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
