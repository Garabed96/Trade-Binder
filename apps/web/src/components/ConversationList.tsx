'use client';

import { trpc } from '@/src/utils/trpc';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const { data: conversations = [], isLoading } =
    trpc.message.getConversations.useQuery({
      limit: 50,
    });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b p-4">
        <h2 className="text-xl font-bold">Messages</h2>
      </div>

      {conversations.map(conversation => (
        <div
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={`cursor-pointer border-b p-4 hover:bg-gray-50 dark:hover:bg-gray-800 ${
            selectedId === conversation.id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : ''
          }`}
          data-testid={`conversation-${conversation.id}`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">
                  {conversation.other_user_name}
                </h3>
                {conversation.unread_count > 0 && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {conversation.unread_count}
                  </span>
                )}
              </div>
              <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                {conversation.last_message || 'No messages yet'}
              </p>
            </div>
            <p className="ml-2 shrink-0 text-xs text-gray-500">
              {formatDistanceToNow(new Date(conversation.updated_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      ))}

      {conversations.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No conversations yet
        </div>
      )}
    </div>
  );
}
