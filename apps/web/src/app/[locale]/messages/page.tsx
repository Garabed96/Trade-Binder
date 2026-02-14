'use client';

import { ConversationList } from '@/src/components/ConversationList';
import { MessageThread } from '@/src/components/MessageThread';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MessagesPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar: Conversation List */}
      <div className="w-full border-r md:w-1/3">
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Main: Message Thread */}
      <div className="hidden md:block md:flex-1">
        {selectedConversationId ? (
          <MessageThread conversationId={selectedConversationId} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {/* Mobile: Show thread when conversation selected */}
      {selectedConversationId && (
        <div className="fixed inset-0 z-50 bg-white md:hidden dark:bg-gray-900">
          <div className="flex h-full flex-col">
            <div className="border-b p-4">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="text-blue-500"
              >
                ← Back
              </button>
            </div>
            <div className="flex-1">
              <MessageThread conversationId={selectedConversationId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
