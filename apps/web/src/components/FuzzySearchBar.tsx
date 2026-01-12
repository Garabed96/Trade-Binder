'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, AlertCircle, X } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

interface FuzzySearchBarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
}

export function FuzzySearchBar({
  inputValue,
  setInputValue,
}: FuzzySearchBarProps) {
  const { t } = useTranslation(['common']);
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Debounce the search query to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const {
    data: results,
    isFetching: isLoading,
    error,
    isError,
  } = trpc.card.fuzzySearch.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 3,
      retry: 1,
      staleTime: 300,
      refetchOnWindowFocus: false,
    }
  );

  // Debug logs
  useEffect(() => {
    if (debouncedQuery.length >= 3) {
      console.log('🔍 Fuzzy Search State:', {
        inputValue,
        debouncedQuery,
        queryLength: debouncedQuery.length,
        isOpen,
        isLoading,
        isError,
        error: error?.message,
        resultsCount: results?.length ?? 0,
        results: results?.map(r => r.name),
      });
    }
  }, [debouncedQuery, isOpen, isLoading, results, isError, error, inputValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (cardId: string) => {
    setIsOpen(false);
    router.push(`/${locale}/cards/${cardId}`);
  };

  const navigateToSearch = () => {
    setIsOpen(false);
    router.push(`/${locale}/search`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      navigateToSearch();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSearchIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateToSearch();
  };

  const handleClearSearch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue('');
    setIsOpen(false);
  };

  const showDropdown = isOpen && debouncedQuery.length >= 3;

  return (
    <div ref={searchRef} className="relative mx-auto w-full max-w-2xl">
      <div className="group relative">
        <button
          onClick={handleSearchIconClick}
          className="absolute inset-y-0 left-0 z-100 flex cursor-pointer items-center pl-4 hover:bg-transparent"
          type="button"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-slate-500 transition-colors group-focus-within:text-indigo-500 hover:text-indigo-400 dark:text-slate-400 dark:group-focus-within:text-amber-400 dark:hover:text-amber-300" />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={e => {
            setInputValue(e.target.value);
            if (e.target.value.length >= 3) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (inputValue.length >= 3) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          className="h-10 w-full rounded-2xl border border-slate-300 bg-transparent pr-12 pl-12 text-sm font-bold text-slate-900 placeholder-slate-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none dark:border-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-amber-400/50 dark:focus:ring-amber-400/50"
        />

        {isLoading && debouncedQuery.length >= 3 ? (
          <div className="absolute inset-y-0 right-14 z-100 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          </div>
        ) : inputValue.length > 0 ? (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-14 z-100 flex cursor-pointer items-center hover:bg-transparent"
            type="button"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-2 max-h-[500px] w-full overflow-y-auto rounded-2xl border border-slate-600/50 bg-slate-800/95 shadow-2xl backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/95">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-amber-400" />
              <p className="animate-pulse text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                {t('searching')}
              </p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="mb-1 text-sm font-bold text-red-400">
                Search Error
              </p>
              <p className="text-xs text-slate-400">
                {error?.message || 'Something went wrong'}
              </p>
            </div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              {results.map(card => (
                <div
                  key={card.id}
                  onClick={() => handleResultClick(card.id)}
                  className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-slate-700/50 dark:hover:bg-slate-800/70"
                >
                  <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-700 dark:bg-slate-800">
                    {card.image_uri_normal ? (
                      <Image
                        src={card.image_uri_normal}
                        alt={card.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-slate-400">
                        MTG
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-100 dark:text-slate-100">
                      {card.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-amber-400 uppercase dark:text-amber-400">
                        {card.set_code}
                      </span>
                      <span className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                        {card.set_name}
                      </span>
                    </div>
                  </div>
                  {card.price_usd && (
                    <div className="text-xs font-black text-amber-300 dark:text-amber-400">
                      ${card.price_usd.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : debouncedQuery.length >= 3 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-400 dark:text-slate-400">
                {t('noResults')} &quot;{debouncedQuery}&quot;
              </p>
            </div>
          ) : null}

          {results && results.length > 0 && (
            <div className="border-t border-slate-600/50 bg-slate-700/30 px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800/50">
              <button
                onClick={navigateToSearch}
                className="text-xs font-bold tracking-widest text-amber-300 uppercase transition-colors hover:text-amber-200 dark:text-amber-400"
              >
                View all results for &quot;{debouncedQuery}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
