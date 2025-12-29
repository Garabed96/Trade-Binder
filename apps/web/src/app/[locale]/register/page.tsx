'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { trpc } from '@/src/utils/trpc';
import { Navbar } from '@/src/components/Navbar';

export default function RegisterPage() {
  const { t } = useTranslation(['common']);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const createUser = trpc.user.create.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createUser.mutateAsync({ username, email, password });
      router.push(`/${locale}/login?registered=true`);
    } catch (err: unknown) {
      // Narrowing the type to access .message safely
      const errorMessage =
        err instanceof Error ? err.message : 'An error occurred. Please try again.';
      setError(errorMessage);
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
              {t('createAccount')}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Join the community of collectors
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-sm"
                  placeholder={t('username')}
                />
              </div>
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
                  autoComplete="new-password"
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
                {loading ? 'Registering...' : t('signUp')}
              </button>
            </div>

            <div className="text-center">
              <Link
                href={`/${locale}/login`}
                className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors"
              >
                {t('alreadyHaveAccount')} {t('signIn')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
