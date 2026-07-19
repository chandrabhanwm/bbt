import React from 'react';
import { TrendingUp } from 'lucide-react';

const GOLD = '#D4A72C';

/**
 * Purely decorative/informational strip at the bottom of the business
 * grid — no state, no props, no logic. Matches the reference's footer tip.
 */
export const FooterTipBar: React.FC = () => {
  return (
    <div
      className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden relative"
      style={{ backgroundColor: '#131110', border: `1px solid rgba(212,167,44,0.25)` }}
    >
      <TrendingUp size={15} color={GOLD} className="flex-shrink-0" />
      <span className="text-[10.5px] font-medium leading-snug" style={{ color: '#B8B5B1' }}>
        Upgrade businesses to increase income and unlock more opportunities!
      </span>
    </div>
  );
};
