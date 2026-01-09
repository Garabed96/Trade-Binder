"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LoginButton } from "./LoginButton";
import { ThemeToggle } from "./ThemeToggle";
import { FuzzySearchBar } from "./FuzzySearchBar";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Library, Palette } from "lucide-react";
import { useSearch } from "@/src/context/SearchContext";
import Image from "next/image";
import { useSession } from "next-auth/react";
import logo from "@/public/my-trade-binder.png";

export function Navbar({ minimal = false }: { minimal?: boolean }) {
  const { t } = useTranslation(["common"]);
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { query, setQuery, totalMatches } = useSearch();
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  const pathname = usePathname();
  const isProfilePage = pathname?.endsWith("/profile");

  // Track scroll direction for nav visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current) {
        setNavVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setNavVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-[50] w-full border-b border-slate-200/50 bg-gradient-to-r from-indigo-100 via-purple-100 to-amber-100 shadow-sm transition-transform duration-300 dark:border-slate-800/50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 ${navVisible ? "translate-y-0" : "-translate-y-full"}`}
    >
      <div className="container-default">
        <div className="flex flex-col justify-between py-4 md:h-20 md:flex-row md:items-center md:py-0">
          {/* Row 1: Logo & Toggles */}
          <div className="flex w-full items-center justify-between md:w-auto">
            <Link href={`/${locale}`} className="group flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center transition-all duration-300 group-hover:scale-110">
                <Image
                  src={logo}
                  alt="My Trade Binder Logo"
                  className="rounded-full object-contain"
                  priority
                />
              </div>
              <h1 className="hidden bg-gradient-to-r from-indigo-700 via-purple-600 to-amber-600 bg-clip-text text-xl font-black tracking-tighter text-transparent transition-all duration-300 group-hover:from-indigo-600 group-hover:via-purple-500 group-hover:to-amber-500 sm:block md:hidden lg:block dark:from-amber-300 dark:via-orange-200 dark:to-amber-100 dark:group-hover:from-amber-200 dark:group-hover:via-orange-100 dark:group-hover:to-white">
                {t("title")}
              </h1>
            </Link>

            {/* Mobile Toggles & Login */}
            <div className="flex min-w-0 shrink items-center gap-2 md:hidden">
              <LanguageSwitcher compact={true} />
              <ThemeToggle />
              {!minimal && <LoginButton />}
            </div>
          </div>

          {!minimal && (
            <>
              {/* Desktop Only Links */}
              <div className="mx-6 hidden items-center gap-4 md:flex">
                {session && (
                  <NavLink
                    href={`/${locale}/binder`}
                    icon={<Library className="h-4 w-4" />}
                    label={t("navBinder")}
                  />
                )}
                {process.env.NODE_ENV === "development" && (
                  <NavLink
                    href={`/${locale}/styleguide`}
                    icon={<Palette className="h-4 w-4" />}
                    label="Styleguide"
                  />
                )}
              </div>

              {/* Search Bar */}
              <div
                className={`relative z-[50] mt-4 w-full md:mx-6 md:mt-0 md:max-w-2xl md:flex-1 ${isProfilePage ? "search-hide-mobile" : ""}`}
              >
                <FuzzySearchBar inputValue={query} setInputValue={setQuery} />
                {totalMatches > 0 && (
                  <div className="pointer-events-none absolute top-1/2 right-2 z-[50] -translate-y-1/2 rounded-2xl border border-amber-500/30 bg-slate-800/80 px-2 py-0.5 text-[10px] font-black text-amber-300 shadow-sm dark:bg-slate-900/80">
                    {totalMatches.toLocaleString()}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Desktop Toggles */}
          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher compact={false} />
            <ThemeToggle />
            {!minimal && <LoginButton />}
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
      className={`flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition-all duration-300 ${
        active
          ? "border border-indigo-500/30 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-700 shadow-sm shadow-indigo-500/20 dark:border-amber-500/30 dark:from-amber-500/20 dark:to-orange-500/20 dark:text-amber-200 dark:shadow-amber-500/20"
          : "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {icon} <span>{label}</span>
    </Link>
  );
}
