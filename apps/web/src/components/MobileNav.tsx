"use client";

import { Store, Search, Library, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

export function MobileNav() {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <div className="pb-safe fixed right-0 bottom-0 left-0 z-50 flex h-20 transform-gpu items-center justify-around border-t-2 border-amber-600/30 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900/95 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] backdrop-blur-xl md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-amber-900/10 to-transparent" />
      <MobileNavItem
        icon={<Store className="h-6 w-6" />}
        label={t("navMarketplace")}
        href={`/${locale}/marketplace`}
        active={pathname.includes("/marketplace")}
      />
      <MobileNavItem
        icon={<Search className="h-6 w-6" />}
        label={t("navSearch")}
        href={`/${locale}/search`}
        active={pathname.includes("/search")}
      />
      <MobileNavItem
        icon={<Library className="h-6 w-6" />}
        label={t("navBinder")}
        href={`/${locale}/binder`}
        active={pathname.includes("/binder")}
      />
      <MobileNavItem
        icon={<User className="h-6 w-6" />}
        label={t("navProfile")}
        href={`/${locale}/profile`}
        active={pathname.includes("/profile")}
      />
    </div>
  );
}

function MobileNavItem({
  icon,
  label,
  href,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-1 flex-col items-center justify-center gap-1.5 py-2"
    >
      {/* Glow effect when active */}
      {active && (
        <div className="bg-gradient-radial absolute inset-0 from-amber-500/20 via-transparent to-transparent blur-xl" />
      )}

      {/* Icon container with card-like border */}
      <div
        className={`relative flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${
          active
            ? "scale-110 bg-gradient-to-br from-amber-600 to-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
            : "border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 group-hover:border-amber-600/50 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]"
        }`}
      >
        {/* Inner border glow */}
        <div
          className={`absolute inset-[1px] rounded-lg transition-all duration-300 ${
            active
              ? "bg-gradient-to-br from-amber-500/20 to-transparent"
              : "bg-gradient-to-br from-slate-700/30 to-transparent group-hover:from-amber-900/20"
          }`}
        />

        {/* Icon */}
        <div
          className={`relative z-10 transition-all duration-300 ${
            active
              ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              : "text-slate-400 group-hover:text-amber-400"
          }`}
        >
          {icon}
        </div>
      </div>

      {/* Label */}
      <span
        className={`relative z-10 text-[9px] font-bold tracking-wider uppercase transition-all duration-300 ${
          active
            ? "text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
            : "text-slate-500 group-hover:text-amber-500/80"
        }`}
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {label}
      </span>

      {/* Active indicator line */}
      {active && (
        <div className="absolute -top-[1px] left-1/2 h-0.5 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      )}
    </Link>
  );
}
