"use client";

import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "th" : "en";

    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;

    i18n.changeLanguage(newLang);

    const segments = pathname.split("/").filter(Boolean);

    if (segments.length > 0 && ["en", "th"].includes(segments[0])) {
      segments[0] = newLang;
    } else {
      segments.unshift(newLang);
    }

    const newPathname = "/" + segments.join("/");

    // Use window.history.pushState to change URL without reload
    window.history.pushState({}, "", newPathname);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {compact
        ? // Mobile: Text only
          i18n.language === "en"
          ? "EN"
          : "TH"
        : // Desktop: Flag + Text
          i18n.language === "en"
          ? "🇬🇧 EN"
          : "🇹🇭 TH"}
    </button>
  );
}
