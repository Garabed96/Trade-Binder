'use client';

import { useMessageToast } from '@/src/hooks/useMessageToast';

/**
 * Component that enables message toast notifications
 * Must be rendered inside tRPC and Session providers
 */
export function MessageToastProvider() {
  useMessageToast();
  return null;
}
