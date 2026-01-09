'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@trade-binder/ui';
import { trpc } from '@/src/utils/trpc';
import { useSession } from 'next-auth/react';
import {
  MapPin,
  User,
  FileText,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Tag,
  ShoppingCart,
  DollarSign,
  Users,
} from 'lucide-react';

type MarketStatCard = {
  cardName: string;
  price: number;
  currency?: string | null;
};

type NearbyTrader = {
  id: string;
  username: string;
  distanceKm: number;
};

type MarketStats = {
  firstSaleDate: string | null;
  mostValuableCardSold: MarketStatCard | null;
  mostValuableCardBought: MarketStatCard | null;
  currentBinderValue: number | null;
  nearbyTraders: {
    radiusKm: number;
    count: number;
    traders?: NearbyTrader[] | null;
  } | null;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatCurrency(amount: number, currency?: string | null) {
  const c = currency ?? 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: c,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${c}`;
  }
}

export default function ProfilePage() {
  const { t } = useTranslation(['common']);
  const { data: session, update: updateSession } = useSession();
  const {
    data: user,
    isLoading,
    refetch,
  } = trpc.user.me.useQuery(undefined, {
    enabled: !!session,
  });
  const updateProfile = trpc.user.updateProfile.useMutation();

  const marketStatsQuery = trpc.user.getMarketStats.useQuery(undefined, {
    enabled: !!session,
  });

  const marketStats = marketStatsQuery.data as MarketStats | undefined;
  const [showNearbyTraders, setShowNearbyTraders] = useState(false);

  // Track which fields have been edited by the user
  const [editedFields, setEditedFields] = useState<{
    username?: string;
    bio?: string;
    locationName?: string;
    coords?: { lat: number | null; lng: number | null };
  }>({});
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Use edited values if available, otherwise fall back to user data
  const username = editedFields.username ?? user?.username ?? '';
  const bio = editedFields.bio ?? user?.bio ?? '';
  const locationName = editedFields.locationName ?? user?.location_name ?? '';
  const coords = editedFields.coords ?? {
    lat: user?.latitude ?? null,
    lng: user?.longitude ?? null,
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        setEditedFields(prev => ({
          ...prev,
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }));
        setMessage({ type: 'success', text: 'Location captured!' });
      },
      () => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location' });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await updateProfile.mutateAsync({
        username,
        bio,
        location_name: locationName,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Clear edited fields since they're now saved
      setEditedFields({});
      await refetch();
      await updateSession();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-4 text-2xl font-black">Please Sign In</h1>
        <p className="mb-8 text-slate-500">
          You need to be logged in to view and edit your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="container-narrow py-4 sm:py-8">
      {/* ... existing JSX for header ... */}
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          <User className="h-10 w-10 text-blue-600" />
          {t('profileTitle', 'Your Profile')}
        </h1>
        <p className="mt-2 font-medium text-slate-500 dark:text-slate-400">
          {t(
            'profileSubtitle',
            'Complete your profile to start trading and building your reputation.'
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ... existing message display ... */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-2xl border p-4 ${
              message.type === 'success'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <p className="text-sm font-bold">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-400 uppercase">
                <User className="h-4 w-4" />
                {t('username', 'Username')}
              </label>
              <Input
                type="text"
                value={username}
                onChange={e =>
                  setEditedFields(prev => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
                required
              />
            </section>

            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-400 uppercase">
                <FileText className="h-4 w-4" />
                {t('bio', 'Bio')}
              </label>
              <textarea
                value={bio}
                onChange={e =>
                  setEditedFields(prev => ({ ...prev, bio: e.target.value }))
                }
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white"
                placeholder={t(
                  'bioPlaceholder',
                  'Tell us about your collection...'
                )}
              />
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black tracking-widest text-slate-400 uppercase">
                <MapPin className="h-4 w-4" />
                {t('location', 'Location')}
              </label>
              <Input
                type="text"
                value={locationName}
                onChange={e =>
                  setEditedFields(prev => ({
                    ...prev,
                    locationName: e.target.value,
                  }))
                }
                placeholder={t('locationPlaceholder', 'City, Country')}
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              >
                <MapPin className="h-4 w-4" />
                {coords.lat
                  ? t('updateLocation', 'Update Location')
                  : t('getLocation', 'Get Precise Location')}
              </button>
              {coords.lat && (
                <p className="text-center font-mono text-[10px] text-slate-400">
                  Coords: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
                </p>
              )}
            </section>

            <div className="pt-4">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-5 text-sm font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500 active:scale-95 disabled:opacity-50"
              >
                {updateProfile.isPending
                  ? t('saving', 'Saving...')
                  : t('saveProfile', 'Save & Complete Registration')}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Market Achievements */}
      <section className="mt-10 space-y-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-blue-600" />
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {t('marketAchievementsTitle', 'Market Achievements')}
            </h2>
            <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
              {t(
                'marketAchievementsSubtitle',
                'Your trading stats, value, and local activity.'
              )}
            </p>
          </div>
        </div>

        {marketStatsQuery.isLoading ? (
          <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : !marketStats ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
            <p className="font-medium text-slate-500 dark:text-slate-400">
              {t(
                'marketAchievementsEmpty',
                'No market stats yet. Complete a few trades to start building achievements.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                  {t('firstSaleDate', 'First Sale Date')}
                </p>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {marketStats.firstSaleDate
                  ? formatDate(marketStats.firstSaleDate)
                  : t('notAvailable', '—')}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center gap-3">
                <Tag className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                  {t('mostValuableSold', 'Most Valuable Sold')}
                </p>
              </div>
              <p className="text-lg leading-snug font-black text-slate-900 dark:text-white">
                {marketStats.mostValuableCardSold?.cardName ??
                  t('notAvailable', '—')}
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {marketStats.mostValuableCardSold
                  ? formatCurrency(
                      marketStats.mostValuableCardSold.price,
                      marketStats.mostValuableCardSold.currency
                    )
                  : t('notAvailable', '—')}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                  {t('mostValuableBought', 'Most Valuable Bought')}
                </p>
              </div>
              <p className="text-lg leading-snug font-black text-slate-900 dark:text-white">
                {marketStats.mostValuableCardBought?.cardName ??
                  t('notAvailable', '—')}
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                {marketStats.mostValuableCardBought
                  ? formatCurrency(
                      marketStats.mostValuableCardBought.price,
                      marketStats.mostValuableCardBought.currency
                    )
                  : t('notAvailable', '—')}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="mb-4 flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                  {t('currentBinderValue', 'Current Binder Value')}
                </p>
              </div>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {typeof marketStats.currentBinderValue === 'number'
                  ? formatCurrency(marketStats.currentBinderValue, 'USD')
                  : t('notAvailable', '—')}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {t(
                  'binderValueHint',
                  'Estimated market value of all cards in your binder.'
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:col-span-2 xl:col-span-2 dark:border-slate-700/50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between gap-6">
                <div className="min-w-0">
                  <div className="mb-4 flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                      {t('nearbyTraders', 'Nearby Traders')}
                    </p>
                  </div>

                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {marketStats.nearbyTraders?.count ?? 0}
                    <span className="ml-2 text-sm font-black tracking-widest text-slate-400 uppercase">
                      {marketStats.nearbyTraders
                        ? t('withinKm', 'within {{km}}km', {
                            km: marketStats.nearbyTraders.radiusKm,
                          })
                        : t('withinKmFallback', 'near you')}
                    </span>
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowNearbyTraders(v => !v)}
                    disabled={!marketStats.nearbyTraders?.traders?.length}
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black tracking-widest text-slate-900 uppercase transition-all hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:disabled:hover:bg-slate-800"
                  >
                    {showNearbyTraders
                      ? t('hideDetails', 'Hide Details')
                      : t('viewDetails', 'View Details')}
                  </button>
                </div>
              </div>

              {showNearbyTraders && (
                <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-700/50">
                  {marketStats.nearbyTraders?.traders?.length ? (
                    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {marketStats.nearbyTraders.traders.map(trader => (
                        <li
                          key={trader.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-3 dark:border-slate-700/40 dark:bg-slate-900/30"
                        >
                          <p className="truncate font-black text-slate-900 dark:text-white">
                            {trader.username}
                          </p>
                          <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
                            {trader.distanceKm.toFixed(1)}km
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-medium text-slate-500 dark:text-slate-400">
                      {t(
                        'nearbyTradersEmpty',
                        'No nearby traders to display yet. Add your precise location to improve results.'
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

// ... rest of component (AlertCircle function) stays the same ...

function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
