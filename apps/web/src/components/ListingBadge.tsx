import React from 'react';

interface ListingBadgeProps {
  price: number;
  status?: 'active' | 'sold' | 'cancelled';
}

export function ListingBadge({ price, status = 'active' }: ListingBadgeProps) {
  if (status === 'sold') {
    return (
      <div className="absolute top-2 left-2 z-10">
        <span className="rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
          Sold
        </span>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="absolute top-2 left-2 z-10">
        <span className="rounded-full bg-gray-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
          Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className="absolute top-2 left-2 z-10">
      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white uppercase shadow-lg ring-1 ring-white/20">
        Listed ${price.toFixed(2)}
      </span>
    </div>
  );
}
