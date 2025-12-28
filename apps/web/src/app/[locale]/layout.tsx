// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '../providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MTG Collection',
  description: 'Magic: The Gathering Collection Manager',
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>; // Changed: params is now a Promise
}) {
  // Await the params
  const { locale } = await params;
  const validLocale = locale || 'en';

  return (
    <html lang={validLocale}>
      <body className={inter.className}>
        <Providers locale={validLocale}>{children}</Providers>
      </body>
    </html>
  );
}
