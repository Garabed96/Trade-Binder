'use client';

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginButton } from './LoginButton';
import { ThemeToggle } from './ThemeToggle';
import { FuzzySearchBar } from './FuzzySearchBar';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Store, Search, Library } from 'lucide-react';
import { useSearch } from '@/src/context/SearchContext';

export function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { t } = useTranslation(['common']);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { query, setQuery, totalMatches } = useSearch();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:h-20 md:py-0">
          {/* Row 1: Logo & Toggles */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href={`/${locale}`} className="group flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Library className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all hidden sm:block md:hidden lg:block">
                {t('title')}
              </h1>
            </Link>

            {/* Mobile Toggles & Login */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <LanguageSwitcher />
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                <ThemeToggle />
              </div>
              {!minimal && <LoginButton />}
            </div>
          </div>

          {!minimal && (
            <>
              {/* Desktop Only Links */}
              <div className="hidden md:flex items-center gap-6 mx-8">
                <NavLink
                  href={`/${locale}/marketplace`}
                  icon={<Store className="w-4 h-4" />}
                  label={t('navMarketplace')}
                />
                <NavLink
                  href={`/${locale}/binder`}
                  icon={<Library className="w-4 h-4" />}
                  label={t('navBinder')}
                />
                <NavLink
                  href={`/${locale}/search`}
                  icon={<Search className="w-4 h-4" />}
                  label={t('navSearch')}
                />
              </div>

              {/* Search Bar (Row 2 on Mobile) */}
              <div className="mt-4 md:mt-0 w-full md:flex-1 md:max-w-xl md:mx-4 relative">
                <FuzzySearchBar inputValue={query} setInputValue={setQuery} />
                {totalMatches > 0 && (
                  <div className="absolute right-4 top-2.5 px-2 py-0.5 rounded-md text-[10px] font-black text-slate-400 bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-700/50 pointer-events-none z-10">
                    {totalMatches.toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Desktop Toggles */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <LanguageSwitcher />
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
              <ThemeToggle />
            </div>
            {!minimal && <LoginButton />}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 text-sm font-bold transition-colors ${
        active ? 'text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
      }`}
    >
      {icon} <span>{label}</span>
    </Link>
  );
}
