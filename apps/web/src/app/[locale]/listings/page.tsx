'use client';

import { useState } from 'react';
import { trpc } from '@/src/utils/trpc';
import { Edit2, X, MessageSquare, RotateCcw, Package } from 'lucide-react';
import Image from 'next/image';
import { ListingBadge } from '@/src/components/ListingBadge';
import { InquiriesModal } from '@/src/components/InquiriesModal';
import { useParams, useRouter } from 'next/navigation';

type TabType = 'active' | 'sold' | 'cancelled';

export default function MyListingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [editingListingId, setEditingListingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [selectedListingForInquiries, setSelectedListingForInquiries] =
    useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const utils = trpc.useUtils();

  // Fetch listings for all tabs to show counts
  const { data: activeListings } = trpc.listing.myListings.useQuery({
    status: 'active',
  });
  const { data: soldListings } = trpc.listing.myListings.useQuery({
    status: 'sold',
  });
  const { data: cancelledListings } = trpc.listing.myListings.useQuery({
    status: 'cancelled',
  });

  // Current tab listings
  const listings =
    activeTab === 'active'
      ? activeListings
      : activeTab === 'sold'
        ? soldListings
        : cancelledListings;
  const isLoading = !activeListings && !soldListings && !cancelledListings;

  // Update listing mutation
  const updateListing = trpc.listing.update.useMutation({
    onSuccess: () => {
      utils.listing.myListings.invalidate();
      setEditingListingId(null);
      setEditPrice('');
    },
  });

  // Cancel listing mutation
  const cancelListing = trpc.listing.cancel.useMutation({
    onSuccess: () => {
      utils.listing.myListings.invalidate();
    },
  });

  // Re-list mutation
  const relistListing = trpc.listing.relist.useMutation({
    onSuccess: () => {
      utils.listing.myListings.invalidate();
    },
  });

  const handleEditClick = (listingId: string, currentPrice: number) => {
    setEditingListingId(listingId);
    setEditPrice(currentPrice.toString());
  };

  const handleSaveEdit = (listingId: string) => {
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('Please enter a valid price');
      return;
    }

    updateListing.mutate({
      listingId,
      price: priceNum,
    });
  };

  const handleCancelListing = (listingId: string, cardName: string) => {
    if (confirm(`Cancel listing for ${cardName}?`)) {
      cancelListing.mutate({ listingId });
    }
  };

  const handleRelistListing = (listingId: string, cardName: string) => {
    if (confirm(`Re-list ${cardName} on the marketplace?`)) {
      relistListing.mutate({ listingId });
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container-default py-6 md:py-12">
        {/* Header */}
        <h1 className="mb-8 text-3xl font-black text-slate-900 dark:text-white">
          My Listings
        </h1>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Active
            {activeListings && activeListings.length > 0 && (
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                {activeListings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
              activeTab === 'sold'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Sold
            {soldListings && soldListings.length > 0 && (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                {soldListings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`flex items-center gap-2 px-6 py-3 font-bold transition-colors ${
              activeTab === 'cancelled'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Cancelled
            {cancelledListings && cancelledListings.length > 0 && (
              <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                {cancelledListings.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && listings && listings.length === 0 && (
          <div className="rounded-2xl border border-white/40 bg-white/10 p-12 text-center backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-4 flex justify-center">
              <Package className="h-12 w-12 text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
              No {activeTab} listings
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {activeTab === 'active' &&
                "You haven't listed any cards for sale yet. Go to your binder to list cards."}
              {activeTab === 'sold' &&
                "You haven't sold any cards yet. Keep your listings active and buyers will find you!"}
              {activeTab === 'cancelled' &&
                'No cancelled listings. Good job keeping your listings active!'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => router.push(`/${locale}/binder`)}
                className="mt-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg transition-all hover:shadow-blue-500/40"
              >
                Go to Binder
              </button>
            )}
          </div>
        )}

        {/* Listings grid */}
        {!isLoading && listings && listings.length > 0 && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {listings.map(listing => (
              <div
                key={listing.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40"
              >
                {/* Card image with badge */}
                <div className="relative aspect-[2.5/3.5] overflow-hidden bg-slate-100/50 dark:bg-slate-950">
                  {listing.card_image ? (
                    <Image
                      fill
                      src={listing.card_image}
                      alt={listing.card_name}
                      className="object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 text-center text-xs font-bold text-slate-400">
                      {listing.card_name}
                    </div>
                  )}

                  {/* Listing badge */}
                  <ListingBadge
                    price={listing.price}
                    status={listing.status as 'active' | 'sold' | 'cancelled'}
                  />
                </div>

                {/* Card details */}
                <div className="flex flex-1 flex-col space-y-3 bg-gradient-to-b from-white/40 to-white/80 p-4 backdrop-blur-md dark:bg-slate-900/50 dark:from-transparent dark:to-transparent">
                  <div className="space-y-1">
                    <h3
                      className="truncate text-sm font-bold text-slate-900 dark:text-white"
                      title={listing.card_name}
                    >
                      {listing.card_name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-black text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-500">
                        {listing.set_code}
                      </span>
                    </div>
                  </div>

                  {/* Price or edit form */}
                  {editingListingId === listing.id ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        step="0.01"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Price"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(listing.id)}
                          disabled={updateListing.isPending}
                          className="flex-1 rounded-lg bg-blue-600 px-2 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingListingId(null)}
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 dark:border-slate-800/50">
                        <span className="text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
                          ${listing.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Inquiry count badge */}
                      {listing.inquiry_count > 0 && (
                        <button
                          className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-500/20 dark:text-purple-400"
                          onClick={() =>
                            setSelectedListingForInquiries(listing.id)
                          }
                        >
                          <MessageSquare className="h-3 w-3" />
                          {listing.inquiry_count} inquir
                          {listing.inquiry_count === 1 ? 'y' : 'ies'}
                        </button>
                      )}

                      {/* Actions (only for active listings) */}
                      {activeTab === 'active' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleEditClick(listing.id, listing.price)
                            }
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-500/20 dark:text-blue-400"
                          >
                            <Edit2 className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleCancelListing(listing.id, listing.card_name)
                            }
                            disabled={cancelListing.isPending}
                            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1.5 text-xs font-bold text-red-700 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Re-list button (only for cancelled listings) */}
                      {activeTab === 'cancelled' && (
                        <div className="pt-1">
                          <button
                            onClick={() =>
                              handleRelistListing(listing.id, listing.card_name)
                            }
                            disabled={relistListing.isPending}
                            className="flex w-full items-center justify-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2 py-1.5 text-xs font-bold text-green-700 transition-colors hover:bg-green-500/20 disabled:opacity-50 dark:text-green-400"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Re-list
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inquiries Modal */}
      {selectedListingForInquiries && (
        <InquiriesModal
          isOpen={!!selectedListingForInquiries}
          onClose={() => setSelectedListingForInquiries(null)}
          listingId={selectedListingForInquiries}
          viewMode="seller"
        />
      )}
    </div>
  );
}
