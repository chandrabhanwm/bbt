import React from 'react';
import { Star } from 'lucide-react';
import { CoinIcon } from './CoinIcon';
import { progressionConfig } from '../config/progressionConfig';

interface DistrictSummaryCardProps {
  districtEmoji: string;
  districtName: string;
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  districtLevel: number;
  stars: number;
}

/**
 * The compact card at the top of every district screen — name, stars,
 * income, businesses owned, completion %, and district level. Purely
 * presentational, fed by getDistrictProgress() upstream, so it updates
 * automatically whenever business data changes.
 */
export const DistrictSummaryCard: React.FC<DistrictSummaryCardProps> = ({
  districtEmoji,
  districtName,
  income,
  businessesOwned,
  businessesTotal,
  completionPercent,
  districtLevel,
  stars,
}) => {
  return (
    <div className="toy-card rounded-2xl px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-[13px] text-[var(--color-ink-900)] uppercase tracking-wide">
          {districtEmoji} {districtName}
        </span>
        <span className="flex items-center gap-[1px]" aria-label={`${stars} of ${progressionConfig.maxStars} stars`}>
          {Array.from({ length: progressionConfig.maxStars }).map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < stars ? 'text-[var(--color-marigold-500)] fill-current' : 'text-[var(--color-ink-700)]/20'}
            />
          ))}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-2">
        <div className="flex flex-col">
          <span className="text-[7.5px] font-bold text-[var(--color-ink-700)]/60 uppercase tracking-wide">Income</span>
          <span className="flex items-center gap-1 font-display font-bold text-[11px] text-[var(--color-money-600)]">
            <CoinIcon className="w-3 h-3" />
            {Math.round(income).toLocaleString('en-IN')}/min
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7.5px] font-bold text-[var(--color-ink-700)]/60 uppercase tracking-wide">Businesses</span>
          <span className="font-display font-bold text-[11px] text-[var(--color-ink-900)]">
            {businessesOwned} / {businessesTotal}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7.5px] font-bold text-[var(--color-ink-700)]/60 uppercase tracking-wide">Completion</span>
          <span className="font-display font-bold text-[11px] text-[var(--color-ink-900)]">
            {completionPercent}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7.5px] font-bold text-[var(--color-ink-700)]/60 uppercase tracking-wide">Level</span>
          <span className="font-display font-bold text-[11px] text-[var(--color-ink-900)]">
            {districtLevel}
          </span>
        </div>
      </div>
    </div>
  );
};
