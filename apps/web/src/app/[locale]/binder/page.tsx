'use client';

import { signIn, useSession } from 'next-auth/react';
import BinderPageContent from '@/src/components/BinderPageContent';
// import { BinderView } from '@/src/components/BinderView';

export default function BinderPage() {
  // Check if user is logged in before displaying this binder page...
  const { data: session, status } = useSession();
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-300">
        Checking the multiverse...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-slate-400 max-w-sm">
          You must be signed in to access your binders and manage your collection.
        </p>
        <button
          onClick={() => signIn()}
          className="rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (status === 'authenticated') {
    return <BinderPageContent />;
  }
}
