'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';
import { Navbar } from '@/src/components/Navbar';
import { FilterBar } from '@/src/components/FilterBar';
import { Library, Layers, Star } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation(['common']);
  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [rarity, setRarity] = useState<string>('');
  const [setCode, setSetCode] = useState<string>('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // State for sorting
  const [orderBy, setOrderBy] = useState<'name' | 'price_usd'>('name');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(inputValue);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue]);

  const sets = trpc.card.listSets.useQuery();
  const { data, isLoading, isFetching } = trpc.card.search.useQuery(
    {
      query: debouncedSearch,
      set_code: setCode || undefined,
      rarity: rarity || undefined,
      colors: selectedColors,
      orderBy,
      orderDir,
      page,
    },
    { enabled: debouncedSearch.length >= 3 || setCode !== '', placeholderData: (prev) => prev },
  );

  const toggleColor = (c: string) => {
    setSelectedColors((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setPage(1);
  };

  const toggleSort = (field: 'name' | 'price_usd') => {
    if (orderBy === field) {
      setOrderDir(orderDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(field);
      setOrderDir(field === 'price_usd' ? 'DESC' : 'ASC');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-transparent">
      <Navbar
        inputValue={inputValue}
        setInputValue={setInputValue}
        totalMatches={data?.totalCount}
      />
      <FilterBar
        rarity={rarity}
        setRarity={(val) => {
          setRarity(val);
          setPage(1);
        }}
        setCode={setCode}
        setSetCode={(val) => {
          setSetCode(val);
          setPage(1);
        }}
        sets={sets.data}
        selectedColors={selectedColors}
        toggleColor={toggleColor}
        orderBy={orderBy}
        orderDir={orderDir}
        toggleSort={toggleSort}
      />

      <main className="p-6 md:p-12 max-w-7xl mx-auto">
        {/* Card Grid */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 transition-opacity duration-300 ${isFetching ? 'opacity-40' : 'opacity-100'}`}
        >
          {data?.cards.map((card) => (
            <div
              key={card.id}
              className="group relative flex flex-col bg-white dark:bg-slate-900/40 backdrop-blur-md rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)] hover:-translate-y-1.5 transition-all duration-500 cursor-pointer shadow-sm"
            >
              <div className="aspect-[2.5/3.5] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                {card.image_uri_normal ? (
                  <img
                    src={card.image_uri_normal}
                    alt={card.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full p-4 text-center font-bold text-slate-400 uppercase tracking-tighter">
                    {card.name}
                  </div>
                )}

                {/* Card Badges */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                  {card.rarity === 'mythic' && (
                    <span className="bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg ring-1 ring-white/20">
                      {t('mythic')}
                    </span>
                  )}
                  {card.rarity === 'rare' && (
                    <span className="bg-yellow-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-lg ring-1 ring-white/20">
                      Rare
                    </span>
                  )}
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <p className="text-white text-[10px] font-black uppercase tracking-widest truncate w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    {card.set_name}
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex-1 flex flex-col">
                <div className="space-y-1">
                  <h3
                    className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                    title={card.name}
                  >
                    {card.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase px-1.5 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-md">
                      {card.set_code}
                    </span>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter truncate">
                      {card.set_name}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-slate-100/50 dark:border-slate-800/50">
                  <span className="text-blue-600 dark:text-blue-400 font-black text-base tracking-tight">
                    {card.price_usd ? `$${card.price_usd.toFixed(2)}` : '—'}
                  </span>
                </div>

                {/* Card Options Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    title="Add to Binder"
                    className="flex-1 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all active:scale-95 shadow-md shadow-blue-500/20 gap-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Add to Binder:', card.id);
                    }}
                  >
                    <Library className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-wider">Binder</span>
                  </button>
                  <button
                    title="Add to Deck"
                    className="h-9 w-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Add to Deck:', card.id);
                    }}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Add to Wishlist"
                    className="h-9 w-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all active:scale-95 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Add to Wishlist:', card.id);
                    }}
                  >
                    <Star className="w-3.5 h-3.5 fill-current text-yellow-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 uppercase tracking-widest animate-pulse">
              {t('searching')}
            </p>
          </div>
        )}

        {debouncedSearch.length >= 3 && data?.cards.length === 0 && (
          <p className="text-center py-10 text-gray-500 dark:text-slate-400">
            {t('noResults')} "{debouncedSearch}"
          </p>
        )}

        {/* Pagination Controls */}
        {data && data.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors"
            >
              {t('previous')}
            </button>
            <span className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {t('pageOf', { page, total: data.totalPages })}
            </span>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-white transition-colors"
            >
              {t('next')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
