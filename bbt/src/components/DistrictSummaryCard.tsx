import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { DistrictIconName } from '../data/cityMapData';
import { DistrictHeroBanner } from './DistrictHeroBanner';
import { CoinIcon } from './CoinIcon';
import { progressionConfig } from '../config/progressionConfig';
import { formatCash } from '../utils/formatCash';

interface DistrictSummaryCardProps {
  districtEmoji: string;
  districtName: string;
  districtIcon: DistrictIconName;
  /** Real district photography, supplied later. */
  bannerImageUrl?: string;
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  districtLevel: number;
  stars: number;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * The District Hero Card. Same data contract as before (fed by
 * getDistrictProgress() upstream) — presentation only.
 *
 * Note on "Next Level in X%": no separate "progress to next district
 * level" metric exists in the game's data model, and none was added —
 * this reuses completionPercent (the same value driving the progress bar)
 * rather than inventing a new calculation.
 */
export const DistrictSummaryCard: React.FC<DistrictSummaryCardProps> = React.memo(({
  districtEmoji,
  districtName,
  districtIcon,
  bannerImageUrl,
  income,
  businessesOwned,
  businessesTotal,
  completionPercent,
  districtLevel,
  stars,
}) => {
  const starSlots = useMemo(() => Array.from({ length: progressionConfig.maxStars }), []);

  return (
    <div className="glossy-3d relative rounded-2xl overflow-hidden">
      {/* Banner + overlaid name */}
      <div className="relative h-[104px]">
        <DistrictHeroBanner icon={districtIcon} imageUrl={bannerImageUrl} />

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[19px] font-bold text-white leading-none">
              {districtEmoji} {districtName.toUpperCase()}
            </h2>
            <span className="flex items-center gap-0.5 flex-shrink-0" aria-label={`${stars} of ${progressionConfig.maxStars} stars`}>
              {starSlots.map((_, i) => (
                <Star key={i} size={12} className={i < stars ? 'fill-current' : ''} color={i < stars ? GOLD : 'var(--color-premium-star-empty)'} />
              ))}
            </span>
          </div>
          <p className="text-[9px] font-bold tracking-wider mt-1" style={{ color: GOLD }}>
            YOUR CURRENT DISTRICT
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: 'var(--color-premium-border)' }} />

      {/* Stat row — 4 columns, dividers between */}
      <div className="grid grid-cols-4">
        <StatCell
          icon={<CoinIcon className="w-3 h-3" premium />}
          label="DISTRICT INCOME"
          value={`${formatCash(income)}/min`}
          valueColor={GREEN}
        />
        <StatCell
          icon={<span className="text-[10px]">🏬</span>}
          label="BUSINESSES OWNED"
          value={`${businessesOwned} / ${businessesTotal}`}
        />
        <StatCell
          icon={<span className="text-[10px]">🎯</span>}
          label="COMPLETION"
          value={`${completionPercent}%`}
        />
        <StatCell
          icon={<span className="text-[10px]">🏛️</span>}
          label="DISTRICT LEVEL"
          value={`${districtLevel}`}
          last
        />
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: 'var(--color-premium-border)' }} />

      {/* Progress bar — "Next Level in X%" sits inline on the same row now,
          instead of as its own line below it */}
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-premium-track)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GREEN }}
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
        <span className="text-[9px] font-medium whitespace-nowrap flex-shrink-0" style={{ color: TEXT_SECONDARY }}>
          Next Level in {completionPercent}%
        </span>
      </div>
    </div>
  );
});

DistrictSummaryCard.displayName = 'DistrictSummaryCard';

const StatCell: React.FC<{ icon: React.ReactNode; label: string; value: string; valueColor?: string; last?: boolean }> = ({
  icon, label, value, valueColor, last,
}) => (
  <div
    className="flex flex-col items-start gap-1 px-2.5 py-2"
    style={{ borderRight: last ? 'none' : '1px solid var(--color-premium-border-subtle)' }}
  >
    <span className="flex items-center gap-1 text-[7px] font-bold tracking-wide" style={{ color: GOLD }}>
      {label}
    </span>
    <span className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap" style={{ color: valueColor ?? 'var(--color-premium-text)' }}>
      {icon}
      {value}
    </span>
  </div>
);
