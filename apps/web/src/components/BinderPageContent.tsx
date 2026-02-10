'use client';

import { trpc } from '@/src/utils/trpc';
import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import {
  Search,
  Trash2,
  Settings,
  X,
  Loader2,
  Globe,
  Lock,
  Plus,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { EditionPickerModal } from './EditionPickerModal';
import { CreateListingModal } from './CreateListingModal';
import { ListingBadge } from './ListingBadge';

export default function BinderPageContent() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const utils = trpc.useUtils();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Edition picker state
  const [editionPickerOpen, setEditionPickerOpen] = useState(false);
  const [selectedCardForAdd, setSelectedCardForAdd] = useState<{
    oracleId: string;
    name: string;
  } | null>(null);

  // Filter state for binder cards
  const [filterQuery, setFilterQuery] = useState('');

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

  // Delete confirmation
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Listing modal state
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [selectedCardForListing, setSelectedCardForListing] = useState<{
    userCardId: string;
    name: string;
    image: string | null;
    price: number | null;
  } | null>(null);

  // Location warning modal
  const [showLocationWarning, setShowLocationWarning] = useState(false);

  // Message toast
  const [message, setMessage] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data: binder, isLoading } = trpc.binder.get.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const { data: currentUser } = trpc.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
  });

  const { data: searchResults, isFetching: isSearching } =
    trpc.card.fuzzySearch.useQuery(
      { query: debouncedSearch },
      { enabled: debouncedSearch.length >= 3 }
    );

  // Mutations
  const addToBinder = trpc.inventory.add.useMutation({
    onSuccess: async () => {
      showToast('Card added to binder!');
      await utils.binder.get.invalidate();
      setEditionPickerOpen(false);
      setSelectedCardForAdd(null);
    },
    onError: err => {
      showToast(`Error: ${err.message}`);
    },
  });

  const removeCard = trpc.binder.removeCard.useMutation({
    onSuccess: async () => {
      showToast('Card removed from binder');
      setCardToDelete(null);
      await utils.binder.get.invalidate();
    },
    onError: err => {
      showToast(`Error: ${err.message}`);
    },
  });

  const updateBinder = trpc.binder.update.useMutation({
    onSuccess: async () => {
      showToast('Binder settings updated');
      setShowSettings(false);
      await utils.binder.get.invalidate();
    },
    onError: err => {
      showToast(`Error: ${err.message}`);
    },
  });

  const cancelListing = trpc.listing.cancel.useMutation({
    onSuccess: async () => {
      showToast('Listing cancelled');
      await utils.binder.get.invalidate();
    },
    onError: err => {
      showToast(`Error: ${err.message}`);
    },
  });

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  // Open settings with current values
  const openSettings = () => {
    if (binder) {
      setEditName(binder.name);
      setEditDescription(binder.description || '');
      setEditIsPublic(binder.is_public);
      setShowSettings(true);
    }
  };

  // Handle card click from search results
  const handleSearchResultClick = (card: {
    oracle_id: string;
    name: string;
  }) => {
    setSelectedCardForAdd({ oracleId: card.oracle_id, name: card.name });
    setEditionPickerOpen(true);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  // Handle printing selection from edition picker
  const handleSelectPrinting = (printingId: string) => {
    addToBinder.mutate({
      printingId,
      isFoil: false,
      language: 'en',
    });
  };

  // Check if user has location set
  const hasLocation =
    currentUser?.latitude != null && currentUser?.longitude != null;

  // Handle listing button click
  const handleListingClick = (card: {
    id: string;
    name: string;
    image_uri_normal: string | null;
    listing_id: string | null;
    price_usd: number | null;
  }) => {
    if (card.listing_id) {
      // Card is already listed, cancel the listing
      if (confirm(`Cancel listing for ${card.name}?`)) {
        cancelListing.mutate({ listingId: card.listing_id });
      }
    } else {
      // Check if user has location set before allowing listing
      if (!hasLocation) {
        setShowLocationWarning(true);
        return;
      }
      // Open listing modal
      setSelectedCardForListing({
        userCardId: card.id,
        name: card.name,
        image: card.image_uri_normal,
        price: card.price_usd,
      });
      setListingModalOpen(true);
    }
  };

  // Extract cards for stable dependency
  const cards = useMemo(() => binder?.cards ?? [], [binder?.cards]);

  // Filter binder cards
  const filteredCards = useMemo(() => {
    if (!filterQuery) return cards;

    const query = filterQuery.toLowerCase();
    return cards.filter(
      card =>
        card.name.toLowerCase().includes(query) ||
        card.set_name.toLowerCase().includes(query) ||
        card.set_code.toLowerCase().includes(query)
    );
  }, [cards, filterQuery]);

  // Calculate total value
  const totalValue = useMemo(() => {
    return cards.reduce((sum, card) => sum + (card.price_usd || 0), 0);
  }, [cards]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Please sign in to view your binder</p>
        <button
          onClick={() => router.push(`/${locale}/api/auth/signin`)}
          className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black py-8 text-slate-100">
      <div className="container-default">
        {/* Toast */}
        {message && (
          <div className="fixed top-4 right-4 z-50 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
            <p className="text-sm text-slate-200">{message}</p>
          </div>
        )}

        {/* Edition Picker Modal */}
        {selectedCardForAdd && (
          <EditionPickerModal
            isOpen={editionPickerOpen}
            onClose={() => {
              setEditionPickerOpen(false);
              setSelectedCardForAdd(null);
            }}
            oracleId={selectedCardForAdd.oracleId}
            cardName={selectedCardForAdd.name}
            onSelectPrinting={handleSelectPrinting}
          />
        )}

        {/* Delete Confirmation Modal */}
        {cardToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-red-600/40 bg-slate-900 p-6 shadow-2xl">
              <h3 className="mb-4 text-xl font-bold text-red-400">
                Remove Card
              </h3>
              <p className="mb-6 text-slate-300">
                Are you sure you want to remove this card from your binder? This
                action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCardToDelete(null)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    removeCard.mutate({ userCardId: cardToDelete })
                  }
                  disabled={removeCard.isPending}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {removeCard.isPending ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-200">
                  Binder Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Binder Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-400">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={e => setEditIsPublic(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-600 bg-slate-800"
                  />
                  <span className="text-slate-300">
                    Make binder public (others can view)
                  </span>
                </label>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    updateBinder.mutate({
                      name: editName,
                      description: editDescription,
                      isPublic: editIsPublic,
                    })
                  }
                  disabled={updateBinder.isPending}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateBinder.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Listing Modal */}
        {selectedCardForListing && (
          <CreateListingModal
            isOpen={listingModalOpen}
            onClose={() => {
              setListingModalOpen(false);
              setSelectedCardForListing(null);
            }}
            userCardId={selectedCardForListing.userCardId}
            cardName={selectedCardForListing.name}
            cardImage={selectedCardForListing.image}
            defaultPrice={selectedCardForListing.price}
            onSuccess={() => {
              showToast('Card listed on marketplace!');
              utils.binder.get.invalidate();
            }}
          />
        )}

        {/* Location Warning Modal */}
        {showLocationWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-amber-600/40 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-amber-500/20 p-2">
                  <MapPin className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-amber-400">
                  Location Required
                </h3>
              </div>
              <p className="mb-6 text-slate-300">
                You need to set your location before you can list cards for
                sale. This helps buyers find sellers near them.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLocationWarning(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLocationWarning(false);
                    router.push(`/${locale}/profile`);
                  }}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
                >
                  Set Location
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-100 md:text-4xl">
                {binder?.name || 'My Binder'}
              </h1>
              {binder?.description && (
                <p className="mt-2 text-slate-400">{binder.description}</p>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-slate-400">
                  {binder?.is_public ? (
                    <>
                      <Globe className="h-4 w-4" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Private
                    </>
                  )}
                </span>
                <span className="text-slate-400">
                  {binder?.cardCount || 0} cards
                </span>
                <span className="font-bold text-blue-400">
                  ${totalValue.toFixed(2)} total value
                </span>
              </div>
            </div>
            <button
              onClick={openSettings}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:border-slate-600 hover:text-slate-200"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Search to Add Cards */}
        <div className="relative mb-8">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search cards to add to your binder..."
              className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-3 pr-4 pl-12 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
            {isSearching && (
              <Loader2 className="absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 animate-spin text-blue-500" />
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && debouncedSearch.length >= 3 && (
            <div className="absolute z-40 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              {searchResults && searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map(card => (
                    <button
                      key={card.oracle_id}
                      onClick={() => handleSearchResultClick(card)}
                      className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-slate-800"
                    >
                      <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-800">
                        {card.image_uri_normal ? (
                          <Image
                            src={card.image_uri_normal}
                            alt={card.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-500">
                            MTG
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-200">{card.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-bold text-amber-400 uppercase">
                            {card.set_code}
                          </span>
                          <span>{card.set_name}</span>
                          {card.printing_count > 1 && (
                            <span className="rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">
                              {card.printing_count} editions
                            </span>
                          )}
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-blue-400" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-400">
                  No cards found for &quot;{debouncedSearch}&quot;
                </div>
              )}
            </div>
          )}
        </div>

        {/* Click outside to close search */}
        {showSearchResults && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setShowSearchResults(false)}
          />
        )}

        {/* Filter Binder Cards */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter your binder..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pr-4 pl-10 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Card Grid */}
        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredCards.map(card => (
              <div
                key={card.id}
                className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:shadow-lg"
              >
                {/* Card Image */}
                <div
                  className="relative aspect-[2.5/3.5] cursor-pointer bg-slate-800"
                  onClick={() => {
                    // If card has a listing, go to marketplace to see it from buyer's perspective
                    // Otherwise, go to card detail page
                    if (card.listing_id) {
                      router.push(`/${locale}/marketplace`);
                    } else {
                      router.push(`/${locale}/cards/design/${card.oracle_id}`);
                    }
                  }}
                >
                  {card.image_uri_normal ? (
                    <Image
                      src={card.image_uri_normal}
                      alt={card.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                      No Image
                    </div>
                  )}

                  {/* Listing badge */}
                  {card.listing_id && (
                    <ListingBadge
                      price={card.listing_price || 0}
                      status="active"
                    />
                  )}

                  {/* Delete button overlay */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setCardToDelete(card.id);
                    }}
                    className="absolute top-2 right-2 rounded-lg bg-red-600/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>

                  {/* Foil badge */}
                  {card.is_foil && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-[9px] font-black text-white uppercase">
                      Foil
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3">
                  <p
                    className="truncate text-sm font-bold text-slate-200"
                    title={card.name}
                  >
                    {card.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-black text-amber-400 uppercase">
                      {card.set_code}
                    </span>
                    <span className="truncate text-[10px] text-slate-500">
                      {card.set_name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-400">
                      {card.price_usd ? `$${card.price_usd.toFixed(2)}` : '—'}
                    </span>
                    {card.rarity === 'mythic' && (
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold text-orange-400 uppercase">
                        Mythic
                      </span>
                    )}
                    {card.rarity === 'rare' && (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-400 uppercase">
                        Rare
                      </span>
                    )}
                  </div>

                  {/* Sell / Cancel Listing Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleListingClick(card);
                    }}
                    disabled={cancelListing.isPending}
                    className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                      card.listing_id
                        ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                    } disabled:opacity-50`}
                  >
                    {card.listing_id ? (
                      <>
                        <X className="h-3 w-3" />
                        Cancel Listing
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-3 w-3" />
                        Sell Card
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-12 text-center">
            <p className="mb-2 text-lg font-bold text-slate-400">
              {filterQuery
                ? 'No cards match your filter'
                : 'Your binder is empty'}
            </p>
            <p className="text-sm text-slate-500">
              {filterQuery
                ? 'Try a different search term'
                : 'Use the search bar above to find and add cards'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
