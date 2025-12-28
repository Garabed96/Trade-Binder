'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginButton } from './LoginButton';
import { ThemeToggle } from './ThemeToggle';
import { trpc } from '@/src/utils/trpc';

interface NavbarProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  totalMatches?: number;
}

export function Navbar({ inputValue, setInputValue, totalMatches }: NavbarProps) {
  const { t } = useTranslation(['common']);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: fuzzyResults, isFetching: isFuzzyLoading } = trpc.card.fuzzySearch.useQuery(
    { query: inputValue },
    { enabled: inputValue.length >= 3 && showDropdown },
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Title - Hidden on small mobile if search is expanded, or just smaller */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <h1 className="hidden md:block text-2xl font-black tracking-tighter text-slate-900 dark:text-white">
              {t('title')}
            </h1>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl mx-4 md:mx-8 relative" ref={dropdownRef}>
            <div className="relative group">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white shadow-inner focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              <span className="absolute left-3 top-2.5 text-lg grayscale group-focus-within:grayscale-0 transition-all">
                🔍
              </span>
              {totalMatches !== undefined && (
                <div className="absolute right-3 top-2 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hidden sm:block">
                  {totalMatches.toLocaleString()}
                </div>
              )}
            </div>

            {/* Fuzzy Search Dropdown */}
            {showDropdown && inputValue.length >= 3 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
                {isFuzzyLoading && fuzzyResults === undefined ? (
                  <div className="p-4 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">
                    {t('searching')}
                  </div>
                ) : fuzzyResults && fuzzyResults.length > 0 ? (
                  <div className="py-2">
                    {fuzzyResults.map((card) => (
                      <div
                        key={card.id}
                        className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-4 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
                        onClick={() => {
                          setInputValue(card.name);
                          setShowDropdown(false);
                        }}
                      >
                        <div className="w-10 h-14 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                          {card.image_uri_small ? (
                            <img
                              src={card.image_uri_small}
                              alt={card.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-bold">
                              MTG
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {card.name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                            {card.set_name} • {card.set_code}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {t('noResults')} "{inputValue}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right side: Toggles & Login */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <LoginButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
