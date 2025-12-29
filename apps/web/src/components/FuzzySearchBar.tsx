'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';

interface FuzzySearchBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

// ... (imports and interface stay the same)

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

  // const handleClear = () => {
  //   setInputValue('');
  //   setIsOpen(false);
  // };

  const handleResultClick = (cardName: string) => {
    setInputValue(cardName);
    setIsOpen(false);
  };

  // Logic: Only show the dropdown if user is focused/open AND has typed enough.
  // We don't need a useEffect to "set" this state; it calculates naturally.
  const showDropdown = isOpen && inputValue.length >= 3;

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input Section */}
      <div className="relative group">
        <div
          className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
          suppressHydrationWarning
        >
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
        {/* ... Clear and Loading buttons remain the same ... */}
      </div>

      {/* Results Dropdown */}
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
              {/* ... Mapping results logic ... */}
              {results.map((card) => (
                <div key={card.id} onClick={() => handleResultClick(card.name)} /*...*/>
                  {/* Card Content */}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {/* FIXED: Escaped entities */}
                {t('noResults')} &quot;{inputValue}&quot;
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
              {/* FIXED: Escaped entities */}
              View all results for &quot;{inputValue}&quot;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
