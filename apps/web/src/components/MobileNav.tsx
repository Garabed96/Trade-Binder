'use client';

import { Store, Search, Library, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';

export function MobileNav() {
  const { t } = useTranslation('common');
  const pathname = usePathname();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 flex md:hidden items-center justify-around pb-safe px-2 transform-gpu">
      <MobileNavItem
        icon={<Store className="w-5 h-5" />}
        label={t('navMarketplace')}
        href={`/${locale}/marketplace`}
        active={pathname.includes('/marketplace')}
      />
      <MobileNavItem
        icon={<Search className="w-5 h-5" />}
        label={t('navSearch')}
        href={`/${locale}/search`}
        active={pathname.includes('/search')}
      />
      <MobileNavItem
        icon={<Library className="w-5 h-5" />}
        label={t('navBinder')}
        href={`/${locale}/binder`}
        active={pathname.includes('/binder')}
      />
      <MobileNavItem
        icon={<User className="w-5 h-5" />}
        label={t('navProfile')}
        href={`/${locale}/profile`}
        active={pathname.includes('/profile')}
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
      className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
