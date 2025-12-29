'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';

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

  const handleResultClick = (cardName: string) => {
    setInputValue(cardName);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsOpen(false);
      // If we are not on the search page, the Navbar might need to redirect.
      // But since we are using global SearchContext, the search page will already be filtering if it's mounted.
    }
  };

  const showDropdown = isOpen && inputValue.length >= 3;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
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
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-12 pr-12 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-sm font-bold dark:text-white backdrop-blur-sm"
        />

        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && (
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
              {results.map((card) => (
                <div
                  key={card.id}
                  onClick={() => handleResultClick(card.name)}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="relative h-12 w-8 flex-shrink-0 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                    {card.image_uri_small ? (
                      <Image
                        src={card.image_uri_small}
                        alt={card.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[8px] font-bold text-slate-400">
                        MTG
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {card.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
                        {card.set_code}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {card.set_name}
                      </span>
                    </div>
                  </div>
                  {card.price_usd && (
                    <div className="text-xs font-black text-blue-600 dark:text-blue-400">
                      ${card.price_usd.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('noResults')} &quot;{inputValue}&quot;
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold uppercase tracking-widest"
            >
              View all results for &quot;{inputValue}&quot;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
