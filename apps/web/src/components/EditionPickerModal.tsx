'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { trpc } from '@/src/utils/trpc';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface EditionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  oracleId: string;
  cardName: string;
  onSelectPrinting: (printingId: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: 'bg-slate-500',
  uncommon: 'bg-slate-400',
  rare: 'bg-amber-500',
  mythic: 'bg-orange-500',
};

export function EditionPickerModal({
  isOpen,
  onClose,
  oracleId,
  cardName,
  onSelectPrinting,
}: EditionPickerModalProps) {
  const { t } = useTranslation();
  const [selectedPrintingId, setSelectedPrintingId] = useState<string | null>(
    null
  );
  const [sortBy, setSortBy] = useState<
    'released_at' | 'price_usd' | 'set_name'
  >('released_at');

  const { data: printings, isLoading } =
    trpc.card.getPrintingsForDesign.useQuery(
      { oracleId, sortBy, sortDir: 'DESC' },
      { enabled: isOpen }
    );

  const handleConfirm = () => {
    if (selectedPrintingId) {
      onSelectPrinting(selectedPrintingId);
      onClose();
      setSelectedPrintingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-white/40 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 p-6 dark:border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('modal.editionPicker.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {t('modal.editionPicker.chooseEdition', { cardName })}
          </p>

          {/* Sort options */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setSortBy('released_at')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                sortBy === 'released_at'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {t('modal.editionPicker.sortNewest')}
            </button>
            <button
              onClick={() => setSortBy('price_usd')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                sortBy === 'price_usd'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {t('modal.editionPicker.sortPrice')}
            </button>
            <button
              onClick={() => setSortBy('set_name')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                sortBy === 'set_name'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              {t('modal.editionPicker.sortSetName')}
            </button>
          </div>
        </div>

        {/* Printing list */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            </div>
          ) : printings && printings.length > 0 ? (
            <div className="grid gap-2">
              {printings.map(printing => (
                <button
                  key={printing.id}
                  onClick={() => setSelectedPrintingId(printing.id)}
                  className={`flex items-center gap-4 rounded-xl border p-3 text-left transition-all ${
                    selectedPrintingId === printing.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900'
                  }`}
                >
                  {/* Card image */}
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                    {printing.image_uri_normal ? (
                      <Image
                        src={printing.image_uri_normal}
                        alt={cardName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] font-bold text-slate-400">
                        MTG
                      </div>
                    )}
                  </div>

                  {/* Printing info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-600 uppercase dark:text-amber-400">
                        {printing.set_code}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full ${RARITY_COLORS[printing.rarity] || 'bg-slate-400'}`}
                      />
                      <span className="text-xs text-slate-500 capitalize dark:text-slate-400">
                        {printing.rarity}
                      </span>
                    </div>
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {printing.set_name}
                    </p>
                    {printing.released_at && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(printing.released_at).getFullYear()}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    {printing.price_usd ? (
                      <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                        ${printing.price_usd.toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">N/A</p>
                    )}
                  </div>

                  {/* Selected indicator */}
                  {selectedPrintingId === printing.id && (
                    <div className="flex-shrink-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950">
              <p className="text-slate-600 dark:text-slate-400">
                {t('modal.editionPicker.noPrintings')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedPrintingId}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-lg transition-all hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50"
            >
              {t('modal.editionPicker.addToBinder')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
