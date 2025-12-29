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
    <div className="md:sticky md:top-20 z-40 w-full bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 py-4 shadow-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-row gap-6 w-full md:w-auto">
            {/* Sets Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                {t('expansionSet')}
              </label>
              <select
                className="px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 dark:text-slate-200 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm min-w-[180px] appearance-none cursor-pointer"
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
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                {t('rarity')}
              </label>
              <select
                className="px-4 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 dark:text-slate-200 text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all shadow-sm appearance-none cursor-pointer w-full"
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
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto">
            {/* Color Filter */}
            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                {t('colors')}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                {colorMap.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => toggleColor(c.code)}
                    className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center font-black text-[10px] shadow-sm active:scale-90 flex-shrink-0 ${
                      selectedColors.includes(c.code)
                        ? `${c.color} scale-105 border-current ring-4 ring-current/10`
                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                    }`}
                    title={c.label}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="flex flex-col gap-1.5 flex-1 md:items-end w-full sm:w-auto">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest sm:mr-1">
                {t('sort')}
              </label>
              <div className="flex p-1 bg-slate-100/50 dark:bg-slate-950/30 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner w-full sm:w-auto">
                <button
                  onClick={() => toggleSort('name')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    orderBy === 'name'
                      ? 'bg-white dark:bg-slate-800 dark:text-blue-400 text-blue-600 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t('sortName')} {orderBy === 'name' && (orderDir === 'ASC' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('price_usd')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                    orderBy === 'price_usd'
                      ? 'bg-white dark:bg-slate-800 dark:text-blue-400 text-blue-600 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t('sortPrice')} {orderBy === 'price_usd' && (orderDir === 'ASC' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
