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
    <div className="glossy-3d rounded-xl px-3 py-1.5 flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 flex-shrink-0">
        <CoinIcon className="w-3 h-3" premium />
        <span className="text-[9px] font-bold" style={{ color: TEXT_SECONDARY }}>Empire</span>
        <span className="text-[11px] font-bold" style={{ color: GREEN }}>{formatCash(netWorth)}</span>
      </div>

      {lastUnlockedAchievementTitle && (
        <>
          <div className="w-px h-3.5 flex-shrink-0" style={{ backgroundColor: 'var(--color-premium-border)' }} />
          <div className="flex items-center gap-1 min-w-0">
            <Trophy size={11} color={GOLD} className="flex-shrink-0" />
            <span className="text-[10px] font-bold truncate" style={{ color: 'var(--color-premium-text)' }}>
              {lastUnlockedAchievementTitle}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
