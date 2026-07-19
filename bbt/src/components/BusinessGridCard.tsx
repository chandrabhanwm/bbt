import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Business } from '../types';
import { getBusinessCategory } from '../data/businessCategoryPresentation';
import { CoinIcon } from './CoinIcon';
import { playClick } from '../utils/audio';

interface BusinessGridCardProps {
  business: Business;
  /** Optional real photo, supplied later — falls back to a themed gradient
   *  + emoji placeholder when not provided, so nothing breaks or looks
   *  broken before real images are wired in. */
  imageUrl?: string;
  onSelect: (id: string) => void;
}

export const BusinessGridCard: React.FC<BusinessGridCardProps> = ({ business, imageUrl, onSelect }) => {
  const category = getBusinessCategory(business.id);
  const isOwned = business.level > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => { playClick(); onSelect(business.id); }}
      className="relative flex flex-col rounded-[14px] overflow-hidden text-left cursor-pointer"
      style={{
        backgroundColor: '#131110',
        border: '1.5px solid rgba(212,167,44,0.35)',
      }}
    >
      {/* Image region */}
      <div className="relative w-full h-[92px]">
        {imageUrl ? (
          <img src={imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${business.themeColor}33, #131110)` }}
          >
            <span className="text-3xl opacity-80">{business.emoji}</span>
          </div>
        )}

        {/* Category badge, top-left */}
        <span
          className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[5px] text-[7px] font-bold tracking-wide"
          style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
        >
          {category.label}
        </span>
      </div>

      {/* Content region */}
      <div className="px-2 py-2 flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-white truncate leading-tight">
          {business.name}
        </span>

        {isOwned ? (
          <span
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold text-white"
            style={{ backgroundColor: '#16A34A' }}
          >
            LEVEL {business.level}
          </span>
        ) : (
          <span
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold text-white flex items-center gap-1"
            style={{ backgroundColor: '#2563EB' }}
          >
            ₹{formatShort(business.cost)}
          </span>
        )}

        <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#22C55E' }}>
          <CoinIcon className="w-2.5 h-2.5" />
          ₹{Math.round(isOwned ? business.profitPerMin : business.baseProfitPerMin)} /min
        </span>
      </div>
    </motion.button>
  );
};

/** Compact "₹20K" style formatting for the price badge, matching the reference. */
function formatShort(value: number): string {
  if (value >= 100000) return `${Math.round(value / 100000)}L`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${value}`;
}

/** Locked-lower-tier "not yet reachable" card variant — structurally ready
 *  for a future district/slot that needs it, not triggered by any current
 *  Badeban data (every current business is either owned or buy-now). */
export const BusinessGridCardComingSoon: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div
      className="relative flex flex-col rounded-[14px] overflow-hidden"
      style={{ backgroundColor: '#131110', border: '1.5px solid rgba(120,120,124,0.35)' }}
    >
      <div className="relative w-full h-[92px] flex items-center justify-center" style={{ backgroundColor: '#1C1B1A' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2A2826' }}>
          <Lock size={16} color="#8A8783" />
        </div>
        <span className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[5px] text-[7px] font-bold tracking-wide" style={{ backgroundColor: 'rgba(75,85,99,0.92)', color: '#D6D3CF' }}>
          REAL ESTATE
        </span>
      </div>
      <div className="px-2 py-2 flex flex-col gap-1">
        <span className="text-[11px] font-semibold truncate" style={{ color: '#B8B5B1' }}>{name}</span>
        <span className="text-[9px] font-semibold" style={{ color: '#8A8783' }}>COMING SOON</span>
        <span className="w-fit px-2 py-[3px] rounded-[6px] text-[8px] font-semibold" style={{ backgroundColor: '#2A2826', color: '#8A8783' }}>
          Unlock to build
        </span>
      </div>
    </div>
  );
};
