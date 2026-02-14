import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/src/utils/trpc';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MessageCircle, Check, Volume2, VolumeX } from 'lucide-react';
import { useSoundAlerts } from './useSoundAlerts';

/**
 * Hook that shows toast notifications when new messages arrive
 */
export function useMessageToast() {
  const { data: session } = useSession();
  const previousCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);
  const utils = trpc.useUtils();
  const { soundEnabled, toggleSound, playNotificationSound } = useSoundAlerts();

  // Mark as read mutation
  const markAsReadMutation = trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      // Invalidate conversations to update unread counts
      utils.message.getConversations.invalidate();
    },
  });

  // Get unread message count from all conversations
  const { data: conversations = [] } = trpc.message.getConversations.useQuery(
    { limit: 50 },
    {
      enabled: !!session,
      refetchInterval: 10000, // Check every 10 seconds
    }
  );

  useEffect(() => {
    if (!session || conversations.length === 0) {
      return;
    }

    // Calculate total unread count
    const totalUnread = conversations.reduce(
      (sum, conv) => sum + conv.unread_count,
      0
    );

    // Skip toast on first load
    if (isFirstLoadRef.current) {
      previousCountRef.current = totalUnread;
      isFirstLoadRef.current = false;
      return;
    }

    // Show toast only if unread count increased
    if (totalUnread > previousCountRef.current) {
      const newMessages = totalUnread - previousCountRef.current;

      // Find the conversation(s) with new messages
      const conversationsWithNewMessages = conversations.filter(
        conv => conv.unread_count > 0
      );

      if (conversationsWithNewMessages.length > 0) {
        const firstConv = conversationsWithNewMessages[0];

        // Truncate message preview to 50 characters
        const messagePreview = firstConv.last_message
          ? firstConv.last_message.length > 50
            ? `${firstConv.last_message.substring(0, 50)}...`
            : firstConv.last_message
          : 'New message';

        // Play notification sound
        playNotificationSound();

        toast(
          t => (
            <div
              className="flex items-center gap-3"
              data-testid="message-toast"
            >
              <Link
                href={`/en/messages`}
                onClick={() => toast.dismiss(t.id)}
                className="flex flex-1 items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {newMessages === 1
                      ? 'New message'
                      : `${newMessages} new messages`}
                  </p>
                  <p className="text-sm opacity-70">
                    from {firstConv.other_user_name}
                    {conversationsWithNewMessages.length > 1 &&
                      ` and ${conversationsWithNewMessages.length - 1} other${conversationsWithNewMessages.length > 2 ? 's' : ''}`}
                  </p>
                  {/* Message preview */}
                  <p
                    className="mt-1 text-sm text-gray-600 dark:text-gray-400"
                    data-testid="message-preview"
                  >
                    {messagePreview}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                {/* Mute/Unmute button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleSound();
                  }}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  data-testid="toast-mute-button"
                  title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-gray-600" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-600" />
                  )}
                </button>

                {/* Mark as Read button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    markAsReadMutation.mutate({
                      conversationId: firstConv.id,
                    });
                    toast.dismiss(t.id);
                  }}
                  className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  data-testid="mark-as-read"
                  title="Mark as read"
                >
                  <Check className="h-5 w-5 text-green-600" />
                </button>
              </div>
            </div>
          ),
          {
            duration: 5000,
            style: {
              maxWidth: '400px',
            },
          }
        );
      }
    }

    previousCountRef.current = totalUnread;
  }, [
    conversations,
    session,
    markAsReadMutation,
    playNotificationSound,
    soundEnabled,
    toggleSound,
  ]);
}
