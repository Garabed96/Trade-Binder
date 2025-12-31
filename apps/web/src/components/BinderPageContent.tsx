import { trpc } from "@/src/utils/trpc";
import React, { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { inferRouterOutputs } from "@trpc/server";
import { AppRouter } from "@/src/server/routers/_app";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Binder = RouterOutputs["binder"]["list"]["binders"][number];

export default function BinderPageContent() {
  const { status } = useSession();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<"personal" | "trade" | "sale">("personal");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [message, setMessage] = useState<null | string>(null);

  // Edit state
  const [editingBinderId, setEditingBinderId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editType, setEditType] = useState<"personal" | "trade" | "sale">(
    "personal"
  );
  const [editIsPublic, setEditIsPublic] = useState<boolean>(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [binderToDelete, setBinderToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");

  // Dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: listBinder, isLoading: binderLoading } =
    trpc.binder.list.useQuery(undefined, {
      enabled: status === "authenticated",
    });
  const utils = trpc.useUtils();

  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos] = useState({ bot: -90, left: 0 });

  const maxBinders = listBinder?.limits?.maxBinders ?? 0;
  const binderCount = listBinder?.limits?.binderCount ?? 0;
  const canCreateBinder = listBinder?.limits?.canCreateBinder ?? false;

  // Create mutation
  const createBinder = trpc.binder.create.useMutation({
    onSuccess: async () => {
      setMessage("Binder created successfully");
      setName("");
      setDescription("");
      setType("personal");
      setIsPublic(false);
      await utils.binder.list.invalidate();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: err => {
      setMessage(`Error: ${err.message}`);
      setTimeout(() => setMessage(null), 5000);
    },
  });

  // Update mutation
  const updateBinder = trpc.binder.update.useMutation({
    onSuccess: async () => {
      setMessage("Binder updated successfully");
      setEditingBinderId(null);
      await utils.binder.list.invalidate();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: err => {
      setMessage(`Error: ${err.message}`);
      setTimeout(() => setMessage(null), 5000);
    },
  });

  // Delete mutation
  const deleteBinder = trpc.binder.delete.useMutation({
    onSuccess: async () => {
      setMessage("Binder deleted successfully");
      setDeleteModalOpen(false);
      setBinderToDelete(null);
      setDeleteConfirmText("");
      await utils.binder.list.invalidate();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: err => {
      setMessage(`Error: ${err.message}`);
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    if (["personal", "trade", "sale"].includes(value)) {
      setType(value as "personal" | "trade" | "sale");
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    if (["personal", "trade", "sale"].includes(value)) {
      setEditType(value as "personal" | "trade" | "sale");
    }
  };

  const handleEdit = (binder: Binder) => {
    setEditingBinderId(binder.id);
    setEditName(binder.name);
    setEditDescription(binder.description || "");
    setEditType(binder.type as "personal" | "trade" | "sale");
    setEditIsPublic(binder.is_public);
    setOpenMenuId(null);
  };

  const handleCancelEdit = () => {
    setEditingBinderId(null);
    setEditName("");
    setEditDescription("");
    setEditType("personal");
    setEditIsPublic(false);
  };

  const openDeleteModal = (binderId: string, binderName: string) => {
    setBinderToDelete({ id: binderId, name: binderName });
    setDeleteModalOpen(true);
    setDeleteConfirmText("");
    setOpenMenuId(null);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setBinderToDelete(null);
    setDeleteConfirmText("");
  };

  const confirmDelete = () => {
    if (binderToDelete && deleteConfirmText === binderToDelete.name) {
      deleteBinder.mutate({ id: binderToDelete.id });
    }
  };

  const toggleMenu = (binderId: string) => {
    setOpenMenuId(openMenuId === binderId ? null : binderId);
  };

  if (binderLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="mr-4">Loading Binders</p>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto min-h-screen space-y-10 bg-gradient-to-b from-zinc-950 via-slate-900 to-black p-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      <header className="relative space-y-2">
        <h1 className="text-4xl font-extrabold tracking-wide">My Binders</h1>
        <p className="max-w-xl text-slate-400">
          Ancient tomes holding your collection, trades, and prized relics.
        </p>
      </header>

      {/* Global message */}
      {message && (
        <div className="fixed top-4 right-4 z-50 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 shadow-xl">
          <p className="text-sm text-slate-200">{message}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
              You are about to delete{" "}
              <span className="font-semibold text-white">
                &quot;{binderToDelete?.name}&quot;
              </span>
              . Your cards will be preserved but removed from this binder.
            </p>

            <p className="mb-2 text-sm text-slate-400">
              Type the binder name{" "}
              <span className="font-mono text-white">
                &quot;{binderToDelete?.name}&quot;
              </span>{" "}
              to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:outline-none"
              placeholder="Enter binder name"
              autoFocus
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-300 transition hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={
                  deleteConfirmText !== binderToDelete.name ||
                  deleteBinder.isPending
                }
                className="flex-1 rounded-md bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteBinder.isPending ? "Deleting..." : "Delete Binder"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Binder Library */}
        <section className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listBinder?.binders?.map(binder => (
              <div
                key={binder.id}
                className="group relative rounded-xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur transition hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                {/* Menu Toggle Button */}
                <button
                  onClick={() => toggleMenu(binder.id)}
                  className="absolute top-3 right-3 z-10 rounded-md border border-slate-600/50 bg-slate-800/80 p-1.5 text-slate-300 shadow-lg backdrop-blur transition hover:border-slate-500 hover:bg-slate-700 hover:text-white"
                >
                  <svg
                    className="h-5 w-5"
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
                  <div className="absolute top-12 right-3 z-10 w-40 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
                    <button
                      onClick={() => handleEdit(binder)}
                      className="flex w-full items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(binder.id, binder.name)}
                      className="flex w-full items-center gap-2 rounded-b-lg px-4 py-2.5 text-sm text-red-400 transition hover:bg-slate-800"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="pr-8 text-lg font-semibold tracking-wide">
                    {binder.name}
                  </p>

                  {binder.description && (
                    <p className="line-clamp-2 text-sm text-slate-400">
                      {binder.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 tracking-widest uppercase">
                    <span>{binder.type}</span>

                    <div className="group/tooltip relative">
                      {binder.is_public ? (
                        <svg
                          className="h-4 w-4 cursor-help text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4 cursor-help text-amber-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      )}

                      <div
                        ref={tooltipRef}
                        className="pointer-events-none fixed z-[10] w-64 max-w-[90vw] translate-y-1 opacity-0 transition-all duration-150 group-hover/tooltip:translate-y-0 group-hover/tooltip:opacity-100"
                        style={{ bottom: pos.bot, left: pos.left }}
                      >
                        <div className="mx-auto -mb-1 h-2 w-2 rotate-45 border-t border-l border-slate-600 bg-slate-950" />
                        <div className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                          {binder.is_public ? (
                            <>
                              <p className="font-semibold text-emerald-400">
                                Public Binder
                              </p>
                              <p className="mt-1">
                                Visible to other users. Cards can be viewed and
                                shared, but not modified.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-400">
                                Private Binder
                              </p>
                              <p className="mt-1">
                                Only you can see this binder. Ideal for drafts,
                                planning, or hidden trades.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <span>{binder.card_count} cards</span>
                </div>

                <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </section>
        </section>

        {/* Create/Edit Binder Panel */}
        <aside className="h-fit lg:sticky lg:top-8">
          {editingBinderId ? (
            // Edit Form
            <div className="relative max-w-md space-y-5 rounded-xl border border-amber-600/60 bg-slate-900/70 p-6 shadow-[0_0_0_1px_rgba(251,191,36,0.2),0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-wide text-amber-400">
                  Edit Binder
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Binder Name
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                  placeholder="e.g. Dimir Control Vault"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Inscription
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                  placeholder="Notes, strategy, or lore..."
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Binder Purpose
                </label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-amber-600/50 focus:outline-none"
                  value={editType}
                  onChange={handleEditChange}
                >
                  <option value="personal">Personal Collection</option>
                  <option value="trade">Trade Arsenal</option>
                  <option value="sale">Merchant Stock</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={e => setEditIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-black/40"
                />
                Reveal binder to other planeswalkers
              </label>

              <button
                onClick={e => {
                  e.preventDefault();
                  if (!editingBinderId) return;
                  updateBinder.mutate({
                    id: editingBinderId,
                    name: editName,
                    description: editDescription || undefined,
                    type: editType,
                    isPublic: editIsPublic,
                  });
                }}
                disabled={updateBinder.isPending}
                className="relative w-full rounded-md bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 font-semibold tracking-wide shadow-lg shadow-amber-600/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {updateBinder.isPending ? "Updating..." : "Update Binder"}
              </button>
            </div>
          ) : (
            // Create Form
            <div className="relative max-w-md space-y-5 rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur">
              <h2 className="text-lg font-semibold tracking-wide">
                Create a New Binder
              </h2>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Binder Name
                </label>
                <input
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                  placeholder="e.g. Dimir Control Vault"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Inscription
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                  placeholder="Notes, strategy, or lore..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs tracking-widest text-slate-400 uppercase">
                  Binder Purpose
                </label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-black/40 px-3 py-2 focus:ring-2 focus:ring-blue-600/50 focus:outline-none"
                  value={type}
                  onChange={handleChange}
                >
                  <option value="personal">Personal Collection</option>
                  <option value="trade">Trade Arsenal</option>
                  <option value="sale">Merchant Stock</option>
                </select>
              </div>

              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-black/40"
                />
                Reveal binder to other planeswalkers
              </label>

              <div className="text-center text-xs text-slate-400">
                {binderCount} / {maxBinders} binders used
              </div>

              <button
                onClick={e => {
                  e.preventDefault();
                  if (!canCreateBinder) {
                    setMessage(
                      `Binder limit reached (${binderCount}/${maxBinders})`
                    );
                    return;
                  }
                  createBinder.mutate({
                    name,
                    description: description || undefined,
                    type,
                    isPublic,
                  });
                }}
                disabled={createBinder.isPending || !canCreateBinder}
                className="relative w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold tracking-wide shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-50"
              >
                {createBinder.isPending
                  ? "Inscribing..."
                  : canCreateBinder
                    ? "Bind the Tome"
                    : "Binder Limit Reached"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
