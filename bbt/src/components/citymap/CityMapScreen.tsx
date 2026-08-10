import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { bastiCity, getDistrict, isRoadActive, District } from '../../data/cityMapData';
import { DistrictProgressSummary } from '../../utils/districtProgress';
import { Business } from '../../types';
import { DistrictNode } from './DistrictNode';
import { RoadPath } from './RoadPath';
import { DistrictDetailSheet } from './DistrictDetailSheet';

const EMPTY_PROGRESS: DistrictProgressSummary = {
  income: 0, businessesOwned: 0, businessesTotal: 0, completionPercent: 0, completed: false, stars: 0, districtLevel: 0,
};

interface CityMapScreenProps {
  /** Called when the player taps "Enter District" in the detail sheet for
   *  an unlocked district. Locked districts never trigger this — the sheet
   *  shows the unlock requirement instead, matching "locked districts
   *  cannot be opened." */
  onOpenDistrict?: (district: District) => void;
  /** Called when the player taps "Preview Businesses" for a locked
   *  district. Opens the same Home/District screen used for real play,
   *  but in read-only preview mode — no separate preview screen exists. */
  onPreviewDistrict?: (district: District) => void;
  /** Live unlock status per district. Falls back to the static seed flag
   *  on District if not provided, so this component still works standalone. */
  isDistrictUnlocked?: (districtId: string) => boolean;
  /** Income/completion/stars per district, keyed by id. Missing entries
   *  just render as zero/incomplete rather than erroring. */
  districtProgress?: Record<string, DistrictProgressSummary>;
  currentDistrictId?: string;
  /** Each district's businesses, keyed by id — the same Business[] used
   *  everywhere else, only read here (for potential-income preview math). */
  businessesByDistrict?: Record<string, Business[]>;
  /** Id of a district that /just/ completed, if any — roads touching it
   *  pulse briefly. Caller (App.tsx) is expected to clear this after
   *  progressionConfig.completionRoadPulseDurationMs. */
  celebratingDistrictId?: string | null;
}

/**
 * The City Map screen. Fully data-driven and self-contained — it does not
 * touch any existing screen, route, or piece of game state. Drop it in
 * wherever it's needed later (a new tab, a replacement home screen, etc.)
 * by simply rendering <CityMapScreen />.
 *
 * Tapping a district still logs "Open District: <name>" per the original
 * spec, and opens a detail sheet (name, stars, completion, businesses,
 * income, unlock requirement, status). Unlocked districts get an "Enter
 * District" button; locked ones get a "Preview Businesses" button instead
 * of being blocked outright.
 */
