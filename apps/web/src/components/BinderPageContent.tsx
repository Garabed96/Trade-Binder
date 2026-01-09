'use client';

import { trpc } from '@/src/utils/trpc';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/src/server/routers/_app';
import { UnassignedCardGrid } from './UnassignedCardGrid';
import { BatchActionBar } from './BatchActionBar';
import { BinderSidebarCard } from './BinderSidebarCard';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from '@repo/ui';
import { Plus, X, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Binder = RouterOutputs['binder']['list']['binders'][number] & {
  target_capacity?: number | null;
};

export default function BinderPageContent() {
  const { status } = useSession();
  const utils = trpc.useUtils();

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<'personal' | 'trade' | 'sale'>('personal');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [targetCapacity, setTargetCapacity] = useState<number | null>(100);

  // Edit state
  const [editingBinderId, setEditingBinderId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editType, setEditType] = useState<'personal' | 'trade' | 'sale'>(
    'personal'
  );
  const [editIsPublic, setEditIsPublic] = useState<boolean>(false);
  const [editTargetCapacity, setEditTargetCapacity] = useState<number | null>(
    null
  );

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [binderToDelete, setBinderToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');

  // Card delete modal state
  const [deleteCardsModalOpen, setDeleteCardsModalOpen] =
    useState<boolean>(false);
  const [cardsToDelete, setCardsToDelete] = useState<string[]>([]);

  // Card assignment state
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedBinderId, setSelectedBinderId] = useState<string | null>(null);
  const [destinationBinderId, setDestinationBinderId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState<string | null>(null);

  // Use ref instead of state to avoid setState in effect warning
  const prevCardCountRef = useRef(0);

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Queries
  const { data: listBinder, isLoading: binderLoading } =
    trpc.binder.list.useQuery(undefined, {
      enabled: status === 'authenticated',
    });
  const { data: selectedBinderData } = trpc.binder.getById.useQuery(
    { id: selectedBinderId! },
    { enabled: !!selectedBinderId }
  );
  const { data: sets = [] } = trpc.card.listSets.useQuery();

  const maxBinders = listBinder?.limits?.maxBinders ?? 0;
  const binderCount = listBinder?.limits?.binderCount ?? 0;
  const canCreateBinder = listBinder?.limits?.canCreateBinder ?? false;
  const defaultBinderId = listBinder?.defaultBinderId || null;

  // Get selected binder details
  const selectedBinder = listBinder?.binders?.find(
    b => b.id === selectedBinderId
  );

  // Update prev card count when selected binder changes
  useEffect(() => {
    if (selectedBinder) {
      prevCardCountRef.current = selectedBinder.card_count;
    }
  }, [selectedBinder]);

  // Helper functions
  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  };

  const checkMilestone = useCallback(
    (newCount: number, capacity: number | null) => {
      if (!capacity) return;

      const prevPercent = Math.floor(
        (prevCardCountRef.current / capacity) * 100
      );
      const newPercent = Math.floor((newCount / capacity) * 100);

      const milestones = [25, 50, 75, 100];
      const crossedMilestone = milestones.find(
        m => prevPercent < m && newPercent >= m
      );

      if (crossedMilestone) {
        showMessage(`Milestone reached: ${crossedMilestone}% full!`);
      }

      prevCardCountRef.current = newCount;
    },
    []
  );

  // Mutations
  const createBinder = trpc.binder.create.useMutation({
    onSuccess: async () => {
      showMessage('Binder created successfully');
      setName('');
      setDescription('');
      setType('personal');
      setIsPublic(false);
      setTargetCapacity(100);
      setShowCreateForm(false);
      await utils.binder.list.invalidate();
    },
    onError: err => {
      showMessage(`Error: ${err.message}`);
    },
  });

  const updateBinder = trpc.binder.update.useMutation({
    onSuccess: async () => {
      showMessage('Binder updated successfully');
      setEditingBinderId(null);
      await utils.binder.list.invalidate();
    },
    onError: err => {
      showMessage(`Error: ${err.message}`);
    },
  });

  const deleteBinder = trpc.binder.delete.useMutation({
    onSuccess: async () => {
      showMessage('Binder deleted successfully');
      setDeleteModalOpen(false);
      setBinderToDelete(null);
      setDeleteConfirmText('');
      if (selectedBinderId === binderToDelete?.id) {
        setSelectedBinderId(null);
      }
      await utils.binder.list.invalidate();
    },
    onError: err => {
      showMessage(`Error: ${err.message}`);
    },
  });

  const moveCard = trpc.binder.assignCard.useMutation({
    onSuccess: (
      _: unknown,
      variables: { userCardId: string; binderId: string }
    ) => {
      const destBinder = listBinder?.binders?.find(
        b => b.id === variables.binderId
      );
      showMessage(`Card moved to ${destBinder?.name || 'binder'}`);

      setSelectedCardIds(new Set());
      utils.binder.getById.invalidate();
      utils.binder.list.invalidate();
    },
    onError: (error: { message: string }) => {
      showMessage(`Error: ${error.message}`);
    },
  });

  const assignBatch = trpc.binder.batchAssignCards.useMutation({
    onSuccess: (data: {
      success: boolean;
      updatedCount: number;
      assignedCards: string[];
      cardCount: number;
      targetCapacity: number | null;
    }) => {
      checkMilestone(data.cardCount, data.targetCapacity);

      const destBinder = listBinder?.binders?.find(
        b => b.id === destinationBinderId
      );
      showMessage(
        `${data.updatedCount} cards moved to ${destBinder?.name || 'binder'}`
      );

      setSelectedCardIds(new Set());

      utils.binder.getById.invalidate();
      utils.binder.list.invalidate();
    },
    onError: (error: { message: string }) => {
      showMessage(`Error: ${error.message}`);
    },
  });

  const setAsDefault = trpc.binder.setAsDefault.useMutation({
    onSuccess: async () => {
      showMessage('Default binder updated');
      setOpenMenuId(null);
      await utils.binder.list.invalidate();
    },
    onError: (err: { message: string }) => {
      showMessage(`Error: ${err.message}`);
    },
  });

  const deleteCard = trpc.inventory.remove.useMutation({
    onSuccess: async () => {
      showMessage('Card deleted successfully');
      setSelectedCardIds(new Set());
      setDeleteCardsModalOpen(false);
      setCardsToDelete([]);
      await utils.binder.getById.invalidate();
      await utils.binder.list.invalidate();
    },
    onError: (err: { message: string }) => {
      showMessage(`Error: ${err.message}`);
      setDeleteCardsModalOpen(false);
      setCardsToDelete([]);
    },
  });

  const batchDeleteCards = trpc.inventory.batchRemove.useMutation({
    onSuccess: async (data: { success: boolean; deletedCount: number }) => {
      showMessage(
        `${data.deletedCount} card${data.deletedCount !== 1 ? 's' : ''} deleted successfully`
      );
      setSelectedCardIds(new Set());
      setDeleteCardsModalOpen(false);
      setCardsToDelete([]);
      await utils.binder.getById.invalidate();
      await utils.binder.list.invalidate();
    },
    onError: (err: { message: string }) => {
      showMessage(`Error: ${err.message}`);
      setDeleteCardsModalOpen(false);
      setCardsToDelete([]);
    },
  });

  // Handlers
  const handleToggleSelect = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleQuickAdd = (cardId: string) => {
    if (!destinationBinderId) {
      showMessage('Please select a destination binder first');
      return;
    }
    moveCard.mutate({
      userCardId: cardId,
      binderId: destinationBinderId,
    });
  };

  const handleBatchMove = () => {
    if (selectedCardIds.size === 0) return;
    if (!destinationBinderId) {
      showMessage('Please select a destination binder');
      return;
    }

    assignBatch.mutate({
      userCardIds: Array.from(selectedCardIds),
      binderId: destinationBinderId,
    });
  };

  const handleClearSelection = () => {
    setSelectedCardIds(new Set());
  };

  const handleSingleDelete = (cardId: string) => {
    setCardsToDelete([cardId]);
    setDeleteCardsModalOpen(true);
  };

  const handleBatchDelete = () => {
    if (selectedCardIds.size === 0) return;
    setCardsToDelete(Array.from(selectedCardIds));
    setDeleteCardsModalOpen(true);
  };

  const confirmCardDelete = () => {
    if (cardsToDelete.length === 1) {
      deleteCard.mutate({ userCardId: cardsToDelete[0] });
    } else {
      batchDeleteCards.mutate({ userCardIds: cardsToDelete });
    }
  };

  const closeCardDeleteModal = () => {
    setDeleteCardsModalOpen(false);
    setCardsToDelete([]);
  };

  const handleEdit = (binder: Binder) => {
    setEditingBinderId(binder.id);
    setEditName(binder.name);
    setEditDescription(binder.description || '');
    setEditType(binder.type as 'personal' | 'trade' | 'sale');
    setEditIsPublic(binder.is_public);
    setEditTargetCapacity(binder.target_capacity ?? null);
    setOpenMenuId(null);
    setShowCreateForm(false); // Hide create form when editing
  };

  const handleCancelEdit = () => {
    setEditingBinderId(null);
    setEditName('');
    setEditDescription('');
    setEditType('personal');
    setEditIsPublic(false);
    setEditTargetCapacity(null);
  };

  const openDeleteModal = (binderId: string, binderName: string) => {
    setBinderToDelete({ id: binderId, name: binderName });
    setDeleteModalOpen(true);
    setDeleteConfirmText('');
    setOpenMenuId(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setBinderToDelete(null);
    setDeleteConfirmText('');
  };

  const confirmDelete = () => {
    if (binderToDelete && deleteConfirmText === binderToDelete.name) {
      deleteBinder.mutate({ id: binderToDelete.id });
    }
  };

  const toggleMenu = (binderId: string) => {
    setOpenMenuId(openMenuId === binderId ? null : binderId);
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    if (['personal', 'trade', 'sale'].includes(value)) {
      setType(value as 'personal' | 'trade' | 'sale');
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    if (['personal', 'trade', 'sale'].includes(value)) {
      setEditType(value as 'personal' | 'trade' | 'sale');
    }
  };

  if (binderLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="mr-4">Loading...</p>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container-default relative min-h-screen space-y-10 bg-gradient-to-b from-zinc-950 via-slate-900 to-black py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      {/* Header */}
      <header className="relative mb-6 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-wide md:text-4xl">
          Binder Management
        </h1>
        <p className="max-w-xl text-sm text-slate-400 md:text-base">
          Organize your collection by viewing and moving cards between binders.
        </p>
      </header>

      {/* Global message toast */}
      {message && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
          <p className="text-sm text-slate-200">{message}</p>
        </div>
      )}

      {/* Delete Binder Confirmation Modal */}
      {deleteModalOpen && binderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-red-600/40 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-600/20 p-2">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">Delete Binder</h3>
            </div>

            <p className="mb-4 text-slate-300">
              You are about to delete{' '}
              <span className="font-semibold text-white">
                &quot;{binderToDelete?.name}&quot;
              </span>
              . Your cards will be preserved but removed from this binder.
            </p>

            <p className="mb-2 text-sm text-slate-400">
              Type the binder name{' '}
              <span className="font-mono text-white">
                &quot;{binderToDelete?.name}&quot;
              </span>{' '}
              to confirm:
            </p>

            <Input
              variant="danger"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Enter binder name"
              autoFocus
            />

            <div className="mt-6 flex gap-3">
              <Button
                color="secondary"
                variant="solid"
                onClick={closeDeleteModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                color="destructive"
                variant="solid"
                onClick={confirmDelete}
                disabled={deleteConfirmText !== binderToDelete.name}
                loading={deleteBinder.isPending}
                className="flex-1"
              >
                Delete Binder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Cards Confirmation Modal */}
      {deleteCardsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-xl border border-red-600/40 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-600/20 p-2">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">
                Delete Card{cardsToDelete.length !== 1 ? 's' : ''}
              </h3>
            </div>

            <p className="mb-4 text-slate-300">
              You are about to permanently delete{' '}
              <span className="font-semibold text-white">
                {cardsToDelete.length} card
                {cardsToDelete.length !== 1 ? 's' : ''}
              </span>{' '}
              from your collection. This action cannot be undone.
            </p>

            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">
                ⚠️ Warning: This will permanently remove{' '}
                {cardsToDelete.length === 1 ? 'this card' : 'these cards'} from
                your entire collection, not just the current binder.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeCardDeleteModal}
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmCardDelete}
                disabled={deleteCard.isPending || batchDeleteCards.isPending}
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteCard.isPending || batchDeleteCards.isPending
                  ? 'Deleting...'
                  : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative">
        {/* Mobile: Horizontal Binder Strip */}
        <div className="mb-6 block lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200">
              Select Destination Binder
            </h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          {/* Collapsible Create Form (Mobile) */}
          {showCreateForm && (
            <div className="mb-4 space-y-3 rounded-lg border border-slate-700/60 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200">Create Binder</h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <input
                className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                placeholder="Binder name"
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <textarea
                className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
              />

              <select
                className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                value={type}
                onChange={handleChange}
              >
                <option value="personal">Personal</option>
                <option value="trade">Trade</option>
                <option value="sale">Sale</option>
              </select>

              <input
                type="number"
                min="1"
                placeholder="Target capacity (optional)"
                value={targetCapacity || ''}
                onChange={e =>
                  setTargetCapacity(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
              />

              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-black/40"
                />
                Make public
              </label>

              <button
                onClick={() => {
                  if (!canCreateBinder) {
                    showMessage(
                      `Binder limit reached (${binderCount}/${maxBinders})`
                    );
                    return;
                  }
                  createBinder.mutate({
                    name,
                    description: description || undefined,
                    type,
                    isPublic,
                    targetCapacity,
                  });
                }}
                disabled={createBinder.isPending || !canCreateBinder}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {createBinder.isPending ? 'Creating...' : 'Create Binder'}
              </button>
            </div>
          )}

          {/* Horizontal Scrollable Binder List (Mobile) */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {listBinder?.binders?.map(binder => (
              <button
                key={binder.id}
                onClick={() => setSelectedBinderId(binder.id)}
                className={`relative flex-shrink-0 rounded-lg border p-3 transition-all ${
                  selectedBinderId === binder.id
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700/60 bg-slate-900/40'
                }`}
                style={{ minWidth: '200px' }}
              >
                <div className="text-left">
                  <h3 className="truncate text-sm font-bold text-slate-200">
                    {binder.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {binder.target_capacity
                      ? `${binder.card_count} / ${binder.target_capacity}`
                      : `${binder.card_count} cards`}
                  </p>
                </div>

                {/* Mini progress bar */}
                {binder.target_capacity && (
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800/50">
                    <div
                      className={`h-full transition-all ${
                        selectedBinderId === binder.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600'
                          : 'bg-slate-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          (binder.card_count / binder.target_capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Split Layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Left: Binder Cards */}
          <div className="space-y-4">
            {!selectedBinderId ? (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
                <p className="text-slate-400">
                  Select a binder to view and manage its cards
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-200">
                    {selectedBinder?.name} (
                    {selectedBinderData?.cards.length || 0} cards)
                  </h2>
                </div>

                {/* Destination Binder Selector - More Prominent */}
                {selectedBinderData && selectedBinderData.cards.length > 0 && (
                  <div className="rounded-lg border-2 border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-4 shadow-lg">
                    <div className="mb-3 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-blue-400" />
                      <label className="block text-base font-bold text-blue-300">
                        Move cards to this binder:
                      </label>
                    </div>
                    <select
                      value={destinationBinderId || ''}
                      onChange={e =>
                        setDestinationBinderId(e.target.value || null)
                      }
                      className={`w-full rounded-md border-2 px-4 py-3 text-sm font-medium transition outline-none ${
                        destinationBinderId
                          ? 'border-green-500 bg-green-500/10 text-green-300 ring-2 ring-green-500/20'
                          : 'border-slate-700 bg-black/40 text-slate-400'
                      } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50`}
                    >
                      <option value="">Choose a destination binder...</option>
                      {listBinder?.binders
                        ?.filter(b => b.id !== selectedBinderId)
                        .map(binder => (
                          <option key={binder.id} value={binder.id}>
                            {binder.name} ({binder.card_count}
                            {binder.target_capacity
                              ? ` / ${binder.target_capacity}`
                              : ''}
                            )
                          </option>
                        ))}
                    </select>
                    {destinationBinderId && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-green-400">
                        <svg
                          className="h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Ready! Click + on cards or select multiple cards to move
                      </p>
                    )}
                    {!destinationBinderId && (
                      <p className="mt-2 text-xs text-slate-400">
                        Select a destination binder first, then use the + button
                        on cards or select multiple cards
                      </p>
                    )}
                  </div>
                )}

                <UnassignedCardGrid
                  cards={[...(selectedBinderData?.cards || [])]}
                  sets={[...sets]}
                  selectedCardIds={selectedCardIds}
                  onToggleSelect={handleToggleSelect}
                  onQuickAdd={handleQuickAdd}
                  onDelete={handleSingleDelete}
                />
              </>
            )}
          </div>

          {/* Right: Binder List + Create Form (Desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-4">
              {/* Create/Edit Form */}
              {editingBinderId ? (
                // Edit Form
                <div className="space-y-4 rounded-xl border border-amber-600/60 bg-slate-900/70 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-amber-400">
                      Edit Binder
                    </h3>
                    <button
                      onClick={handleCancelEdit}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <Input
                    placeholder="Binder name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />

                  <textarea
                    className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                    placeholder="Description"
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={2}
                  />

                  <select
                    className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                    value={editType}
                    onChange={handleEditChange}
                  >
                    <option value="personal">Personal</option>
                    <option value="trade">Trade</option>
                    <option value="sale">Sale</option>
                  </select>

                  <input
                    type="number"
                    min="1"
                    placeholder="Target capacity"
                    value={editTargetCapacity || ''}
                    onChange={e =>
                      setEditTargetCapacity(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                  />

                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={editIsPublic}
                      onChange={e => setEditIsPublic(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-600 bg-black/40"
                    />
                    Make public
                  </label>

                  <button
                    onClick={() => {
                      if (!editingBinderId) return;
                      updateBinder.mutate({
                        id: editingBinderId,
                        name: editName,
                        description: editDescription || undefined,
                        type: editType,
                        isPublic: editIsPublic,
                        targetCapacity: editTargetCapacity,
                      });
                    }}
                    disabled={updateBinder.isPending}
                    className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {updateBinder.isPending ? 'Updating...' : 'Update Binder'}
                  </button>
                </div>
              ) : (
                // Collapsible Create Form
                <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 backdrop-blur">
                  <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="flex w-full items-center justify-between p-4"
                  >
                    <h3 className="font-semibold text-slate-200">
                      Create New Binder
                    </h3>
                    {showCreateForm ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              )}

              {/* Binder List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Your Binders ({listBinder?.binders?.length || 0})
                </h3>
                <div className="max-h-[calc(100vh-500px)] space-y-2 overflow-y-auto">
                  {listBinder?.binders?.map(binder => (
                    <div key={binder.id} className="relative">
                      <BinderSidebarCard
                        binder={binder}
                        isSelected={selectedBinderId === binder.id}
                        onClick={() => setSelectedBinderId(binder.id)}
                      />

                      {/* Default Badge */}
                      {binder.id === defaultBinderId && (
                        <div className="absolute top-2 left-2 rounded-full bg-blue-500/90 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
                          Default
                        </div>
                      )}

                      {/* Menu Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleMenu(binder.id);
                        }}
                        className="absolute top-2 right-2 rounded-md border border-slate-600/50 bg-slate-800/80 p-1 text-slate-300 backdrop-blur transition hover:border-slate-500 hover:text-white"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === binder.id && (
                        <div className="absolute top-10 right-2 z-10 w-40 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                          <button
                            onClick={() => handleEdit(binder)}
                            className="flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                          >
                            Edit
                          </button>
                          {binder.id !== defaultBinderId && (
                            <button
                              onClick={() => {
                                setAsDefault.mutate({ binderId: binder.id });
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-blue-400 transition hover:bg-slate-800"
                            >
                              Set as Default
                            </button>
                          )}
                          <button
                            onClick={() =>
                              openDeleteModal(binder.id, binder.name)
                            }
                            className="flex w-full items-center gap-2 rounded-b-lg px-3 py-2 text-sm text-red-400 transition hover:bg-slate-800"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Batch Action Bar */}
      <BatchActionBar
        selectedCount={selectedCardIds.size}
        onClear={handleClearSelection}
        onAddToBinder={handleBatchMove}
        onDelete={handleBatchDelete}
        isLoading={assignBatch.isPending}
      />
    </div>
  );
}
