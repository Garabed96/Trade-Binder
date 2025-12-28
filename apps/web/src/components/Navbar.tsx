'use client';

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginButton } from './LoginButton';
import { ThemeToggle } from './ThemeToggle';
import { FuzzySearchBar } from './FuzzySearchBar';

import { useParams } from 'next/navigation';
import Link from 'next/link';

interface NavbarProps {
  inputValue?: string;
  setInputValue?: (value: string) => void;
  totalMatches?: number;
  minimal?: boolean;
}

export function Navbar({ inputValue, setInputValue, totalMatches, minimal = false }: NavbarProps) {
  const { t } = useTranslation(['common']);
  const params = useParams();
  const locale = params?.locale as string;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo/Title - Clickable to home */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Link href={`/${locale || 'en'}`}>
              <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {t('title')}
              </h1>
            </Link>
          </div>

          {!minimal && (
            <>
              {/* Search Bar - Center */}
              <div className="flex-1 max-w-2xl mx-4 md:mx-8 relative">
                {setInputValue !== undefined && inputValue !== undefined && (
                  <FuzzySearchBar inputValue={inputValue} setInputValue={setInputValue} />
                )}
                {totalMatches !== undefined && (
                  <div className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hidden sm:block pointer-events-none z-10">
                    {totalMatches.toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Right side: Toggles & Login */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {!minimal && <LoginButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}
