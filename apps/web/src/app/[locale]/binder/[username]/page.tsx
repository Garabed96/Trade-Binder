'use client';

import { use, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { Search, User, ChevronLeft, Loader2 } from 'lucide-react';

export default function PublicBinderPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { t } = useTranslation();
  const { username } = use(params);
  const router = useRouter();
  const routeParams = useParams();
  const locale = (routeParams?.locale as string) || 'en';

  const [filterQuery, setFilterQuery] = useState('');

  const {
    data: binder,
    isLoading,
    error,
  } = trpc.binder.getByUsername.useQuery({ username }, { retry: false });

  // Extract cards for stable dependency
  const cards = useMemo(() => binder?.cards ?? [], [binder?.cards]);

  // Filter binder cards
  const filteredCards = useMemo(() => {
    if (!filterQuery) return cards;

    const query = filterQuery.toLowerCase();
    return cards.filter(
      card =>
        card.name.toLowerCase().includes(query) ||
        card.set_name.toLowerCase().includes(query) ||
        card.set_code.toLowerCase().includes(query)
    );
  }, [cards, filterQuery]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return cards.reduce((sum, card) => sum + (card.price_usd || 0), 0);
  }, [cards]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !binder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black py-12 text-slate-100">
        <div className="container-default text-center">
          <h1 className="mb-4 text-3xl font-black text-slate-200">
            {t('page.binder.binderNotFound')}
          </h1>
          <p className="mb-8 text-slate-400">
            {t('page.binder.binderNotExist')}
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('page.binder.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black py-8 text-slate-100">
      <div className="container-default">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-200"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('back')}
        </button>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100 md:text-4xl">
                {binder.name}
              </h1>
              <p className="mt-1 text-slate-400">
                {t('by')}{' '}
                <span className="font-bold text-blue-400">
                  {binder.username}
                </span>
              </p>
            </div>
          </div>

          {binder.description && (
            <p className="mt-4 text-slate-400">{binder.description}</p>
          )}

          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              {t('cardsCount', { count: binder.cardCount })}
            </span>
            <span className="font-bold text-blue-400">
              {t('page.binder.totalValue', { value: totalValue.toFixed(2) })}
            </span>
          </div>
        </header>

        {/* Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder={t('page.binder.filterPlaceholder')}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pr-4 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Card Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredCards.map(card => (
              <div
                key={card.id}
                onClick={() =>
                  router.push(`/${locale}/cards/design/${card.oracle_id}`)
                }
                className="group cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:shadow-lg"
              >
                {/* Card Image */}
                <div className="relative aspect-[2.5/3.5] bg-slate-800">
                  {card.image_uri_normal ? (
                    <Image
                      src={card.image_uri_normal}
                      alt={card.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      {t('noImage')}
                    </div>
                  )}

                  {/* Foil badge */}
                  {card.is_foil && (
                    <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                      {t('foil')}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <p
                    className="truncate text-sm font-bold text-slate-200"
                    title={card.name}
                  >
                    {card.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase">
                      {card.set_code}
                    </span>
                    <span className="truncate text-[10px] text-slate-500">
                      {card.set_name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-400">
                      {card.price_usd ? `$${card.price_usd.toFixed(2)}` : '—'}
                    </span>
                    {card.rarity === 'mythic' && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase">
                        {t('rarityMythic')}
                      </span>
                    )}
                    {card.rarity === 'rare' && (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-400 uppercase">
                        {t('rarityRare')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
            <p className="text-lg font-bold text-slate-400">
              {filterQuery
                ? t('page.binder.noCardsMatchFilter')
                : t('page.binder.binderEmpty')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
