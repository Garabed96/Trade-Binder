'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { LogIn, LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoginButton() {
  const { data: session } = useSession();
  const { t } = useTranslation(['common']);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  if (session) {
    return (
      <div className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-1.5 pr-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm group/user">
        <div className="relative">
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name || ''}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 object-cover shadow-sm group-hover/user:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <User className="w-5 h-5" />
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            {t('signedInAs')}
          </span>
          <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[100px] mt-0.5">
            {session.user?.name || session.user?.email}
          </span>
        </div>

        <button
          onClick={() => signOut()}
          className="ml-1 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all active:scale-90 group/out"
          title={t('signOut')}
        >
          <LogOut className="w-4 h-4 group-hover/out:translate-x-0.5 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href={`/${locale}/login`}
      className="group relative flex items-center gap-2 bg-slate-900 dark:bg-white px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] text-white dark:text-slate-900 shadow-lg shadow-slate-900/10 dark:shadow-white/10 hover:-translate-y-0.5 active:scale-95 transition-all overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <LogIn className="w-3.5 h-3.5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
      <span className="relative z-10">{t('signIn')}</span>
    </Link>
  );
}
