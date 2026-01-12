'use client';

import Link from 'next/link';
import { Library, ShoppingCart, Search, Package } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="container-default py-12 md:py-20">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/10 p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:border-white/50 md:p-12 dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:border-slate-700/80">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-4">
              <Library className="h-12 w-12 text-indigo-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Heading with gradient text */}
          <h1 className="mb-4 bg-gradient-to-r from-indigo-700 via-purple-600 to-amber-600 bg-clip-text text-center text-4xl font-black text-transparent md:text-5xl dark:from-amber-300 dark:via-orange-200 dark:to-amber-100">
            Trade Binder
          </h1>

          {/* Description */}
          <p className="mb-6 text-center text-lg text-slate-700 dark:text-slate-300">
            Buy, sell, and trade Magic: The Gathering cards with collectors in
            Thailand. Organize your collection in digital binders and discover
            the cards you need.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/search"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-center font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-blue-500/40 active:scale-95"
            >
              Browse Cards
            </Link>
            <button
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-xl border border-white/40 bg-white/20 px-6 py-3 font-bold text-slate-900 backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 dark:text-white dark:hover:bg-white/10"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="container-default py-12">
        <h2 className="mb-8 text-center text-2xl font-black text-slate-900 dark:text-white">
          Why Trade Binder?
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Feature 1: Buy & Sell */}
          <div className="rounded-2xl border border-white/40 bg-white/10 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-4 w-fit rounded-full bg-blue-500/20 p-3">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Buy & Sell Cards
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              List your cards for sale or browse thousands of listings from
              collectors in Thailand.
            </p>
          </div>

          {/* Feature 2: Digital Binders */}
          <div className="rounded-2xl border border-white/40 bg-white/10 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-purple-500/50 hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-4 w-fit rounded-full bg-purple-500/20 p-3">
              <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Digital Binders
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Organize your collection in customizable binders. Track values,
              rarities, and sets.
            </p>
          </div>

          {/* Feature 3: Advanced Search */}
          <div className="rounded-2xl border border-white/40 bg-white/10 p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-4 w-fit rounded-full bg-amber-500/20 p-3">
              <Search className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              Advanced Search
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Filter by color, rarity, set, and price. Find exactly the cards
              you are looking for.
            </p>
          </div>
        </div>
      </section>

      {/* Listings Preview (Coming Soon Placeholder) */}
      <section className="container-default py-12">
        <h2 className="mb-8 text-center text-2xl font-black text-slate-900 dark:text-white">
          Marketplace Listings
        </h2>

        {/* Empty State */}
        <div className="rounded-2xl border border-white/40 bg-white/10 p-12 text-center shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-slate-500/20 p-6">
              <Package className="h-16 w-16 text-slate-500 dark:text-slate-400" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
            Listings Coming Soon
          </h3>
          <p className="mx-auto max-w-md text-slate-600 dark:text-slate-400">
            The marketplace is launching soon! Check back to browse and list
            your cards.
          </p>
        </div>
      </section>
    </div>
  );
}
