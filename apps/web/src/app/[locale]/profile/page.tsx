'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '@/src/utils/trpc';
import { useSession } from 'next-auth/react';
import { MapPin, User, FileText, CheckCircle2 } from 'lucide-react';

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

  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [locationName, setLocationName] = useState('');
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: null,
    lng: null,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setBio(user.bio || '');
      setLocationName(user.location_name || '');
      setCoords({ lat: user.latitude, lng: user.longitude });
    }
  }, [user]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setMessage({ type: 'success', text: 'Location captured!' });
      },
      () => {
        setMessage({ type: 'error', text: 'Unable to retrieve your location' });
      },
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
      await refetch();
      await updateSession(); // Refresh session to update registration_complete status
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update profile',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <h1 className="text-2xl font-black mb-4">Please Sign In</h1>
        <p className="text-slate-500 mb-8">
          You need to be logged in to view and edit your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <User className="w-10 h-10 text-blue-600" />
          {t('profileTitle', 'Your Profile')}
        </h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
          {t(
            'profileSubtitle',
            'Complete your profile to start trading and building your reputation.',
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {message && (
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <p className="font-bold text-sm">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                <User className="w-4 h-4" />
                {t('username', 'Username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                required
              />
            </section>

            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                <FileText className="w-4 h-4" />
                {t('bio', 'Bio')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-5 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
                placeholder={t('bioPlaceholder', 'Tell us about your collection...')}
              />
            </section>
          </div>

          <div className="space-y-6">
            <section className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                <MapPin className="w-4 h-4" />
                {t('location', 'Location')}
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t('locationPlaceholder', 'City, Country')}
                className="w-full px-5 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
              />
              <button
                type="button"
                onClick={handleGetLocation}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
              >
                <MapPin className="w-4 h-4" />
                {coords.lat
                  ? t('updateLocation', 'Update Location')
                  : t('getLocation', 'Get Precise Location')}
              </button>
              {coords.lat && (
                <p className="text-[10px] text-slate-400 font-mono text-center">
                  Coords: {coords.lat.toFixed(4)}, {coords.lng?.toFixed(4)}
                </p>
              )}
            </section>

            <div className="pt-4">
              <button
                type="submit"
                disabled={updateProfile.isLoading}
                className="w-full flex items-center justify-center py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                {updateProfile.isLoading
                  ? t('saving', 'Saving...')
                  : t('saveProfile', 'Save & Complete Registration')}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

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
