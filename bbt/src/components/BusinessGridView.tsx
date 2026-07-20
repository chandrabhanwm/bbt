import React from 'react';
import { Business } from '../types';
import { BusinessGridCard } from './BusinessGridCard';

interface BusinessGridViewProps {
  businesses: Business[];
  onSelectShop: (id: string) => void;
  /** Optional per-business photo URLs, keyed by business id — supplied
   *  later; any id without an entry falls back to the themed placeholder. */
  imageUrls?: Record<string, string>;
  readOnly?: boolean;
}

/**
 * Alternate "Grid" view of the exact same businesses a district has —
 * same data, same tap-to-open-detail-sheet contract as StreetView. Nothing
 * about buy/upgrade/collect logic lives here; tapping a card just calls
 * onSelectShop(id), identical to tapping a shop in the street view.
 */
export const BusinessGridView: React.FC<BusinessGridViewProps> = ({ businesses, onSelectShop, imageUrls, readOnly = false }) => {
  return (
    <div className="grid grid-cols-4 gap-2.5 items-start auto-rows-min overflow-y-auto no-scrollbar pb-2">
      {businesses.map((business, index) => (
        <BusinessGridCard
          key={business.id}
          business={business}
          index={index}
          imageUrl={imageUrls?.[business.id]}
          onSelect={readOnly ? () => {} : onSelectShop}
        />
      ))}
    </div>
  );
};
