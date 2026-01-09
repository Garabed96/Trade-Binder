'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import { useTranslation } from 'react-i18next';
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

  return (
    <div ref={searchRef} className="relative mx-auto w-full max-w-2xl">
      <div className="group relative">
        <button
          onClick={handleSearchIconClick}
          className="absolute inset-y-0 left-0 z-[100] flex cursor-pointer items-center pl-4 hover:bg-transparent"
          type="button"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-slate-300 transition-colors group-focus-within:text-amber-400 hover:text-amber-300" />
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
          className="h-[52px] w-full rounded-2xl border border-slate-600/30 bg-slate-800/40 py-3 pr-12 pl-12 text-base font-bold text-slate-100 placeholder-slate-400 shadow-sm backdrop-blur-sm transition-all focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/50 focus:outline-none dark:border-slate-700/50 dark:bg-slate-900/60"
        />

        {isLoading && debouncedQuery.length >= 3 && (
          <div className="absolute inset-y-0 right-0 z-[100] flex items-center pr-4">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          </div>
        )}
      </div>
    </div>
  );
}
