'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function LoginButton() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  if (session) {
    return (
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || ''}
            className="w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700"
          />
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none">
            Signed in as
          </span>
          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
            {session.user?.name || session.user?.email}
          </span>
        </div>
        <button
          onClick={() => signOut()}
          className="ml-2 text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <Link
      href={`/${locale}/login`}
      className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-md active:scale-95 inline-block text-center"
    >
      Sign in
    </Link>
  );
}
