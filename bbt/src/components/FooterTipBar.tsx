import React from 'react';
import { TrendingUp } from 'lucide-react';

const GOLD = 'var(--color-premium-gold-400)';

/**
 * Purely decorative/informational strip at the bottom of the business
 * grid — no state, no props, no logic. Matches the reference's footer tip,
 * including its right-side city-skyline silhouette (built as plain SVG
 * line art here, since no external image asset is needed for a simple
 * geometric skyline).
 */
export const FooterTipBar: React.FC = () => {
  return (
    <div
      className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-premium-surface)', border: `1px solid var(--color-premium-border)` }}
    >
      <TrendingUp size={15} color={GOLD} className="flex-shrink-0" />
      <span className="text-[10.5px] font-medium leading-snug relative z-10" style={{ color: 'var(--color-premium-text-secondary)' }}>
        Upgrade businesses to increase income and unlock more opportunities!
      </span>

      {/* Decorative skyline silhouette, right side — thin gold line art,
          low opacity, purely visual */}
      <svg
        viewBox="0 0 160 60"
        className="absolute right-0 bottom-0 h-full w-[46%] pointer-events-none"
        style={{ opacity: 0.16 }}
        preserveAspectRatio="xMaxYMax meet"
      >
        <g fill="none" stroke={GOLD} strokeWidth="1.5">
          <rect x="4" y="30" width="14" height="30" />
          <rect x="20" y="18" width="12" height="42" />
          <rect x="34" y="36" width="10" height="24" />
          <line x1="39" y1="36" x2="39" y2="24" />
          <rect x="46" y="10" width="16" height="50" />
          <line x1="54" y1="10" x2="54" y2="2" />
          <rect x="64" y="26" width="12" height="34" />
          <rect x="78" y="40" width="10" height="20" />
          <rect x="90" y="14" width="14" height="46" />
          <rect x="106" y="32" width="12" height="28" />
          <rect x="120" y="22" width="10" height="38" />
          <rect x="132" y="38" width="12" height="22" />
          <rect x="146" y="16" width="10" height="44" />
          <line x1="151" y1="16" x2="151" y2="6" />
        </g>
      </svg>
    </div>
  );
};
