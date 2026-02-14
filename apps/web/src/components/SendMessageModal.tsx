'use client';

import { useState } from 'react';
import { trpc } from '@/src/utils/trpc';
import { Button } from '@trade-binder/ui';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Props {
  sellerId: string;
  sellerName: string;
  listingId?: string;
  onClose: () => void;
}

export function SendMessageModal({
  sellerId,
  sellerName,
  listingId,
  onClose,
}: Props) {
  const [message, setMessage] = useState('');
  const router = useRouter();

  const startConversationMutation = trpc.message.startConversation.useMutation({
    onSuccess: () => {
      toast.success('Message sent!');
      onClose();
      // Optionally navigate to messages page
      router.push(`/en/messages`);
    },
    onError: error => {
      toast.error('Failed to send message: ' + error.message);
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;

    startConversationMutation.mutate({
      otherUserId: sellerId,
      listingId,
      initialMessage: message.trim(),
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        data-testid="send-message-modal"
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Message {sellerName}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Input */}
        <div className="mb-4">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full resize-none rounded-lg border p-3 dark:border-gray-600 dark:bg-gray-900"
            autoFocus
          />
          <p className="mt-1 text-sm text-gray-500">
            {listingId
              ? 'This message will be linked to the listing.'
              : 'Start a conversation with this seller.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={startConversationMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || startConversationMutation.isPending}
            loading={startConversationMutation.isPending}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Message
          </Button>
        </div>
      </div>
    </>
  );
}
