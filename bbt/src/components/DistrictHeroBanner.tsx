import React from 'react';
import { DISTRICT_ICONS } from './citymap/DistrictNode';
import { DistrictIconName } from '../data/cityMapData';

interface DistrictHeroBannerProps {
  icon: DistrictIconName;
}

/**
 * The Hero Card's banner region — communicates district identity through
 * a large silhouette of the district's own icon (already defined per
 * district in cityMapData.ts) rather than a hardcoded photo per district.
 * Any current or future district renders correctly here purely from its
 * `icon` field; nothing here knows the word "Badeban."
 *
 * Colors used are exclusively existing frozen premium tokens — no new
 * hex values, no new named tokens.
 */
export const DistrictHeroBanner: React.FC<DistrictHeroBannerProps> = React.memo(({ icon }) => {
  const Icon = DISTRICT_ICONS[icon];

  return (
    <div className="relative w-full h-[132px] overflow-hidden bg-gradient-to-br from-[var(--color-premium-elevated)] via-[var(--color-premium-surface)] to-[var(--color-premium-bg)]">
      {/* Large faint icon silhouette — the "artwork," data-driven per district */}
      <Icon
        size={210}
        strokeWidth={1}
        className="absolute -right-6 -top-8 text-[var(--color-premium-gold-400)] opacity-[0.10]"
      />

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_15%,transparent_35%,rgba(0,0,0,0.35)_100%)]" />

      {/* Dark overlay gradient at the bottom, for the name/subtitle text
          that sits on top of this banner to stay readable */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--color-premium-bg)] via-[var(--color-premium-bg)]/70 to-transparent" />
    </div>
  );
});

DistrictHeroBanner.displayName = 'DistrictHeroBanner';
