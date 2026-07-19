import React from 'react';
import { DISTRICT_ICONS } from './citymap/DistrictNode';
import { DistrictIconName } from '../data/cityMapData';

interface DistrictHeroBannerProps {
  icon: DistrictIconName;
  /** Real district photography, supplied later — falls back to a themed
   *  gradient + icon silhouette when not provided. */
  imageUrl?: string;
}

export const DistrictHeroBanner: React.FC<DistrictHeroBannerProps> = React.memo(({ icon, imageUrl }) => {
  const Icon = DISTRICT_ICONS[icon];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1A1712 0%, #0A0A0B 100%)' }}>
          <Icon size={200} strokeWidth={1} className="absolute -right-6 -top-10 opacity-[0.07]" color="#D4A72C" />
        </div>
      )}
      {/* Vignette + bottom dark gradient so overlaid text always reads clearly */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 50% 15%, transparent 35%, rgba(0,0,0,0.4) 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-16" style={{ background: 'linear-gradient(to top, rgba(10,10,11,0.95), transparent)' }} />
    </div>
  );
});

DistrictHeroBanner.displayName = 'DistrictHeroBanner';
