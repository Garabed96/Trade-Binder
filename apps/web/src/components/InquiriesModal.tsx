'use client';

import React from 'react';
import { X, Check, XCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';

interface InquiriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  viewMode: 'seller' | 'buyer';
}

export function InquiriesModal({
  isOpen,
  onClose,
  listingId,
  viewMode,
}: InquiriesModalProps) {
  const utils = trpc.useUtils();

  // Fetch inquiries based on view mode
  const { data: inquiries, isLoading } =
    viewMode === 'seller'
      ? trpc.inquiry.receivedInquiries.useQuery({ listingId })
      : trpc.inquiry.myInquiries.useQuery({});

  // Update inquiry status mutation (seller only)
  const updateStatus = trpc.inquiry.updateStatus.useMutation({
    onSuccess: () => {
      utils.inquiry.receivedInquiries.invalidate();
      utils.listing.myListings.invalidate();
    },
  });

  const handleUpdateStatus = (
    inquiryId: string,
    status: 'accepted' | 'declined' | 'completed',
    cardName: string
  ) => {
    const confirmMessages = {
      accepted: `Accept inquiry for ${cardName}? The buyer will receive your contact info.`,
      declined: `Decline inquiry for ${cardName}?`,
      completed: `Mark transaction as completed for ${cardName}? This will mark the listing as sold.`,
    };

    if (confirm(confirmMessages[status])) {
      updateStatus.mutate({ inquiryId, status });
    }
  };

  if (!isOpen) return null;

  // Filter inquiries for this listing if buyer view
  const filteredInquiries =
    viewMode === 'buyer'
      ? inquiries?.filter(i => i.listing_id === listingId)
      : inquiries;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95">
        {/* Header */}
        <div className="border-b border-slate-200 p-6 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {viewMode === 'seller' ? 'Received Inquiries' : 'Your Inquiries'}
          </h2>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(80vh - 100px)' }}
        >
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            </div>
          )}

          {!isLoading &&
            (!filteredInquiries || filteredInquiries.length === 0) && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950">
                <p className="text-slate-600 dark:text-slate-400">
                  No inquiries yet
                </p>
              </div>
            )}

          {!isLoading && filteredInquiries && filteredInquiries.length > 0 && (
            <div className="space-y-4">
              {filteredInquiries.map(inquiry => (
                <div
                  key={inquiry.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  {/* Card info */}
                  <div className="mb-3 flex items-start gap-3">
                    {inquiry.card_image && (
                      <Image
                        src={inquiry.card_image}
                        alt={inquiry.card_name}
                        width={48}
                        height={64}
                        className="h-16 w-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {inquiry.card_name}
                      </p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        ${inquiry.listing_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Status badge */}
                    <StatusBadge status={inquiry.status} />
                  </div>

                  {/* User info */}
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {viewMode === 'seller' ? 'Buyer' : 'Seller'}:{' '}
                      {viewMode === 'seller'
                        ? (inquiry as { buyer_username: string }).buyer_username
                        : (inquiry as { seller_username: string })
                            .seller_username}
                    </p>
                    {/* Show email for seller always, for buyer only if accepted */}
                    {(viewMode === 'seller' ||
                      (viewMode === 'buyer' &&
                        inquiry.status === 'accepted')) && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Email:{' '}
                        {viewMode === 'seller'
                          ? (inquiry as { buyer_email: string }).buyer_email
                          : (inquiry as { seller_email: string | null })
                              .seller_email}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  {inquiry.message && (
                    <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">
                        Message:
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {inquiry.message}
                      </p>
                    </div>
                  )}

                  {/* Actions (seller only, pending inquiries) */}
                  {viewMode === 'seller' && inquiry.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            inquiry.id,
                            'accepted',
                            inquiry.card_name
                          )
                        }
                        disabled={updateStatus.isPending}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            inquiry.id,
                            'declined',
                            inquiry.card_name
                          )
                        }
                        disabled={updateStatus.isPending}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Complete button (seller only, accepted inquiries) */}
                  {viewMode === 'seller' && inquiry.status === 'accepted' && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(
                          inquiry.id,
                          'completed',
                          inquiry.card_name
                        )
                      }
                      disabled={updateStatus.isPending}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    accepted:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    completed:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${styles[status as keyof typeof styles] || ''}`}
    >
      {status}
    </span>
  );
}
