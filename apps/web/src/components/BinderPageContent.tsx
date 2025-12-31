import { trpc } from '@/src/utils/trpc';
import React, { useRef, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function BinderPageContent() {
  // Ok lets add, add to binder
  const { data: session, status } = useSession();
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [type, setType] = useState<'personal' | 'trade' | 'sale'>('personal');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [message, setMessage] = useState<null | string>(null);
  const {
    data: listBinder,
    isLoading: binderLoading,
    refetch,
    error,
  } = trpc.binder.list.useQuery(undefined, {
    enabled: status === 'authenticated',
  });
  const utils = trpc.useUtils();

  // Tooltip component
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const [pos, setPos] = useState({ bot: 0, left: 0 });

  const showTooltip = () => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const t = trigger.getBoundingClientRect();
    const tt = tooltip.getBoundingClientRect();

    const padding = 8;

    let left = t.left + t.width / 2 - tt.width / 2;
    left = Math.max(padding, Math.min(left, window.innerWidth - tt.width - padding));

    const bot = t.bottom + 4;

    setPos({ bot, left });
  };

  // Binder creation constraints
  const maxBinders = listBinder?.limits?.maxBinders ?? 0;
  const binderCount = listBinder?.limits?.binderCount ?? 0;
  const canCreateBinder = listBinder?.limits?.canCreateBinder ?? false;

  const createBinder = trpc.binder.create.useMutation({
    onSuccess: async () => {
      setMessage('Binder created successfully');
      setName('');
      setDescription('');
      await utils.binder.list.invalidate();
    },
    onError: (err) => {
      console.log(`Current error is ${err}`);
    },
  });

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="mr-4">Loading Binders</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen mx-auto bg-gradient-to-b from-zinc-950 via-slate-900 to-black p-8 space-y-10 text-slate-100">
      {/* Subtle texture / glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_60%)]" />

      {/* Header */}
      <header className="relative space-y-2">
        <h1 className="text-4xl font-extrabold tracking-wide">My Binders</h1>
        <p className="text-slate-400 max-w-xl">
          Ancient tomes holding your collection, trades, and prized relics.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Binder Library */}
        <section className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listBinder?.binders?.map((binder) => (
              <div
                key={binder.id}
                className="group relative rounded-xl border border-slate-700/60 bg-slate-900/60 p-5 backdrop-blur transition hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]"
              >
                <div className="space-y-1">
                  <p className="text-lg font-semibold tracking-wide">{binder.name}</p>

                  {binder.description && (
                    <p className="text-sm text-slate-400 line-clamp-2">{binder.description}</p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2 uppercase tracking-widest">
                    <span>{binder.type}</span>

                    {/* Visibility Status */}
                    <div className="relative group">
                      {binder.is_public ? (
                        <svg
                          className="h-4 w-4 text-emerald-400 cursor-help"
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
                          className="h-4 w-4 text-amber-400 cursor-help"
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
                        className="pointer-events-none fixed z-[9999] w-64 max-w-[90vw] opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0"
                        style={{ bot: pos.bot, left: pos.left }}
                      >
                        <div className="mx-auto -mb-1 h-2 w-2 rotate-45 bg-slate-950 border-l border-t border-slate-600" />

                        <div className="rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs text-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
                          {binder.is_public ? (
                            <>
                              <p className="font-semibold text-emerald-400">Public Binder</p>
                              <p className="mt-1">
                                Visible to other users. Cards can be viewed and shared, but not
                                modified.
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold text-amber-400">Private Binder</p>
                              <p className="mt-1">
                                Only you can see this binder. Ideal for drafts, planning, or hidden
                                trades.
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
                <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)]" />
              </div>
            ))}
          </section>
        </section>

        {/* Create Binder Panel */}
        <aside className="lg:sticky lg:top-8 h-fit">
          <form
            onSubmit={handleCreateBinder}
            className="relative max-w-md rounded-xl border border-slate-700/60 bg-slate-900/70 backdrop-blur p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_20px_40px_rgba(0,0,0,0.6)] space-y-5"
          >
            <h2 className="text-lg font-semibold tracking-wide">Create a New Binder</h2>

            {/* Binder Name */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Binder Name
              </label>
              <input
                className="w-full rounded-md bg-black/40 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                placeholder="e.g. Dimir Control Vault"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Inscription
              </label>
              <textarea
                className="w-full rounded-md bg-black/40 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                placeholder="Notes, strategy, or lore..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Binder Type */}
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-widest text-slate-400">
                Binder Purpose
              </label>
              <select
                className="w-full rounded-md bg-black/40 border border-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
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
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-black/40"
              />
              Reveal binder to other planeswalkers
            </label>

            <div className="text-xs text-slate-400 text-center">
              {binderCount} / {maxBinders} binders used
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={createBinder.isPending || !canCreateBinder}
              className="relative w-full rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 font-semibold tracking-wide shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:opacity-50"
            >
              {createBinder.isPending
                ? 'Inscribing...'
                : canCreateBinder
                  ? 'Bind the Tome'
                  : 'Binder Limit Reached'}
            </button>

            {message && <p className="text-xs text-slate-400 text-center">{message}</p>}
          </form>
        </aside>
      </div>
    </div>
  );
}
