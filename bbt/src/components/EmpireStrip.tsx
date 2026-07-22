import React from 'react';
import { Trophy } from 'lucide-react';
import { formatCash } from '../utils/formatCash';
import { CoinIcon } from './CoinIcon';

interface EmpireStripProps {
  netWorth: number;
  lastUnlockedAchievementTitle: string | null;
}

const GOLD = 'var(--color-premium-gold-400)';
const GREEN = 'var(--color-premium-green-500)';
const TEXT_SECONDARY = 'var(--color-premium-text-secondary)';

/**
 * A slim strip above the District Hero card — Home's small nod toward
 * "this is my growing empire," not a restructure. Net Worth reuses the
 * exact figure already computed for Portfolio; the achievement callout
 * reuses the same unlock-detection that drives the Milestone celebration.
 * Deliberately doesn't repeat Today's Goal here — that already has its
 * own full, prominent card just below on this same screen, and showing
 * it twice on one screen would be redundant, not "more empire-like."
 */
export const EmpireStrip: React.FC<EmpireStripProps> = ({ netWorth, lastUnlockedAchievementTitle }) => {
  return (
    <div className="glossy-3d rounded-2xl px-3.5 py-2.5 flex items-center gap-3">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <CoinIcon className="w-3.5 h-3.5" premium />
        <div>
          <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
            Empire Value
          </div>
          <div className="text-[13px] font-bold" style={{ color: GREEN }}>
            {formatCash(netWorth)}
          </div>
        </div>
      </div>

      {lastUnlockedAchievementTitle && (
        <>
          <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--color-premium-border)' }} />
          <div className="flex items-center gap-1.5 min-w-0">
            <Trophy size={14} color={GOLD} className="flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[8px] font-bold uppercase tracking-wide" style={{ color: TEXT_SECONDARY }}>
                Recent Achievement
              </div>
              <div className="text-[11px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
                {lastUnlockedAchievementTitle}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
