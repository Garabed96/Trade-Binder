// src/app/[locale]/layout.tsx
import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import "../globals.css";
import Providers from "../providers";
import { Navbar } from "@/src/components/Navbar";
import { MobileNav } from "@/src/components/MobileNav";
import { RegistrationBanner } from "@/src/components/RegistrationBanner";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-cinzel", // This creates a CSS variable we can use in Tailwind
});

export const metadata: Metadata = {
  title: "My Trade Binder",
  description: "Magic: The Gathering Collection Manager",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
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
  const validLocale = locale || "en";

  return (
    <html lang={validLocale} suppressHydrationWarning>
      <body className={cinzel.className}>
        <Providers locale={validLocale}>
          <RegistrationBanner />
          <Navbar />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
