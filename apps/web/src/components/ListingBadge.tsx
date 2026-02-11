'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface ListingBadgeProps {
  price: number;
  status?: 'active' | 'sold' | 'cancelled';
}

export function ListingBadge({ price, status = 'active' }: ListingBadgeProps) {
  const { t } = useTranslation();
  if (status === 'sold') {
    return (
      <div className="absolute top-2 left-2 z-10">
        <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
          {t('listingBadge.sold')}
        </span>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="absolute top-2 left-2 z-10">
        <span className="rounded-full bg-gray-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
          {t('listingBadge.cancelled')}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute top-2 left-2 z-10">
      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
        {t('listingBadge.listed', { price: price.toFixed(2) })}
      </span>
    </div>
  );
}
