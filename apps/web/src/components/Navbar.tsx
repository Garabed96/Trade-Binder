'use client';

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LoginButton } from './LoginButton';
import { ThemeToggle } from './ThemeToggle';
import { FuzzySearchBar } from './FuzzySearchBar';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Store, Library } from 'lucide-react';
import { useSearch } from '@/src/context/SearchContext';
import Image from 'next/image';
// import { useSession } from 'next-auth/react';
import logo from '@/public/my-trade-binder.png';

export function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { t } = useTranslation(['common']);
  // const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { query, setQuery, totalMatches } = useSearch();

  return (
    <nav className="sticky top-0 z-50 w-full bg-gradient-to-r from-slate-900/90 via-indigo-900/80 to-purple-900/90 dark:from-slate-950/95 dark:via-indigo-950/90 dark:to-purple-950/95 backdrop-blur-xl border-b border-gradient-to-r from-amber-500/20 via-emerald-500/20 to-blue-500/20 shadow-lg shadow-indigo-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 md:h-20 md:py-0">
          {/* Row 1: Logo & Toggles */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href={`/${locale}`} className="group flex items-center gap-3">
              <div className="relative w-12 h-12 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Image
                  src={logo}
                  alt="My Trade Binder Logo"
                  width={48}
                  height={48}
                  className="object-contain rounded-full"
                  priority
                />
              </div>
              <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100 bg-clip-text text-transparent group-hover:from-amber-200 group-hover:via-orange-100 group-hover:to-white transition-all duration-300 hidden sm:block md:hidden lg:block">
                {t('title')}
              </h1>
            </Link>

            {/* Mobile Toggles & Login */}
            <div className="flex md:hidden items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-xl border border-slate-600/30 dark:border-slate-700/50">
                <LanguageSwitcher />
                <div className="w-px h-4 bg-slate-500 dark:bg-slate-600 mx-1" />
                <ThemeToggle />
              </div>
              {!minimal && <LoginButton />}
            </div>
          </div>

          {!minimal && (
            <>
              {/* Desktop Only Links - Removed Search, kept others closer together */}
              <div className="hidden md:flex items-center gap-4 mx-6">
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
                {/*{session && (*/}
                {/*  <NavLink*/}
                {/*    href={`/${locale}/profile`}*/}
                {/*    icon={<UserCircle className="w-4 h-4" />}*/}
                {/*    label={t('navProfile')}*/}
                {/*  />*/}
                {/*)}*/}
              </div>

              {/* Enhanced Search Bar (Row 2 on Mobile) - Now with more space */}
              <div className="mt-4 md:mt-0 w-full md:flex-1 md:max-w-2xl md:mx-6 relative">
                <FuzzySearchBar inputValue={query} setInputValue={setQuery} />
                {totalMatches > 0 && (
                  <div className="absolute right-4 top-2.5 px-2 py-0.5 rounded-md text-[10px] font-black text-amber-300 bg-slate-800/80 dark:bg-slate-900/80 border border-amber-500/30 pointer-events-none z-10 shadow-sm">
                    {totalMatches.toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Desktop Toggles */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800/60 dark:bg-slate-900/60 backdrop-blur-sm p-1.5 rounded-xl border border-slate-600/30 dark:border-slate-700/50">
              <LanguageSwitcher />
              <div className="w-px h-4 bg-slate-500 dark:bg-slate-600 mx-1" />
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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
        active
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 border border-amber-500/30 shadow-sm shadow-amber-500/20'
          : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800/40 dark:hover:bg-slate-900/40 hover:scale-105'
      }`}
    >
      {icon} <span>{label}</span>
    </Link>
  );
}
