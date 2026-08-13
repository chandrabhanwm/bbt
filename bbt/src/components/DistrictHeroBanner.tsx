import React, { useState } from 'react';

const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

interface DistrictHeroBannerProps {
  /** District id — used for auto-lookup at
   *  /assets/district-photos/{districtId}.{jpg,jpeg,png,webp}, tried in
   *  that order. Same self-contained pattern already proven with
   *  BusinessPhoto: dropping a correctly-named file in that folder is
   *  the entire integration, no code change needed per district. */
  districtId: string;
  /** Explicit photo URL — wins over auto-lookup if supplied, same
   *  override behavior BusinessPhoto already has. */
  imageUrl?: string;
}

export const DistrictHeroBanner: React.FC<DistrictHeroBannerProps> = React.memo(({ districtId, imageUrl }) => {
  const [extIndex, setExtIndex] = useState(0);
  const [autoFailed, setAutoFailed] = useState(false);

  const showAutoPhoto = !imageUrl && !autoFailed && extIndex < PHOTO_EXTENSIONS.length;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {imageUrl ? (
        <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : showAutoPhoto ? (
        <img
          key={`${districtId}-${extIndex}`}
          src={`/assets/district-photos/${districtId}.${PHOTO_EXTENSIONS[extIndex]}`}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => {
            if (extIndex + 1 < PHOTO_EXTENSIONS.length) setExtIndex((i) => i + 1);
            else setAutoFailed(true);
          }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-premium-elevated) 0%, var(--color-premium-bg) 100%)' }} />
      )}
      {/* Vignette + bottom dark gradient so overlaid text always reads clearly */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 50% 15%, transparent 35%, var(--color-premium-overlay-vignette) 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-10" style={{ background: 'linear-gradient(to top, var(--color-premium-overlay-fade), transparent)' }} />
    </div>
  );
});

DistrictHeroBanner.displayName = 'DistrictHeroBanner';
