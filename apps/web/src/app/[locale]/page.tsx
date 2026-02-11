'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/src/utils/trpc';
import {
  Library,
  ShoppingCart,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  ArrowRight,
  Zap,
  MapPin,
} from 'lucide-react';
import { getCountryName } from '@/src/utils/countries';

export default function HomePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const carouselRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Fetch latest set for hero background
  const { data: latestSet } = trpc.card.getLatestSetWithHero.useQuery();

  // Fetch featured cards (rare/mythic only)
  const { data: featuredCards, isLoading: loadingFeatured } =
    trpc.card.getFeaturedCards.useQuery({ limit: 12 });

  // Fetch public sellers
  const { data: sellers, isLoading: loadingSellers } =
    trpc.binder.getPublicSellers.useQuery({ limit: 8 });

  // Fetch marketplace listings
  const { data: listings, isLoading: loadingListings } =
    trpc.listing.search.useQuery({ limit: 12 });

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section - Full Width with Set Background */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {latestSet?.hero_image ? (
            <Image
              src={latestSet.hero_image}
              alt={latestSet.name}
              fill
              className="object-cover object-top opacity-20 blur-sm dark:opacity-15"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white dark:via-slate-950/90 dark:to-slate-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50 dark:from-slate-950/50 dark:to-slate-950/50" />
        </div>

        <div className="container-default relative z-10 py-16 md:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
            {/* Left: Text Content */}
            <div className="text-center md:text-left">
              {/* Latest Set Badge */}
              {latestSet && (
                <Link
                  href={`/${locale}/search?set_code=${latestSet.code}`}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-700 transition-all hover:border-amber-500/50 hover:bg-amber-500/20 dark:text-amber-400"
                >
                  <Zap className="h-4 w-4" />
                  <span>
                    {t('page.home.newSet', { setName: latestSet.name })}
                  </span>
                  <span className="text-amber-600/60 dark:text-amber-500/60">
                    {t('cardsCount', { count: latestSet.card_count })}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <h1 className="mb-6 text-5xl leading-tight font-black tracking-tight text-slate-900 md:text-6xl lg:text-7xl dark:text-white">
                {t('page.home.yourCards')}
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 bg-clip-text text-transparent">
                  {t('page.home.yourMarket')}
                </span>
              </h1>

              <p className="mb-8 max-w-lg text-lg text-slate-600 md:text-xl dark:text-slate-400">
                {t('page.home.heroDescription')}
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row md:justify-start">
                <Link
                  href={`/${locale}/search`}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-95"
                >
                  {t('page.marketplace.browseCards')}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href={`/${locale}/binder`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-300 bg-white/80 px-8 py-4 text-lg font-bold text-slate-900 backdrop-blur-sm transition-all hover:border-slate-400 hover:bg-white active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  <Library className="h-5 w-5" />
                  {t('page.home.myBinder')}
                </Link>
              </div>
            </div>

            {/* Right: Featured Card Preview */}
            {latestSet?.hero_image && (
              <div className="hidden md:block">
                <div className="relative mx-auto w-72 lg:w-80">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-amber-500/20 blur-2xl" />
                  {/* Card */}
                  <div className="relative aspect-[2.5/3.5] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/20">
                    <Image
                      src={latestSet.hero_image}
                      alt={latestSet.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Set label */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold whitespace-nowrap text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    {latestSet.name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Cards - Compact Row */}
      <section className="container-default py-12">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800">
            <div className="flex-shrink-0 rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                {t('page.home.featureBuySell')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('page.home.featureBuySellDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-800">
            <div className="flex-shrink-0 rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <Library className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                {t('page.home.featureDigitalBinders')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('page.home.featureDigitalBindersDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-amber-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-800">
            <div className="flex-shrink-0 rounded-lg bg-amber-100 p-3 dark:bg-amber-900/30">
              <Search className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                {t('page.home.featureAdvancedSearch')}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('page.home.featureAdvancedSearchDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cards Carousel */}
      <section className="container-default py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('page.home.featuredCards')}
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              className="rounded-lg border border-slate-300 bg-white/50 p-2 text-slate-700 backdrop-blur-md transition-all hover:bg-white/70 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="rounded-lg border border-slate-300 bg-white/50 p-2 text-slate-700 backdrop-blur-md transition-all hover:bg-white/70 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loadingFeatured && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loadingFeatured && featuredCards && featuredCards.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/50 p-12 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              {t('page.home.noFeaturedCards')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('page.home.noFeaturedCardsDesc')}
            </p>
          </div>
        )}

        {!loadingFeatured && featuredCards && featuredCards.length > 0 && (
          <div
            ref={carouselRef}
            className="scrollbar-hide flex gap-4 overflow-x-auto pb-4"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {featuredCards.map(card => (
              <div
                key={card.user_card_id}
                className="group w-48 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Link href={`/${locale}/cards/design/${card.oracle_id}`}>
                  <div className="relative aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800">
                    {card.image_uri_normal ? (
                      <Image
                        src={card.image_uri_normal}
                        alt={card.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        {t('noImage')}
                      </div>
                    )}

                    {/* Rarity badge */}
                    <div
                      className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-black text-white uppercase ${
                        card.rarity === 'mythic'
                          ? 'bg-orange-500'
                          : 'bg-yellow-500'
                      }`}
                    >
                      {card.rarity}
                    </div>

                    {/* For Sale badge */}
                    {card.listing_id && (
                      <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-1 text-[10px] font-black text-white uppercase shadow-lg">
                        ${card.listing_price?.toFixed(0) || '?'}
                      </div>
                    )}

                    {/* Foil badge */}
                    {card.is_foil && (
                      <div className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                        {t('foil')}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <p
                    className="truncate text-sm font-bold text-slate-900 dark:text-white"
                    title={card.name}
                  >
                    {card.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-600 uppercase dark:text-amber-400">
                      {card.set_code}
                    </span>
                    <span className="text-xs text-slate-500">
                      {card.listing_price
                        ? `$${card.listing_price.toFixed(2)}`
                        : `~$${card.market_price?.toFixed(2) || '—'}`}
                    </span>
                  </div>
                  <Link
                    href={`/${locale}/binder/${card.owner_username}`}
                    className="mt-1 block text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    @{card.owner_username}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cards For Sale Section */}
      <section className="container-default py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('page.home.featuredCards')}
            </h2>
          </div>
          <Link
            href={`/${locale}/marketplace`}
            className="text-sm font-bold text-blue-600 hover:underline dark:text-blue-400"
          >
            {t('page.home.viewAll')}
            <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        {loadingListings && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loadingListings && listings && listings.listings.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/50 p-12 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              {t('page.home.noListingsYet')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('page.home.noListingsYetDesc')}
            </p>
          </div>
        )}

        {!loadingListings && listings && listings.listings.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {listings.listings.map(listing => (
              <div key={listing.id} className="flex flex-col gap-2">
                <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700">
                  <Link href={`/${locale}/cards/design/${listing.card_id}`}>
                    <div className="relative aspect-[2.5/3.5] bg-slate-100 dark:bg-slate-800">
                      {listing.card_image ? (
                        <Image
                          src={listing.card_image}
                          alt={listing.card_name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-500">
                          {t('noImage')}
                        </div>
                      )}

                      {/* Price badge */}
                      <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-1 text-xs font-black text-white shadow-lg">
                        ${listing.price.toFixed(2)}
                      </div>

                      {/* Foil badge */}
                      {listing.is_foil && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                          {t('foil')}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    <p
                      className="truncate text-sm font-bold text-slate-900 dark:text-white"
                      title={listing.card_name}
                    >
                      {listing.card_name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-600 uppercase dark:text-amber-400">
                        {listing.set_code}
                      </span>
                      <span className="text-xs text-slate-500">
                        {listing.condition || 'NM'}
                      </span>
                    </div>
                    <Link
                      href={`/${locale}/binder/${listing.seller_username}`}
                      className="mt-1 block text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      @{listing.seller_username}
                    </Link>
                  </div>
                </div>

                {/* Location Display - Outside Card */}
                {(listing.seller_country_code ||
                  listing.seller_location_name) && (
                  <div className="rounded-lg border border-blue-200/60 bg-gradient-to-br from-blue-50 to-blue-100/50 px-3 py-2 shadow-sm dark:border-blue-900/40 dark:bg-gradient-to-br dark:from-blue-950/50 dark:to-blue-900/30">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0 flex-1">
                        {listing.seller_location_name && (
                          <div className="truncate text-xs leading-tight font-bold text-slate-900 dark:text-white">
                            {listing.seller_location_name}
                          </div>
                        )}
                        {listing.seller_country_code && (
                          <div className="truncate text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                            {getCountryName(listing.seller_country_code)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Browse Sellers Section */}
      <section className="container-default py-12">
        <div className="mb-6 flex items-center gap-3">
          <Users className="h-6 w-6 text-purple-500" />
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('page.home.browseCollections')}
          </h2>
        </div>

        {loadingSellers && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loadingSellers && sellers && sellers.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/50 p-12 text-center backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/50">
            <Users className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              {t('page.home.noPublicCollections')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('page.home.noPublicCollectionsDesc')}
            </p>
          </div>
        )}

        {!loadingSellers && sellers && sellers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sellers.map(seller => (
              <Link
                key={seller.user_id}
                href={`/${locale}/binder/${seller.username}`}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white/50 backdrop-blur-md transition-all hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700"
              >
                {/* Preview images grid */}
                <div className="grid aspect-[2/1] grid-cols-4 gap-0.5 bg-slate-200 dark:bg-slate-700">
                  {seller.preview_images.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className="relative bg-slate-100 dark:bg-slate-800"
                    >
                      {img ? (
                        <Image src={img} alt="" fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </div>
                  ))}
                  {/* Fill empty slots */}
                  {Array.from({
                    length: Math.max(0, 4 - seller.preview_images.length),
                  }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="bg-slate-200 dark:bg-slate-700"
                    />
                  ))}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        @{seller.username}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {seller.binder_name}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t('cardsCount', { count: seller.card_count })}
                    </span>
                    {seller.total_value && (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {t('page.home.approxValue', {
                          value: Number(seller.total_value).toFixed(0),
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
