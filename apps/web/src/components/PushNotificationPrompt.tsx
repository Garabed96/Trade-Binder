'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';

/**
 * Component that prompts users to enable push notifications
 * Shows only once per session on first login
 */
export function PushNotificationPrompt() {
  const { permission, requestPermission } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(false);

  // Compute visibility based on permission and sessionStorage
  const isVisible =
    permission === 'default' &&
    !isDismissed &&
    (typeof window === 'undefined' ||
      !sessionStorage.getItem('pushPromptDismissed'));

  const handleEnable = async () => {
    await requestPermission();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pushPromptDismissed', 'true');
    }
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pushPromptDismissed', 'true');
    }
    setIsDismissed(true);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div
      data-testid="push-notification-prompt"
      className="fixed right-4 bottom-4 z-50 w-full max-w-sm rounded-2xl border border-blue-500/20 bg-white p-6 shadow-2xl dark:border-blue-400/20 dark:bg-slate-800"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
          <Bell className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-black text-slate-900 dark:text-white">
            Enable Notifications
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Stay updated on new messages
          </p>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Get instant notifications when you receive new messages from buyers and
        sellers.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Not now
        </button>
        <button
          onClick={handleEnable}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition-all hover:bg-blue-500"
        >
          Enable
        </button>
      </div>
    </div>
  );
}
