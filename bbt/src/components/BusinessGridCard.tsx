import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
import { Business } from '../types';
import { getBusinessCategory } from '../data/businessCategoryPresentation';
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
      className="glossy-3d relative flex flex-col rounded-[14px] text-left cursor-pointer"
    >
      {/* Image region */}
      <div className="relative w-full h-[88px]">
        {imageUrl ? (
          <img src={imageUrl} alt={business.name} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${business.themeColor}44, var(--color-premium-surface))` }}
          >
            <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>{business.emoji}</span>
          </div>
        )}

        {/* Category badge, top-left — allowed to wrap to 2 lines for longer labels */}
        <span
          className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[5px] text-[7px] font-bold tracking-wide max-w-[64px] leading-tight"
          style={{ backgroundColor: category.badgeBg, color: category.badgeText }}
        >
          {category.label}
        </span>
      </div>

      {/* Content region */}
      <div className="px-2 py-1.5 flex flex-col gap-1">
        {/* Business name — reserves a fixed 2-line box so every card aligns
            identically regardless of whether a given name needs 1 or 2 lines.
            No ellipsis, no truncation, no hard line-cap — wraps naturally.
            Previously used -webkit-line-clamp + overflow:hidden here, which
            was confirmed (via a real iOS Safari screenshot) to sometimes
            clip the second line entirely on that engine even when 2 lines
            was enough — a hard-cutoff mechanism is exactly the wrong
            approach for a "must never truncate" requirement. Removed it;
            min-height alone gives the same alignment guarantee without any
            path to ever hiding real content, on any browser. */}
        <span
          className="font-semibold text-white"
          style={{
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '31px',
            display: 'block',
          }}
        >
          {business.name}
        </span>

        {isOwned ? (
          <span
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold text-white"
            style={{ backgroundColor: 'var(--color-premium-badge-green)' }}
          >
            LEVEL {business.level}
          </span>
        ) : (
          <span
            className="w-fit px-2 py-[2px] rounded-[5px] text-[9px] font-bold text-white flex items-center gap-1"
            style={{ backgroundColor: 'var(--color-premium-badge-blue)' }}
          >
            ₹{formatShort(business.cost)}
          </span>
        )}
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
      className="glossy-3d relative flex flex-col rounded-[14px]"
    >
      <div className="relative w-full h-[88px] flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-elevated)' }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-premium-track)' }}>
          <Lock size={16} color="var(--color-premium-text-secondary)" />
        </div>
        <span className="absolute top-1.5 left-1.5 px-1.5 py-[3px] rounded-[5px] text-[7px] font-bold tracking-wide max-w-[64px] leading-tight" style={{ backgroundColor: 'var(--color-premium-badge-gray)', color: 'var(--color-premium-text)' }}>
          REAL ESTATE
        </span>
      </div>
      <div className="px-2 py-1.5 flex flex-col gap-1">
        <span
          className="font-semibold"
          style={{
            fontSize: '13px',
            lineHeight: '1.2',
            minHeight: '31px',
            color: 'var(--color-premium-text-secondary)',
            display: 'block',
          }}
        >
          {name}
        </span>
        <span className="text-[9px] font-semibold" style={{ color: 'var(--color-premium-text-secondary)' }}>COMING SOON</span>
        <span className="w-fit px-2 py-[3px] rounded-[6px] text-[8px] font-semibold" style={{ backgroundColor: 'var(--color-premium-track)', color: 'var(--color-premium-text-secondary)' }}>
          Unlock to build
        </span>
      </div>
    </div>
  );
};
