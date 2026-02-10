'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCardId: string;
  cardName: string;
  cardImage?: string | null;
  defaultPrice?: number | null;
  onSuccess?: () => void;
}

export function CreateListingModal({
  isOpen,
  onClose,
  userCardId,
  cardName,
  cardImage,
  defaultPrice,
  onSuccess,
}: CreateListingModalProps) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const createListing = trpc.listing.create.useMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      setPrice('');
      setError('');
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price greater than $0');
      return;
    }

    createListing.mutate({
      userCardId,
      price: priceNum,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/40 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="mb-4 text-2xl font-black text-slate-900 dark:text-white">
          Create Listing
        </h2>

        {/* Card preview */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          {cardImage && (
            <Image
              src={cardImage}
              alt={cardName}
              width={48}
              height={64}
              className="h-16 w-12 rounded object-cover"
            />
          )}
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white">
              {cardName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This card will be listed on the marketplace
            </p>
            {defaultPrice && defaultPrice > 0 && (
              <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                Market price: ${defaultPrice.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300"
            >
              Listing Price
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-slate-500">
                $
              </span>
              <input
                type="number"
                id="price"
                step="0.01"
                min="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder={
                  defaultPrice && defaultPrice > 0
                    ? defaultPrice.toFixed(2)
                    : '0.00'
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-4 pl-8 text-lg font-bold text-slate-900 transition-all outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
                required
                disabled={createListing.isPending}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={createListing.isPending}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createListing.isPending}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50"
            >
              {createListing.isPending ? 'Creating...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
