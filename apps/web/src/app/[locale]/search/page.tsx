"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/src/utils/trpc";
import { useTranslation } from "react-i18next";
import { FilterBar } from "@/src/components/FilterBar";
import { Library, Star } from "lucide-react";
import Image from "next/image";
import { useSearch } from "@/src/context/SearchContext";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const { t } = useTranslation(["common"]);
  const { query, setTotalMatches } = useSearch();
  const router = useRouter();
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rarity, setRarity] = useState<string>("");
  const [setCode, setSetCode] = useState<string>("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // State for sorting
  const [orderBy, setOrderBy] = useState<"name" | "price_usd">("name");
  const [orderDir, setOrderDir] = useState<"ASC" | "DESC">("ASC");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  const sets = trpc.card.listSets.useQuery();
  const latestSet = trpc.card.getLatestSet.useQuery();

  // Set default set to latest if no search/set is selected
  const effectiveSetCode =
    !setCode && !query && !rarity && selectedColors.length === 0
      ? latestSet.data?.code
      : setCode;

  const { data, isLoading, isFetching } = trpc.card.search.useQuery(
    {
      query: debouncedSearch || undefined,
      set_code: effectiveSetCode || undefined,
      rarity: rarity || undefined,
      colors: selectedColors,
      orderBy,
      orderDir,
      page,
    },
    {
      enabled: !!latestSet.data || !!setCode || !!debouncedSearch,
      placeholderData: prev => prev,
    }
  );

  // Sync total matches to context for Navbar to display
  useEffect(() => {
    if (data?.totalCount !== undefined) {
      setTotalMatches(data.totalCount);
    }
  }, [data?.totalCount, setTotalMatches]);

  const toggleColor = (c: string) => {
    setSelectedColors(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    );
    setPage(1);
  };

  const toggleSort = (field: "name" | "price_usd") => {
    if (orderBy === field) {
      setOrderDir(orderDir === "ASC" ? "DESC" : "ASC");
    } else {
      setOrderBy(field);
      setOrderDir(field === "price_usd" ? "DESC" : "ASC");
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <FilterBar
        rarity={rarity}
        setRarity={val => {
          setRarity(val);
          setPage(1);
        }}
        setCode={setCode}
        setSetCode={val => {
          setSetCode(val);
          setPage(1);
        }}
        sets={sets.data}
        selectedColors={selectedColors}
        toggleColor={toggleColor}
        orderBy={orderBy}
        orderDir={orderDir}
        toggleSort={toggleSort}
      />

      <main className="container-default py-6 md:py-12">
        {/* Latest Set Indicator */}
        {!debouncedSearch && setCode === latestSet.data?.code && (
          <div className="mb-8 flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <h2 className="text-xs font-black tracking-[0.2em] text-slate-400 uppercase dark:text-slate-500">
              Latest Release:{" "}
              <span className="ml-1 text-slate-900 dark:text-white">
                {latestSet.data?.name}
              </span>
            </h2>
          </div>
        )}

        {/* Card Grid */}
        <div
          className={`grid grid-cols-2 gap-6 transition-opacity duration-300 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${isFetching ? "opacity-40" : "opacity-100"}`}
        >
          {data?.cards.map(card => (
            <div
              onClick={() => router.push(`/cards/${card.id}`)}
              key={card.id}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-blue-500/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.15)] dark:border-slate-800/60 dark:bg-slate-900/40"
            >
              <div className="relative aspect-[2.5/3.5] overflow-hidden bg-slate-100/50 dark:bg-slate-950">
                {" "}
                {card.image_uri_normal ? (
                  <Image
                    fill
                    src={card.image_uri_normal}
                    alt={card.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center font-bold tracking-tighter text-slate-400 uppercase">
                    {card.name}
                  </div>
                )}
                {/* Card Badges */}
                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                  {card.rarity === "mythic" && (
                    <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
                      {t("mythic")}
                    </span>
                  )}
                  {card.rarity === "rare" && (
                    <span className="rounded-full bg-yellow-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
                      {t("rarityRare")}
                    </span>
                  )}
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="w-full translate-y-2 transform truncate text-[10px] font-black tracking-widest text-white uppercase transition-transform duration-300 group-hover:translate-y-0">
                    {card.set_name}
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col space-y-3 bg-gradient-to-b from-white/40 to-white/80 p-4 backdrop-blur-md dark:bg-slate-900/50 dark:from-transparent dark:to-transparent">
                <div className="space-y-1">
                  <h3
                    className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400"
                    title={card.name}
                  >
                    {card.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-slate-200/50 px-1.5 py-0.5 text-[10px] font-black text-slate-500 uppercase dark:bg-slate-800/80 dark:text-slate-500">
                      {card.set_code}
                    </span>
                    <p className="truncate text-[10px] font-bold tracking-tighter text-slate-500 uppercase dark:text-slate-400">
                      {card.set_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100/50 pt-2 dark:border-slate-800/50">
                  <span className="text-base font-black tracking-tight text-blue-600 dark:text-blue-400">
                    {card.price_usd ? `$${card.price_usd.toFixed(2)}` : "—"}
                  </span>
                </div>

                {/* Card Options Row */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    title="Add to Binder"
                    className="/* Light Mode: Vibrant Blue Glass */ /* Dark Mode: Electric Blue Glow */ flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/20 text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-blue-500/40 active:scale-95 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
                    onClick={e => {
                      e.stopPropagation();
                      console.log("Add to Binder:", card.id);
                    }}
                  >
                    <Library className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-black tracking-wider uppercase">
                      Binder
                    </span>
                  </button>

                  <button
                    title="Add to Wishlist"
                    className="/* Glass Base: Light tint of amber/white */ /* Shadow and Glow */ /* Interaction */ flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/20 shadow-lg shadow-black/5 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-yellow-400/50 hover:bg-yellow-400/20 active:scale-90 dark:border-white/10 dark:bg-white/5 dark:hover:border-yellow-500/30 dark:hover:bg-yellow-500/10"
                    onClick={e => {
                      e.stopPropagation();
                      console.log("Add to Wishlist:", card.id);
                    }}
                  >
                    <Star className="h-3.5 w-3.5 fill-current text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            <p className="animate-pulse font-black tracking-widest text-slate-400 uppercase">
              {t("searching")}
            </p>
          </div>
        )}

        {debouncedSearch.length >= 3 && data?.cards.length === 0 && (
          <p className="py-10 text-center text-gray-500 dark:text-slate-400">
            {`${t("noResults")} ${debouncedSearch}`}
          </p>
        )}

        {/* Pagination Controls */}
        {data && data.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border px-4 py-2 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
            >
              {t("previous")}
            </button>
            <span className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
              {t("pageOf", { page, total: data.totalPages })}
            </span>
            <button
              disabled={page === data.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border px-4 py-2 transition-colors hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
            >
              {t("next")}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
