'use client';

import { signIn, useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import BinderPageContent from '@/src/components/BinderPageContent';
// import { BinderView } from '@/src/components/BinderView';

export default function BinderPage() {
  const { t } = useTranslation();
  // Check if user is logged in before displaying this binder page...
  const { status } = useSession();
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        {t('page.binder.checkingMultiverse')}
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          {t('page.binder.accessRestricted')}
        </h1>
        <p className="max-w-sm text-slate-400">{t('page.binder.mustSignIn')}</p>
        <button
          onClick={() => signIn()}
          className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold"
        >
          {t('signIn')}
        </button>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <BinderPageContent />;
  }
}
