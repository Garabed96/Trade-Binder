'use client';

import { trpc } from '@/src/utils/trpc';
import { formatDistanceToNow } from 'date-fns';
import { Check, X } from 'lucide-react';
import { Button } from '@trade-binder/ui';
import Link from 'next/link';

interface Props {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: Props) {
  const utils = trpc.useUtils();

  const { data: notifications = [] } = trpc.notification.getAll.useQuery({
    limit: 20,
    unreadOnly: false,
  });

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  const deleteMutation = trpc.notification.delete.useMutation({
    onSuccess: () => {
      utils.notification.invalidate();
    },
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Dropdown */}
      <div
        className="absolute top-12 right-0 z-50 w-96 rounded-lg border bg-white shadow-lg dark:bg-gray-800"
        data-testid="notification-dropdown"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="mr-1 h-4 w-4" />
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className={`border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        onClick={() => {
                          if (!notification.read) {
                            markAsReadMutation.mutate({ id: notification.id });
                          }
                          onClose();
                        }}
                      >
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <h4 className="font-semibold">{notification.title}</h4>
                        <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteMutation.mutate({ id: notification.id })
                    }
                    disabled={deleteMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
