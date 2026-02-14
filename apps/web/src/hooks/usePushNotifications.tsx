import { useState, useEffect, useCallback } from 'react';

type PermissionStatus = 'default' | 'granted' | 'denied';

/**
 * Hook to manage browser push notification permissions
 */
export function usePushNotifications() {
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });

  const [permission, setPermission] = useState<PermissionStatus>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as PermissionStatus;
    }
    return 'default';
  });

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      console.log('Requesting notification permission');
      const result = await Notification.requestPermission();
      setPermission(result as PermissionStatus);
      return result === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== 'granted') {
        console.warn(
          'Cannot show notification: permission not granted or not supported'
        );
        return;
      }

      try {
        new Notification(title, options);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    },
    [isSupported, permission]
  );

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification,
  };
}
