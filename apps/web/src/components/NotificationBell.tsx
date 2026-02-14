'use client';

import { Bell } from 'lucide-react';
import { Button } from '@trade-binder/ui';
import { trpc } from '@/src/utils/trpc';
import { NotificationDropdown } from './NotificationDropdown';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const { data: unreadCount = 0 } = trpc.notification.getUnreadCount.useQuery(
    undefined,
    {
      enabled: !!session,
      refetchInterval: 30000, // Poll every 30 seconds
    }
  );

  if (!session) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
        data-testid="notification-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && <NotificationDropdown onClose={() => setOpen(false)} />}
    </div>
  );
}
