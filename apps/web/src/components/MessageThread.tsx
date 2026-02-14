'use client';

import { trpc } from '@/src/utils/trpc';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@trade-binder/ui';
import { Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

interface Props {
  conversationId: string;
}

export function MessageThread({ conversationId }: Props) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;

  const { data: messages = [], isLoading } = trpc.message.getMessages.useQuery(
    { conversationId, limit: 50 },
    {
      enabled: !!conversationId,
      refetchInterval: 5000, // Poll every 5 seconds for new messages
    }
  );

  const sendMessageMutation = trpc.message.sendMessage.useMutation({
    onSuccess: () => {
      setMessage('');
      utils.message.getMessages.invalidate({ conversationId });
      utils.message.getConversations.invalidate();
    },
  });

  const handleSend = () => {
    if (message.trim()) {
      sendMessageMutation.mutate({
        conversationId,
        content: message.trim(),
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isCurrentUser = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`mb-4 flex ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-md rounded-lg p-3 ${
                    isCurrentUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="mb-1 text-xs font-semibold opacity-70">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${isCurrentUser ? 'opacity-70' : 'opacity-50'}`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border p-2 dark:border-gray-600 dark:bg-gray-800"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
