import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/src/utils/trpc';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

/**
 * Hook that shows toast notifications when new messages arrive
 */
export function useMessageToast() {
  const { data: session } = useSession();
  const previousCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef(true);

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

        toast(
          t => (
            <Link
              href={`/en/messages`}
              onClick={() => toast.dismiss(t.id)}
              className="flex items-center gap-3"
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
              </div>
            </Link>
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
  }, [conversations, session]);
}
