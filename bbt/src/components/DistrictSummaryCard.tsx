import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Star, TrendingUp, Store, Layers, CheckCircle2 } from 'lucide-react';
import { DistrictIconName } from '../data/cityMapData';
import { DistrictHeroBanner } from './DistrictHeroBanner';
import { PremiumCard } from '../design-system/components/PremiumCard';
import { PremiumBadge } from '../design-system/components/PremiumBadge';
import { progressionConfig } from '../config/progressionConfig';
import { formatCash } from '../utils/formatCash';

interface DistrictSummaryCardProps {
  districtEmoji: string;
  districtName: string;
  /** Drives the hero banner's icon silhouette — same field cityMapData.ts
   *  already defines per district, nothing district-specific added here. */
  districtIcon: DistrictIconName;
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  districtLevel: number;
  stars: number;
}

/**
 * The District Hero Card — "I've entered Badeban." Banner communicates
 * place, the overlaid name claims it, the progress bar + stats communicate
 * progress and ownership. Purely presentational, fed by getDistrictProgress()
 * upstream exactly as before — same data, new presentation.
 *
 * Wrapped in React.memo: this card's props are all primitives derived from
 * a useMemo'd progress object in App.tsx, so on the many renders per minute
 * that don't actually change district data (the passive-income tick updates
 * `stats`, not `businessesByDistrict`), this component now correctly skips
 * re-rendering instead of re-computing/re-painting for no reason.
 */
export const DistrictSummaryCard: React.FC<DistrictSummaryCardProps> = React.memo(({
  districtEmoji,
  districtName,
  districtIcon,
  income,
  businessesOwned,
  businessesTotal,
  completionPercent,
  districtLevel,
  stars,
}) => {
  const starSlots = useMemo(() => Array.from({ length: progressionConfig.maxStars }), []);

  return (
    <PremiumCard variant="district" className="!p-0 overflow-hidden">
      {/* 1. District image — the hero banner, with name/subtitle overlaid
             on its dark base for readability, per the brief's priority order */}
      <div className="relative">
        <DistrictHeroBanner icon={districtIcon} />
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="absolute inset-x-0 bottom-0 px-5 pb-4"
        >
          <h2 className="text-[24px] font-bold text-[var(--color-premium-text)] tracking-tight leading-none">
            {districtEmoji} {districtName.toUpperCase()}
          </h2>
          <p className="text-[12px] font-medium text-[var(--color-premium-text-secondary)] mt-1">
            Your Current District
          </p>
        </motion.div>
      </div>

      <div className="px-5 py-5">
        {/* 2. Progress — the one bar, represents district completion */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-[var(--color-premium-text-secondary)]">Completion Progress</span>
          <span className="text-[12px] font-semibold text-[var(--color-premium-text)]">{completionPercent}%</span>
        </div>
        <div className="w-full h-1 rounded-full bg-[var(--color-premium-border)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--color-premium-gold-400)]"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>

        {/* 3. Statistics — premium grid, identical spacing throughout */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6">
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
              <TrendingUp size={13} className="text-[var(--color-premium-green-500)]" />
              District Income
            </span>
            <span
              className="text-[15px] font-medium text-[var(--color-premium-green-500)]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCash(income)}<span className="text-[var(--color-premium-text-secondary)] font-normal">/min</span>
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
              <Store size={13} className="text-[var(--color-premium-text-secondary)]" />
              Businesses
            </span>
            <PremiumBadge variant="price" className="w-fit">
              {businessesOwned} / {businessesTotal}
            </PremiumBadge>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
              <CheckCircle2 size={13} className="text-[var(--color-premium-text-secondary)]" />
              Completion
            </span>
            <span className="text-[15px] font-medium text-[var(--color-premium-text)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {completionPercent}%
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--color-premium-text-secondary)]">
              <Layers size={13} className="text-[var(--color-premium-text-secondary)]" />
              District Level
            </span>
            <PremiumBadge variant="level" className="w-fit">
              Lvl {districtLevel}
            </PremiumBadge>
          </div>

          <div className="flex flex-col gap-1.5 col-span-2">
            <span className="text-[12px] font-medium text-[var(--color-premium-text-secondary)]">Stars</span>
            <span className="flex items-center gap-1" aria-label={`${stars} of ${progressionConfig.maxStars} stars`}>
              {starSlots.map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < stars ? 'text-[var(--color-premium-gold-400)] fill-current' : 'text-[var(--color-premium-border-strong)]'}
                />
              ))}
            </span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
});

DistrictSummaryCard.displayName = 'DistrictSummaryCard';
