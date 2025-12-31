"use client";

import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LoginButton } from "./LoginButton";
import { ThemeToggle } from "./ThemeToggle";
import { FuzzySearchBar } from "./FuzzySearchBar";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Store, Library } from "lucide-react";
import { useSearch } from "@/src/context/SearchContext";
import Image from "next/image";
// import { useSession } from 'next-auth/react';
import logo from "@/public/my-trade-binder.png";

export function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { t } = useTranslation(["common"]);
  // const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { query, setQuery, totalMatches } = useSearch();

  const pathname = usePathname();
  const isProfilePage = pathname?.endsWith("/profile");
  return (
    <nav className="border-gradient-to-r sticky z-[50] w-full border-b bg-gradient-to-r from-amber-500/20 from-slate-900/90 via-emerald-500/20 via-indigo-900/80 to-blue-500/20 to-purple-900/90 shadow-lg shadow-indigo-900/20 backdrop-blur-xl md:top-0 dark:from-slate-950/95 dark:via-indigo-950/90 dark:to-purple-950/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between py-4 md:h-20 md:flex-row md:items-center md:py-0">
          {/* Row 1: Logo & Toggles */}
          <div className="flex w-full items-center justify-between md:w-auto">
            <Link href={`/${locale}`} className="group flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Image
                  src={logo}
                  alt="My Trade Binder Logo"
                  width={48}
                  height={48}
                  className="rounded-full object-contain"
                  priority
                />
              </div>
              <h1 className="hidden bg-gradient-to-r from-amber-300 via-orange-200 to-amber-100 bg-clip-text text-xl font-black tracking-tighter text-transparent transition-all duration-300 group-hover:from-amber-200 group-hover:via-orange-100 group-hover:to-white sm:block md:hidden lg:block">
                {t("title")}
              </h1>
            </Link>

            {/* Mobile Toggles & Login */}
            <div className="flex min-w-0 shrink items-center gap-2 md:hidden">
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-600/30 bg-slate-800/60 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                <LanguageSwitcher compact={true} />
                <div className="mx-1 h-4 w-px bg-slate-500 dark:bg-slate-600" />
                <ThemeToggle />
              </div>
              {!minimal && (
                <div className="overflow-hidden rounded-xl border border-slate-600/30 bg-slate-800/60 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                  <LoginButton />
                </div>
              )}
            </div>
          </div>

          {!minimal && (
            <>
              {/* Desktop Only Links - Removed Search, kept others closer together */}
              <div className="mx-6 hidden items-center gap-4 md:flex">
                <NavLink
                  href={`/${locale}/marketplace`}
                  icon={<Store className="h-4 w-4" />}
                  label={t("navMarketplace")}
                />
                <NavLink
                  href={`/${locale}/binder`}
                  icon={<Library className="h-4 w-4" />}
                  label={t("navBinder")}
                />
                {/*{session && (*/}
                {/*  <NavLink*/}
                {/*    href={`/${locale}/profile`}*/}
                {/*    icon={<UserCircle className="w-4 h-4" />}*/}
                {/*    label={t('navProfile')}*/}
                {/*  />*/}
                {/*)}*/}
              </div>

              {/* Enhanced Search Bar (Row 2 on Mobile) - Now matches the toggle styling */}
              <div
                className={`z-[50] mt-4 w-full md:mx-6 md:mt-0 md:max-w-2xl md:flex-1 ${isProfilePage ? "search-hide-mobile" : ""}`}
              >
                <div className="rounded-xl border border-slate-600/30 bg-slate-800/60 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                  <div className="relative">
                    <FuzzySearchBar
                      inputValue={query}
                      setInputValue={setQuery}
                    />
                    {totalMatches > 0 && (
                      <div className="pointer-events-none absolute top-1/2 right-2 z-[50] -translate-y-1/2 rounded-md border border-amber-500/30 bg-slate-800/80 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-sm dark:bg-slate-900/80">
                        {totalMatches.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Desktop Toggles */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1 rounded-xl border border-slate-600/30 bg-slate-800/60 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
              <LanguageSwitcher compact={false} />
              <div className="mx-1 h-4 w-px bg-slate-500 dark:bg-slate-600" />
              <ThemeToggle />
            </div>
            {!minimal && (
              <div className="rounded-xl border border-slate-600/30 bg-slate-800/60 p-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/60">
                <LoginButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-300 ${
        active
          ? "border border-amber-500/30 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 shadow-sm shadow-amber-500/20"
          : "text-slate-300 hover:scale-105 hover:bg-slate-800/40 hover:text-amber-200 dark:hover:bg-slate-900/40"
      }`}
    >
      {icon} <span>{label}</span>
    </Link>
  );
}
