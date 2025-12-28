'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Library, Layers, Star } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';

interface FuzzySearchBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

export function FuzzySearchBar({ inputValue, setInputValue }: FuzzySearchBarProps) {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: results, isFetching: isLoading } = trpc.card.fuzzySearch.useQuery(
    { query: inputValue },
    { enabled: inputValue.length >= 3 && isOpen },
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputValue.length >= 3 && results && results.length > 0) {
      setIsOpen(true);
    } else if (inputValue.length < 3) {
      setIsOpen(false);
    }
  }, [inputValue, results]);

  const handleClear = () => {
    setInputValue('');
    setIsOpen(false);
  };

  const handleResultClick = (cardName: string) => {
    setInputValue(cardName);
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-12 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm font-bold dark:text-white backdrop-blur-sm"
        />

        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-r-2xl transition-colors group/clear"
          >
            <X className="h-5 w-5 text-slate-400 group-hover/clear:text-slate-600 dark:group-hover/clear:text-slate-200 transition-colors" />
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-y-0 right-12 flex items-center pr-2">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && inputValue.length >= 3 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[500px] overflow-y-auto backdrop-blur-xl">
          {isLoading && !results ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                {t('searching')}
              </p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-2">
                Top Results ({results.length})
              </div>

              <div className="px-2 flex flex-col gap-2">
                {results.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleResultClick(card.name)}
                    className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-xl transition-all flex items-center gap-4 cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 group/item"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 shadow-sm">
                      {card.image_uri_small ? (
                        <img
                          src={card.image_uri_small}
                          alt={card.name}
                          className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">
                          MTG
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-xs group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                          {card.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400">
                            {card.price_usd ? `$${Number(card.price_usd).toFixed(2)}` : '—'}
                          </p>
                          <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {card.set_code}
                          </p>
                        </div>
                      </div>

                      {/* Options Row */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          title="Add to Binder"
                          className="px-2.5 py-1.5 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all active:scale-95 shadow-sm gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Add to Binder:', card.id);
                          }}
                        >
                          <Library className="w-3 h-3" />
                          <span className="hidden sm:inline text-[8px] font-black uppercase tracking-tighter">
                            Binder
                          </span>
                        </button>
                        <button
                          title="Add to Deck"
                          className="px-2.5 py-1.5 flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all active:scale-95 border border-slate-300 dark:border-slate-600 shadow-sm gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Add to Deck:', card.id);
                          }}
                        >
                          <Layers className="w-3 h-3" />
                          <span className="hidden sm:inline text-[8px] font-black uppercase tracking-tighter">
                            Deck
                          </span>
                        </button>
                        <button
                          title="Add to Wishlist"
                          className="px-2.5 py-1.5 flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-all active:scale-95 border border-slate-300 dark:border-slate-600 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Add to Wishlist:', card.id);
                          }}
                        >
                          <Star className="w-3 h-3 fill-current text-yellow-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('noResults')} "{inputValue}"
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Try different keywords
              </p>
            </div>
          )}

          {/* View All Link */}
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold uppercase tracking-widest"
            >
              View all results for "{inputValue}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
