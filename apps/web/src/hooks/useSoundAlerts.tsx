import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage sound alert preferences
 * Uses localStorage to persist user preference
 */
export function useSoundAlerts() {
  // Use lazy initialization to load from localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('soundAlertsEnabled');
    return stored !== null ? stored === 'true' : true;
  });

  // Update localStorage when preference changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundAlertsEnabled', String(soundEnabled));
    }
  }, [soundEnabled]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;

    console.log('🔊 Playing notification sound');

    // Create and play audio element
    // Using a simple notification beep (data URI for a short beep sound)
    const audio = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHG7A7+OZSA0PVqzn7q1aEgxDm+Hxwmwf'
    );
    audio.volume = 0.5;
    audio.play().catch(err => {
      console.error('Failed to play notification sound:', err);
    });
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    soundEnabled,
    toggleSound,
    playNotificationSound,
  };
}
