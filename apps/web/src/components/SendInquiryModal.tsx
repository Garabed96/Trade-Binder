'use client';

import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { SendMessageModal } from './SendMessageModal';

interface SendInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  cardName: string;
  cardImage?: string | null;
  price: number;
  sellerUsername: string;
  sellerId?: string; // Added for messaging
  onSuccess?: () => void;
}

export function SendInquiryModal({
  isOpen,
  onClose,
  listingId,
  cardName,
  cardImage,
  price,
  sellerUsername,
  sellerId,
  onSuccess,
}: SendInquiryModalProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);

  const sendInquiry = trpc.listing.sendInquiry.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      setMessage('');
      setError('');
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    sendInquiry.mutate({
      listingId,
      message: message.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        data-testid="send-inquiry-modal"
        className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="mb-4 text-2xl font-black text-slate-900 dark:text-white">
          {t('modal.sendInquiry.title')}
        </h2>

        {/* Card preview */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start gap-4">
            {cardImage && (
              <Image
                src={cardImage}
                alt={cardName}
                width={64}
                height={96}
                className="h-24 w-16 flex-shrink-0 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <p className="mb-1 font-bold text-slate-900 dark:text-white">
                {cardName}
              </p>
              <p className="mb-2 text-2xl font-black text-blue-600 dark:text-blue-400">
                ${price.toFixed(2)}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('modal.sendInquiry.sellerLabel')}{' '}
                <span className="font-bold">{sellerUsername}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            {t('modal.sendInquiry.howItWorks')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="message"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              {t('modal.sendInquiry.messageLabel')}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={t('modal.sendInquiry.messagePlaceholder')}
              rows={4}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
              disabled={sendInquiry.isPending}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={sendInquiry.isPending}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={sendInquiry.isPending}
                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50"
              >
                {sendInquiry.isPending
                  ? t('modal.sendInquiry.sending')
                  : 'Send Inquiry'}
              </button>
            </div>

            {/* Message Seller Button */}
            <button
              type="button"
              onClick={() => {
                setShowMessageModal(true);
                onClose(); // Close inquiry modal
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500 bg-purple-50 px-4 py-3 font-bold text-purple-700 transition-all hover:bg-purple-100 active:scale-95 dark:border-purple-400 dark:bg-purple-950/30 dark:text-purple-300 dark:hover:bg-purple-900/40"
            >
              <MessageCircle className="h-5 w-5" />
              Message Seller
            </button>
          </div>
        </form>

        {/* SendMessageModal */}
        {showMessageModal && sellerId && (
          <SendMessageModal
            sellerId={sellerId}
            sellerName={sellerUsername}
            listingId={listingId}
            onClose={() => setShowMessageModal(false)}
          />
        )}
      </div>
    </div>
  );
}
