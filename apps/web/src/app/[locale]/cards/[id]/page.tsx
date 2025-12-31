'use client';

import { use } from 'react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { ChevronLeft, Library, Layers, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: card, isLoading } = trpc.card.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!card) {
    return <div className="p-12 text-center">Card not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Search
        </button>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Card Image */}
          <div className="relative aspect-[2.5/3.5] w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            {card.image_uri_normal ? (
              <Image
                fill
                src={card.image_uri_normal}
                alt={card.name}
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-900 text-slate-400">
                No Image Available
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
                  {card.set_code}
                </span>
                <span className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-widest">
                  {card.rarity}
                </span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                {card.name}
              </h1>
              <p className="text-lg font-bold text-slate-500 dark:text-slate-400">
                {card.type_line}
              </p>
            </div>

            {card.oracle_text && (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {card.oracle_text}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between py-6 border-y border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                  Current Price
                </p>
                <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {card.price_usd ? `$${card.price_usd.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Set</p>
                <p className="font-bold text-slate-900 dark:text-white">{card.set_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center justify-center p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all gap-2 shadow-lg shadow-blue-500/20">
                <Library className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Add to Binder</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all gap-2 border border-slate-200/50 dark:border-slate-700/50">
                <Layers className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase">Add to Deck</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all gap-2 border border-slate-200/50 dark:border-slate-700/50">
                <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                <span className="text-[10px] font-black uppercase">Wishlist</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
