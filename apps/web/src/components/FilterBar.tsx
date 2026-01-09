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
    {
      code: 'W',
      label: t('colorWhite'),
      color: 'bg-[#f9faf4] border-[#d3d3d3] text-[#a09050]',
    },
    {
      code: 'U',
      label: t('colorBlue'),
      color: 'bg-[#e1f5fe] border-[#29b6f6] text-[#0277bd]',
    },
    {
      code: 'B',
      label: t('colorBlack'),
      color: 'bg-[#eceff1] border-[#455a64] text-[#263238]',
    },
    {
      code: 'R',
      label: t('colorRed'),
      color: 'bg-[#ffebee] border-[#ef5350] text-[#c62828]',
    },
    {
      code: 'G',
      label: t('colorGreen'),
      color: 'bg-[#e8f5e9] border-[#66bb6a] text-[#2e7d32]',
    },
  ];

  return (
    <div className="relative z-40 w-full border-b border-white/20 bg-white/10 py-4 shadow-lg backdrop-blur-xl md:sticky md:top-20 dark:border-white/5 dark:bg-slate-900/40">
      <div className="container-default">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:flex md:w-auto md:flex-row">
            {/* Sets Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[12px] font-black tracking-widest text-slate-800 uppercase dark:text-slate-500">
                {t('expansionSet')}
              </label>
              <select
                className="min-w-[180px] cursor-pointer appearance-none rounded-2xl border border-slate-200/60 bg-white/50 px-4 py-2 text-xs font-bold shadow-sm transition-all outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200"
                value={setCode}
                onChange={e => setSetCode(e.target.value)}
              >
                <option value="">{t('allSets')}</option>
                {sets?.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="ml-1 text-[12px] font-black tracking-widest text-slate-800 uppercase dark:text-slate-500">
                {t('rarity')}
              </label>
              <select
                className="w-full cursor-pointer appearance-none rounded-2xl border border-slate-200/60 bg-white/50 px-4 py-2 text-xs font-bold shadow-sm transition-all outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-200"
                value={rarity}
                onChange={e => setRarity(e.target.value)}
              >
                <option value="">{t('allRarities')}</option>
                <option value="common">{t('rarityCommon')}</option>
                <option value="uncommon">{t('rarityUncommon')}</option>
                <option value="rare">{t('rarityRare')}</option>
                <option value="mythic">{t('rarityMythic')}</option>
              </select>
            </div>
          </div>

          <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center md:w-auto">
            {/* Color Filter */}
            <div className="flex w-full flex-col gap-1.5 sm:w-auto">
              <label className="ml-1 text-[12px] font-black tracking-widest text-slate-800 uppercase dark:text-slate-500">
                {t('colors')}
              </label>
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {colorMap.map(c => (
                  <button
                    key={c.code}
                    onClick={() => toggleColor(c.code)}
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border text-[12px] font-black shadow-sm transition-all active:scale-90 ${
                      selectedColors.includes(c.code)
                        ? `${c.color} scale-105 border-current ring-4 ring-current/10`
                        : 'border-slate-200/60 bg-white/50 text-slate-800 hover:border-slate-300 hover:bg-white dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:bg-slate-800'
                    }`}
                    title={c.label}
                  >
                    {c.code}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="flex w-full flex-1 flex-col gap-1.5 sm:w-auto md:items-end">
              <label className="text-[12px] font-black tracking-widest text-slate-800 uppercase sm:mr-1 dark:text-slate-500">
                {t('sort')}
              </label>
              <div className="flex w-full rounded-2xl border border-slate-200/60 bg-slate-100/50 p-1 shadow-inner sm:w-auto dark:border-slate-800/60 dark:bg-slate-950/30">
                <button
                  onClick={() => toggleSort('name')}
                  className={`flex-1 rounded-2xl px-4 py-1.5 text-[12px] font-black transition-all sm:flex-none ${
                    orderBy === 'name'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t('sortName')}{' '}
                  {orderBy === 'name' && (orderDir === 'ASC' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => toggleSort('price_usd')}
                  className={`flex-1 rounded-2xl px-4 py-1.5 text-[12px] font-black transition-all sm:flex-none ${
                    orderBy === 'price_usd'
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800 dark:text-blue-400 dark:ring-slate-700/50'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {t('sortPrice')}{' '}
                  {orderBy === 'price_usd' && (orderDir === 'ASC' ? '↑' : '↓')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
