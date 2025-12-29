'use client';

import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useParams } from 'next/navigation';

export function RegistrationBanner() {
  const { data: session } = useSession();
  const { t } = useTranslation(['common']);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const isRegistered = session?.user?.registration_complete;

  if (!session || isRegistered) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">
            {t(
              'registrationIncomplete',
              'Please complete your profile to start trading and adding to binder!',
            )}
          </p>
        </div>
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-1 text-xs font-black uppercase tracking-widest bg-white text-amber-600 px-3 py-1 rounded-full hover:bg-amber-50 transition-colors"
        >
          {t('completeProfile', 'Complete Profile')}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
