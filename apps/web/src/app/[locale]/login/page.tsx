'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Navbar } from '@/src/components/Navbar';

export default function LoginPage() {
  const { t } = useTranslation(['common']);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const registered = searchParams?.get('registered');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push(`/${locale}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`${t('common:error_occurred')} ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-transparent">
      <Navbar minimal />
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-200/50 dark:border-slate-800/50">
          <div>
            <h2 className="mt-6 text-center text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('signIn')}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Welcome back to your collection
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {registered && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
                <div className="text-sm text-green-600 dark:text-green-400 font-bold text-center">
                  {t('registrationSuccess')}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => signIn('discord', { callbackUrl: `/${locale}` })}
                className="flex items-center justify-center gap-2 rounded-2xl bg-[#5865F2] px-4 py-3 text-xs font-black text-white shadow-lg shadow-blue-500/20 hover:bg-[#4752C4] hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993.023.03.063.037.085.028a19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </button>
              <button
                onClick={() => signIn('google', { callbackUrl: `/${locale}` })}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-800 px-4 py-3 text-xs font-black text-slate-900 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs font-black uppercase tracking-widest leading-6">
                <span className="bg-white dark:bg-[#0f172a] px-4 text-slate-400">
                  Or use credentials
                </span>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                  <div className="text-sm text-red-600 dark:text-red-400 font-bold text-center">
                    {error}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                    placeholder={t('email')}
                  />
                </div>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                    placeholder={t('password')}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                >
                  {loading ? 'Signing in...' : t('signIn')}
                </button>
              </div>

              <div className="text-center">
                <Link
                  href={`/${locale}/register`}
                  className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
                >
                  {t('dontHaveAccount')} {t('signUp')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
