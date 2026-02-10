'use client';

import { useState } from 'react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { SendInquiryModal } from '@/src/components/SendInquiryModal';
import { ListingBadge } from '@/src/components/ListingBadge';
import { Library, ShoppingCart, Search, Package, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getCountryName } from '@/src/utils/countries';

interface MarketplaceListing {
  id: string;
  price: number;
  created_at: string;
  card_id: string;
  card_name: string;
  card_image: string | null;
  set_name: string;
  set_code: string;
  rarity: string;
  condition: string | null;
  is_foil: boolean;
  seller_username: string;
  seller_country_code: string | null;
  seller_location_name: string | null;
}

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);

  const { data, isLoading } = trpc.listing.search.useQuery({
    query: searchQuery || undefined,
    page,
    limit: 40,
  });

  const handleListingClick = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
  };

  const handleInquirySuccess = () => {
    alert('Inquiry sent! The seller will be notified.');
  };

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
            Buy, sell, and trade Magic: The Gathering cards with collectors
            worldwide. Organize your collection in digital binders and discover
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
              collectors worldwide.
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
              you&apos;re looking for.
            </p>
          </div>
        </div>
      </section>

      {/* For Sale Section */}
      <section className="container-default py-12">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Cards For Sale
            </h2>
          </div>
          {data && data.totalCount > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {data.totalCount} card{data.totalCount !== 1 ? 's' : ''} available
              from sellers
            </p>
          )}
        </div>

        {/* Search bar */}
        <div className="mx-auto mb-6 max-w-xl">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cards for sale..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-4 pl-12 text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && data && data.listings.length === 0 && (
          <div className="rounded-2xl border border-white/40 bg-white/10 p-12 text-center backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-slate-500/20 p-6">
                <Package className="h-16 w-16 text-slate-500 dark:text-slate-400" />
              </div>
            </div>
            <h3 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
              No listings found
            </h3>
            <p className="mx-auto max-w-md text-slate-600 dark:text-slate-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Be the first to list a card!'}
            </p>
          </div>
        )}

        {/* Listings grid */}
        {!isLoading && data && data.listings.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {data.listings.map(listing => (
                <div
                  key={listing.id}
                  onClick={() => handleListingClick(listing)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40"
                >
                  {/* Card image */}
                  <div className="relative aspect-[2.5/3.5] overflow-hidden bg-slate-100/50 dark:bg-slate-950">
                    {listing.card_image ? (
                      <Image
                        fill
                        src={listing.card_image}
                        alt={listing.card_name}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center text-xs font-bold text-slate-400">
                        {listing.card_name}
                      </div>
                    )}
                    <ListingBadge price={listing.price} />
                  </div>

                  {/* Card details */}
                  <div className="flex flex-1 flex-col space-y-3 bg-gradient-to-b from-white/40 to-white/80 p-4 backdrop-blur-md dark:bg-slate-900/50 dark:from-transparent dark:to-transparent">
                    <div className="space-y-1">
                      <h3
                        className="truncate text-sm font-bold text-slate-900 dark:text-white"
                        title={listing.card_name}
                      >
                        {listing.card_name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-black text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-500">
                          {listing.set_code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 dark:border-slate-800/50">
                      <span className="text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
                        ${listing.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Location - Prominent Display */}
                    {(listing.seller_country_code ||
                      listing.seller_location_name) && (
                      <div className="rounded-lg border border-blue-200/50 bg-blue-50/50 px-3 py-2 dark:border-blue-900/30 dark:bg-blue-950/30">
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 text-[10px] font-bold tracking-wide text-blue-600 uppercase dark:text-blue-400">
                              Ships From
                            </div>
                            {listing.seller_location_name && (
                              <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {listing.seller_location_name}
                              </div>
                            )}
                            {listing.seller_country_code && (
                              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                {getCountryName(listing.seller_country_code)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seller info */}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <div>
                        Seller:{' '}
                        <span className="font-bold">
                          {listing.seller_username}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  disabled={page === data.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-bold transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Send Inquiry Modal */}
      {selectedListing && (
        <SendInquiryModal
          isOpen={!!selectedListing}
          onClose={() => setSelectedListing(null)}
          listingId={selectedListing.id}
          cardName={selectedListing.card_name}
          cardImage={selectedListing.card_image}
          price={selectedListing.price}
          sellerUsername={selectedListing.seller_username}
          onSuccess={handleInquirySuccess}
        />
      )}
    </div>
  );
}
