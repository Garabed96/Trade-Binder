'use client';

import { useTranslation } from 'react-i18next';
// import { useRouter, usePathname } from 'next/navigation';
import { usePathname } from 'next/navigation';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  // const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'th' : 'en';

    // 1. Set the cookie for future page loads
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;

    // 2. Change language immediately WITHOUT navigation
    i18n.changeLanguage(newLang);

    // 3. Update the URL without reloading the page
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length > 0 && ['en', 'th'].includes(segments[0])) {
      segments[0] = newLang;
    } else {
      segments.unshift(newLang);
    }

    const newPathname = '/' + segments.join('/');

    // Use window.history.pushState to change URL without reload
    window.history.pushState({}, '', newPathname);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
    >
      {i18n.language === 'en' ? '🇬🇧 EN' : '🇹🇭 TH'}
    </button>
  );
}
