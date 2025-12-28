'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/src/utils/trpc';

export default function Home() {
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
      setPage(1); // Reset to page 1 on search change
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
      // If already sorting by this field, just flip the direction
      setOrderDir(orderDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // If switching to a new field, set it and default to ASC (or DESC for price)
      setOrderBy(field);
      setOrderDir(field === 'price_usd' ? 'DESC' : 'ASC');
    }
  };

  const colorMap = [
    { code: 'W', label: 'White', color: 'bg-[#f9faf4] border-[#d3d3d3] text-[#a09050]' },
    { code: 'U', label: 'Blue', color: 'bg-[#e1f5fe] border-[#29b6f6] text-[#0277bd]' },
    { code: 'B', label: 'Black', color: 'bg-[#eceff1] border-[#455a64] text-[#263238]' },
    { code: 'R', label: 'Red', color: 'bg-[#ffebee] border-[#ef5350] text-[#c62828]' },
    { code: 'G', label: 'Green', color: 'bg-[#e8f5e9] border-[#66bb6a] text-[#2e7d32]' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 max-w-7xl mx-auto">
      <header className="mb-10 space-y-6">
        {/* Title Section */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tighter text-slate-900">
              Trade-Binder
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Magic: The Gathering Collection</p>
          </div>
          {data && (
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-lg border border-slate-200">
              {data.totalCount.toLocaleString()} Matches
            </div>
          )}
        </div>

        {/* Primary Row: Search and Rarity */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 group">
            <input
              type="text"
              placeholder="Search by card name..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-medium"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <span className="absolute left-4 top-4 text-2xl grayscale group-focus-within:grayscale-0 transition-all">
              🔍
            </span>
          </div>

          <select
            className="md:w-64 px-6 py-4 rounded-2xl border-2 border-transparent bg-white shadow-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer appearance-none"
            value={rarity}
            onChange={(e) => {
              setRarity(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Rarities</option>
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="mythic">Mythic</option>
          </select>
        </div>

        {/* Secondary Row: Advanced Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-slate-200/50 rounded-3xl border border-slate-200">
          {/* Left: Sets and Colors */}
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1">
                Expansion Set
              </label>
              <select
                className="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                value={setCode}
                onChange={(e) => {
                  setSetCode(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Sets</option>
                {sets.data?.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1">
                Color Filter
              </label>
              <div className="flex gap-2">
                {colorMap.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => toggleColor(c.code)}
                    className={`w-10 h-10 rounded-xl border-2 transition-all flex items-center justify-center font-black text-sm shadow-sm ${
                      selectedColors.includes(c.code)
                        ? `${c.color} scale-105 border-current`
                        : 'bg-white border-slate-200 text-slate-300 hover:border-slate-300'
                    }`}
                    title={c.label}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sorting Controls */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter ml-1 lg:text-right block">
              Order By
            </label>
            <div className="flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => toggleSort('name')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  orderBy === 'name'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                NAME {orderBy === 'name' && (orderDir === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleSort('price_usd')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  orderBy === 'price_usd'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                PRICE {orderBy === 'price_usd' && (orderDir === 'ASC' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Card Grid */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 transition-opacity duration-300 ${isFetching ? 'opacity-40' : 'opacity-100'}`}
      >
        {data?.cards.map((card) => (
          <div
            key={card.id}
            className="group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-[2.5/3.5] relative overflow-hidden bg-slate-100">
              {card.image_uri_normal ? (
                <img
                  src={card.image_uri_normal}
                  alt={card.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full p-4 text-center font-bold text-slate-400 uppercase tracking-tighter">
                  {card.name}
                </div>
              )}
              {card.rarity === 'mythic' && (
                <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Mythic
                </span>
              )}
            </div>
            <div className="p-4 space-y-1">
              <h3 className="font-bold text-slate-900 truncate text-sm" title={card.name}>
                {card.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate">{card.set_name}</p>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-blue-600 font-black text-sm">
                  {card.price_usd ? `$${card.price_usd.toFixed(2)}` : '—'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {card.set_code}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isLoading && <p className="text-center py-10">Searching the archives...</p>}
      {inputValue.length >= 3 && data?.cards.length === 0 && (
        <p className="text-center py-10 text-gray-500">No cards found matching "{inputValue}"</p>
      )}
      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="font-medium text-slate-700">
            Page {page} of {data.totalPages}
          </span>
          <button
            disabled={page === data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
