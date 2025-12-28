'use client';

import { useTranslation } from 'react-i18next';

interface FilterBarProps {
  rarity: string;
  setRarity: (value: string) => void;
  setCode: string;
  setSetCode: (value: string) => void;
  sets: readonly { code: string; name: string }[] | undefined;
  selectedColors: string[];
  toggleColor: (color: string) => void;
  orderBy: 'name' | 'price_usd';
  orderDir: 'ASC' | 'DESC';
  toggleSort: (field: 'name' | 'price_usd') => void;
}

export function FilterBar({
  rarity,
  setRarity,
  setCode,
  setSetCode,
  sets,
  selectedColors,
  toggleColor,
  orderBy,
  orderDir,
  toggleSort,
}: FilterBarProps) {
  const { t } = useTranslation(['common']);

  const colorMap = [
    { code: 'W', label: t('colorWhite'), color: 'bg-[#f9faf4] border-[#d3d3d3] text-[#a09050]' },
    { code: 'U', label: t('colorBlue'), color: 'bg-[#e1f5fe] border-[#29b6f6] text-[#0277bd]' },
    { code: 'B', label: t('colorBlack'), color: 'bg-[#eceff1] border-[#455a64] text-[#263238]' },
    { code: 'R', label: t('colorRed'), color: 'bg-[#ffebee] border-[#ef5350] text-[#c62828]' },
    { code: 'G', label: t('colorGreen'), color: 'bg-[#e8f5e9] border-[#66bb6a] text-[#2e7d32]' },
  ];

  return (
    <div className="sticky top-20 z-40 w-full bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 md:gap-8">
          {/* Sets Filter */}
          <div className="flex items-center gap-2">
            <label className="hidden lg:block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              {t('expansionSet')}
            </label>
            <select
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[140px]"
              value={setCode}
              onChange={(e) => setSetCode(e.target.value)}
            >
              <option value="">{t('allSets')}</option>
              {sets?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rarity Filter */}
          <div className="flex items-center gap-2">
            <label className="hidden lg:block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              Rarity
            </label>
            <select
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
            >
              <option value="">{t('allRarities')}</option>
              <option value="common">{t('rarityCommon')}</option>
              <option value="uncommon">{t('rarityUncommon')}</option>
              <option value="rare">{t('rarityRare')}</option>
              <option value="mythic">{t('rarityMythic')}</option>
            </select>
          </div>

          {/* Color Filter */}
          <div className="flex items-center gap-2">
            <label className="hidden lg:block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              Colors
            </label>
            <div className="flex gap-1.5">
              {colorMap.map((c) => (
                <button
                  key={c.code}
                  onClick={() => toggleColor(c.code)}
                  className={`w-8 h-8 rounded-lg border transition-all flex items-center justify-center font-black text-[10px] shadow-sm ${
                    selectedColors.includes(c.code)
                      ? `${c.color} scale-105 border-current`
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  title={c.label}
                >
                  {c.code}
                </button>
              ))}
            </div>
          </div>

          {/* Sorting */}
          <div className="flex-1 flex justify-end items-center gap-2">
            <label className="hidden lg:block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
              Sort
            </label>
            <div className="flex p-0.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <button
                onClick={() => toggleSort('name')}
                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                  orderBy === 'name'
                    ? 'bg-slate-900 dark:bg-slate-200 dark:text-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t('sortName')} {orderBy === 'name' && (orderDir === 'ASC' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => toggleSort('price_usd')}
                className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${
                  orderBy === 'price_usd'
                    ? 'bg-slate-900 dark:bg-slate-200 dark:text-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {t('sortPrice')} {orderBy === 'price_usd' && (orderDir === 'ASC' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
