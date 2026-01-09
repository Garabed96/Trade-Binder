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

  const isRegistered = session?.user?.registration_complete;

  if (!session || isRegistered) return null;

  return (
    <div className="bg-amber-500 py-2 text-white">
      <div className="container-default flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-bold">
            {t(
              'registrationIncomplete',
              'Please complete your profile to start trading and adding to binder!'
            )}
          </p>
        </div>
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black tracking-widest text-amber-600 uppercase transition-colors hover:bg-amber-50"
        >
          {t('completeProfile', 'Complete Profile')}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