export const CityMapScreen: React.FC<CityMapScreenProps> = ({ onOpenDistrict, onPreviewDistrict, isDistrictUnlocked, districtProgress, businessesByDistrict, celebratingDistrictId, currentDistrictId }) => {
  const [selected, setSelected] = useState<District | null>(null);

  const checkUnlocked = (districtId: string): boolean => {
    if (isDistrictUnlocked) return isDistrictUnlocked(districtId);
    return getDistrict(bastiCity, districtId)?.unlocked ?? false; // backward-compatible fallback
  };

  const getProgress = (districtId: string): DistrictProgressSummary => {
    return districtProgress?.[districtId] ?? EMPTY_PROGRESS;
  };

  const getBusinesses = (districtId: string): Business[] => {
    return businessesByDistrict?.[districtId] ?? [];
  };

  // Map content bounding box, derived from the data rather than hardcoded,
  // so adding districts further out doesn't require touching this file.
  const xs = bastiCity.districts.map((d) => d.x);
  const ys = bastiCity.districts.map((d) => d.y);
  const pad = 65;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  const handleSelect = (district: District) => {
    // eslint-disable-next-line no-console
    console.log(`Open District: ${district.name}`);
    setSelected(district);
  };

  const handleEnter = (district: District) => {
    setSelected(null);
    onOpenDistrict?.(district);
  };

  const handlePreview = (district: District) => {
    setSelected(null);
    onPreviewDistrict?.(district);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        // A genuinely bright, saturated world — not the app's dark
        // theme with subtle color washes on top. Real map screens in
        // this genre (Coin Master, Township) are daylit, saturated
        // worlds; a map inheriting the app's dark premium palette with
        // low-opacity tints was never going to read as "colorful,"
        // no matter how the tints were tuned. This breaks from the
        // app's dark theme deliberately, scoped to just this screen —
        // a warm coastal sky, fitting CoralBay's own theme, with bold
        // saturated terrain patches rather than translucent hints of
        // color.
        background: `
          radial-gradient(45% 35% at 20% 15%, #4DD8C4 0%, transparent 100%),
          radial-gradient(50% 40% at 80% 10%, #FFB86B 0%, transparent 100%),
          radial-gradient(55% 45% at 30% 90%, #2E9E6B 0%, transparent 100%),
          radial-gradient(50% 40% at 85% 75%, #E8A23D 0%, transparent 100%),
          linear-gradient(180deg, #1E6E8C 0%, #17506B 45%, #0F3A4D 100%)
        `,
      }}
    >

      {/* Gentle waves along the bottom edge — replaces the old dark-theme
          city skyline silhouette, which was line-art of office towers
          and had zero relationship to a bright coastal world. Layered,
          softly rolling wave shapes fit what this map actually is. */}
      <svg
        viewBox="0 0 400 100"
        className="absolute inset-x-0 bottom-0 w-full pointer-events-none z-0"
        style={{ height: '14%', opacity: 0.35 }}
        preserveAspectRatio="xMidYMax slice"
      >
        <path d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,50 L400,100 L0,100 Z" fill="#1E6E8C" />
        <path d="M0,65 Q50,40 100,65 T200,65 T300,65 T400,65 L400,100 L0,100 Z" fill="#17506B" opacity="0.7" />
      </svg>

      {/* Slowly drifting clouds — fixed to the viewport (not part of the
          pannable map content, so they don't zoom/pan with it), giving
          the world genuine atmosphere rather than empty static space
          above the terrain gradient. Soft, blurred, low-opacity ellipses
          rather than any recognizable cloud shape — the point is
          ambient motion, not an illustrated element that needs to read
          clearly as "a cloud" up close. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[
          { top: '8%', size: 220, duration: 42, opacity: 0.14 },
          { top: '22%', size: 160, duration: 55, opacity: 0.11 },
          { top: '45%', size: 260, duration: 65, opacity: 0.13 },
          { top: '68%', size: 190, duration: 48, opacity: 0.12 },
        ].map((cloud, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute', top: cloud.top, width: cloud.size, height: cloud.size * 0.4,
              borderRadius: '50%', background: '#ffffff', opacity: cloud.opacity, filter: 'blur(18px)',
            }}
            initial={{ x: '-20%' }}
            animate={{ x: '120vw' }}
            transition={{ duration: cloud.duration, repeat: Infinity, ease: 'linear', delay: i * -13 }}
          />
        ))}
      </div>

      {/* Small ambient twinkling particles — genuinely distinct from the
          clouds above (tiny bright points drifting and fading, not
          soft large blurs), giving the map a second, finer layer of
          ambient motion the way a real night sky or a distant city has
          both broad atmosphere and small individual points of light. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 14 }).map((_, i) => {
          const left = (i * 37 + 11) % 100;
          const top = (i * 53 + 7) % 100;
          const duration = 4 + (i % 5);
          return (
            <motion.div
              key={i}
              style={{
                position: 'absolute', left: `${left}%`, top: `${top}%`,
                width: 3, height: 3, borderRadius: '50%',
                background: 'var(--color-premium-gold-400)',
              }}
              animate={{ opacity: [0, 0.8, 0], y: [0, -14, -28] }}
              transition={{ duration, repeat: Infinity, delay: i * 0.7, ease: 'easeInOut' }}
            />
          );
        })}
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2.5}
        centerOnInit
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn', step: 0.6 }}
      >
        <TransformComponent
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ width: '100%', height: '100%' }}
        >
          <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Roads render first so nodes sit visually on top */}
            {bastiCity.roads.map((road) => {
              const from = getDistrict(bastiCity, road.from);
              const to = getDistrict(bastiCity, road.to);
              if (!from || !to) return null;
              const touchesCelebrating = celebratingDistrictId != null &&
                (road.from === celebratingDistrictId || road.to === celebratingDistrictId);
              const traveled = getProgress(road.from).completed && getProgress(road.to).completed;
              return (
                <RoadPath
                  key={road.id}
                  id={road.id}
                  from={from}
                  to={to}
                  active={isRoadActive(bastiCity, road, checkUnlocked)}
                  traveled={traveled}
                  celebrating={touchesCelebrating}
                />
              );
            })}

            {bastiCity.districts.map((district) => (
              <DistrictNode
                key={district.id}
                district={district}
                unlocked={checkUnlocked(district.id)}
                progress={getProgress(district.id)}
                onSelect={handleSelect}
                isCurrent={district.id === currentDistrictId}
              />
            ))}
          </svg>
        </TransformComponent>
      </TransformWrapper>

      <DistrictDetailSheet
        district={selected}
        unlocked={selected ? checkUnlocked(selected.id) : false}
        progress={selected ? getProgress(selected.id) : EMPTY_PROGRESS}
        businesses={selected ? getBusinesses(selected.id) : []}
        onEnter={handleEnter}
        onPreview={handlePreview}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};
