'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LogIn, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import logo from '@/public/my-trade-binder.png';

export function LoginButton() {
  const { data: session } = useSession();
  const { t } = useTranslation(['common']);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  if (session) {
    return (
      <div className="group/user flex items-center gap-3 rounded-2xl border border-slate-200/50 bg-slate-800/50 p-1.5 pr-4 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/50">
        <Link href={`/${locale}/profile`} className="relative h-9 w-9">
          {session.user?.image ? (
            <Image
              fill
              src={session.user.image || logo}
              alt={session.user.name || ''}
              className="rounded-xl border border-slate-200 object-cover shadow-sm transition-transform duration-300 group-hover/user:scale-105 dark:border-slate-700"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800">
              <User className="h-5 w-5" />
            </div>
          )}
          <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
        </Link>

        <Link
          href={`/${locale}/profile`}
          className="flex min-w-0 cursor-pointer flex-col"
        >
          <span className="hidden max-w-[100px] truncate text-[11px] font-bold text-white sm:inline sm:max-w-[150px] dark:text-white">
            {session.user?.name || session.user?.email}
          </span>
        </Link>

        <button
          onClick={() => signOut()}
          className="group/out ml-1 rounded-lg p-2 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:hover:bg-red-500/10"
          title={t('signOut')}
        >
          <LogOut className="h-4 w-4 transition-transform group-hover/out:translate-x-0.5" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/login`}
      className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-r from-purple-400 to-amber-400 px-5 py-2.5 text-[10px] font-black tracking-[0.15em] text-slate-900 uppercase shadow-lg transition-all hover:-translate-y-0.5 hover:text-amber-900 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.8)] active:scale-95"
      suppressHydrationWarning
    >
      <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-500 group-hover:animate-pulse group-hover:opacity-100" />
      <LogIn className="relative z-10 h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-12" />
      <span className="relative z-10">{t('signIn')}</span>
    </Link>
  );
}
