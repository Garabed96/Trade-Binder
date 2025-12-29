'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import i18n from '@/src/i18n';
import { trpc } from '@/src/utils/trpc';
import { SearchProvider } from '@/src/context/SearchContext';

export default function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    }),
  );

  // Synchronize i18n with the locale prop
  useEffect(() => {
    if (i18n.language !== locale) {
      console.log('Changing language from', i18n.language, 'to', locale);
      i18n.changeLanguage(locale).then(() => {
        console.log('Language changed successfully to:', i18n.language);
      });
    }
  }, [locale]);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
              <SearchProvider>{children}</SearchProvider>
            </I18nextProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ThemeProvider>
    </SessionProvider>
  );
}
