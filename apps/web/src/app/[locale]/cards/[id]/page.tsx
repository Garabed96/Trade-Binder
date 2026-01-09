'use client';

import { use, useState } from 'react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { ChevronLeft, Library, Layers, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { status } = useSession();
  const [message, setMessage] = useState<string | null>(null);

  const { data: card, isLoading } = trpc.card.getById.useQuery({ id });
  const { data: binderList } = trpc.binder.list.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const utils = trpc.useUtils();

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const addToBinder = trpc.inventory.add.useMutation({
    onSuccess: async () => {
      const binderName =
        binderList?.binders?.find(b => b.id === binderList.defaultBinderId)
          ?.name || 'binder';
      showMessage(`Card added to ${binderName}!`);
      await utils.binder.list.invalidate();
    },
    onError: (err: { message: string }) => {
      showMessage(`Error: ${err.message}`);
    },
  });

  const handleAddToBinder = () => {
    if (status !== 'authenticated') {
      showMessage('Please sign in to add cards to your binder');
      return;
    }

    if (!binderList?.defaultBinderId) {
      showMessage('Please create a binder first');
      router.push('/binders');
      return;
    }

    if (!card) return;

    addToBinder.mutate({
      printingId: card.id,
      binderId: binderList.defaultBinderId,
      isFoil: false,
      language: 'en',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
      </div>
    );
  }

  if (!card) {
    return <div className="p-12 text-center">Card not found</div>;
  }

  return (
    <div className="bg-background min-h-screen p-6 md:p-12">
      {/* Toast Message */}
      {message && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
          <p className="text-sm text-slate-200">{message}</p>
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase transition-colors hover:text-blue-500"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Search
        </button>

        <div className="grid items-start gap-12 md:grid-cols-2">
          {/* Card Image */}
          <div className="relative mx-auto aspect-[2.5/3.5] w-full max-w-md overflow-hidden rounded-3xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            {card.image_uri_normal ? (
              <Image
                fill
                src={card.image_uri_normal}
                alt={card.name}
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-900">
                No Image Available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-black text-blue-600 uppercase dark:bg-blue-900/30 dark:text-blue-400">
                  {card.set_code}
                </span>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase dark:text-slate-500">
                  {card.rarity}
                </span>
              </div>
              <h1 className="text-4xl leading-tight font-black text-slate-900 dark:text-white">
                {card.name}
              </h1>
              <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {card.type_line}
              </p>
            </div>

            {card.oracle_text && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                  {card.oracle_text}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-y border-slate-100 py-6 dark:border-slate-800">
              <div>
                <p className="mb-1 text-[10px] font-black text-slate-400 uppercase">
                  Current Price
                </p>
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {card.price_usd ? `$${card.price_usd.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[10px] font-black text-slate-400 uppercase">
                  Set
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {card.set_name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={handleAddToBinder}
                disabled={addToBinder.isPending}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-blue-600 p-4 text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Library className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase">
                  {addToBinder.isPending ? 'Adding...' : 'Add to Binder'}
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/50 bg-slate-100 p-4 text-slate-600 transition-all hover:bg-slate-200 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Layers className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase">
                  Add to Deck
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/50 bg-slate-100 p-4 text-slate-600 transition-all hover:bg-slate-200 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                <span className="text-[10px] font-black uppercase">
                  Wishlist
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
