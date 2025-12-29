// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '../providers';
import { Navbar } from '@/src/components/Navbar';
import { MobileNav } from '@/src/components/MobileNav';
import { RegistrationBanner } from '@/src/components/RegistrationBanner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Trade Binder',
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
    <html lang={validLocale} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers locale={validLocale}>
          <RegistrationBanner />
          <Navbar />
          <main className="pb-20 md:pb-0">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
