"use client";

import {
  GiCrystalBall,
  GiCardDraw,
  GiBookCover,
  GiSwordsEmblem,
} from "react-icons/gi";
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
        icon={<GiCardDraw className="h-7 w-7" />}
        label={t("navMarketplace")}
        href={`/${locale}/marketplace`}
        active={pathname.includes("/marketplace")}
      />
      <MobileNavItem
        icon={<GiCrystalBall className="h-7 w-7" />}
        label={t("navSearch")}
        href={`/${locale}/search`}
        active={pathname.includes("/search")}
      />
      <MobileNavItem
        icon={<GiBookCover className="h-7 w-7" />}
        label={t("navBinder")}
        href={`/${locale}/binder`}
        active={pathname.includes("/binder")}
      />
      <MobileNavItem
        icon={<GiSwordsEmblem className="h-7 w-7" />}
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
        <div className="absolute inset-0 bg-purple-600/10 blur-2xl transition-opacity duration-500" />
      )}

      {/* Icon container with card-like border */}
      <div
        className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-500 ${
          active
            ? "scale-110 border border-purple-400/40 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            : "border border-white/5 bg-white/5 group-hover:border-purple-500/30 group-hover:bg-purple-500/5"
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
        className={`relative z-10 mt-1 text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-300 ${
          active
            ? "text-purple-300 drop-shadow-[0_0_4px_rgba(168,85,247,0.5)]"
            : "text-slate-500 group-hover:text-slate-400"
        }`}
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {label}
      </span>

      {/* Active indicator line */}
      {active && (
        <div className="absolute bottom-1 h-0.5 w-6 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
      )}
    </Link>
  );
}
