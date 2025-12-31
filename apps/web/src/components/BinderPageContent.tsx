import { trpc } from "@/src/utils/trpc";
import React, { useRef, useState } from "react";
import { useSession } from "next-auth/react";

export default function BinderPageContent() {
  // Ok lets add, add to binder
  const { status } = useSession();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [type, setType] = useState<"personal" | "trade" | "sale">("personal");
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [message, setMessage] = useState<null | string>(null);
  const { data: listBinder, isLoading: binderLoading } =
    trpc.binder.list.useQuery(undefined, {
      enabled: status === "authenticated",
    });
  const utils = trpc.useUtils();

  // Tooltip component
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [pos] = useState({ bot: -90, left: 0 });

  // Binder creation constraints
  const maxBinders = listBinder?.limits?.maxBinders ?? 0;
  const binderCount = listBinder?.limits?.binderCount ?? 0;
  const canCreateBinder = listBinder?.limits?.canCreateBinder ?? false;

  const createBinder = trpc.binder.create.useMutation({
    onSuccess: async () => {
      setMessage("Binder created successfully");
      setName("");
      setDescription("");
      await utils.binder.list.invalidate();
    },
    onError: err => {
      console.log(`Current error is ${err}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as string;
    if (["personal", "trade", "sale"].includes(value)) {
      setType(value as "personal" | "trade" | "sale");
    } else {
      // Handle the case where the input is not valid
      console.warn("Invalid type selected:", value);
    }
  };

  // Create binder handler
  const handleCreateBinder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canCreateBinder) {
      setMessage(`Binder limit reached (${binderCount}/${maxBinders})`);
      return;
    }

    createBinder.mutate({
      name,
      description: description || undefined,
      type,
      isPublic,
    });
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
      {/* Subtle texture / glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      {/* Header */}
      <header className="relative space-y-2">
        <h1 className="text-4xl font-extrabold tracking-wide">My Binders</h1>
        <p className="max-w-xl text-slate-400">
          Ancient tomes holding your collection, trades, and prized relics.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Binder Library */}
        <section className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listBinder?.binders?.map(binder => (
              <div
                key={binder.id}
                className="group relative rounded-xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur transition hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <div className="space-y-1">
                  <p className="text-lg font-semibold tracking-wide">
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

                    {/* Visibility Status */}
                    <div className="group relative">
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

                      {/* Tooltip */}
                      <div
                        ref={tooltipRef}
                        className="pointer-events-none fixed z-[10] w-64 max-w-[90vw] translate-y-1 opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
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

                {/* Glow on hover */}
                <div className="pointer-events-none absolute inset-0 rounded-xl bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)] opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </section>
        </section>

        {/* Create Binder Panel */}
        <aside className="h-fit lg:sticky lg:top-8">
          <form
            onSubmit={handleCreateBinder}
            className="relative max-w-md space-y-5 rounded-xl border border-slate-700/60 bg-slate-900/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <h2 className="text-lg font-semibold tracking-wide">
              Create a New Binder
            </h2>

            {/* Binder Name */}
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

            {/* Description */}
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

            {/* Binder Type */}
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

            {/* Public Toggle */}
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

            {/* CTA */}
            <button
              type="submit"
              disabled={createBinder.isPending || !canCreateBinder}
              className="relative w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold tracking-wide shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {createBinder.isPending
                ? "Inscribing..."
                : canCreateBinder
                  ? "Bind the Tome"
                  : "Binder Limit Reached"}
            </button>

            {message && (
              <p className="text-center text-xs text-slate-400">{message}</p>
            )}
          </form>
        </aside>
      </div>
    </div>
  );
}
