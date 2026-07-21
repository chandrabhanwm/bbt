import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Compass } from 'lucide-react';
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
export const CityMapScreen: React.FC<CityMapScreenProps> = ({ onOpenDistrict, onPreviewDistrict, isDistrictUnlocked, districtProgress, businessesByDistrict, celebratingDistrictId }) => {
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
    <div className="relative w-full h-full overflow-hidden select-none" style={{ backgroundColor: 'var(--color-premium-bg)' }}>

      {/* Top-center title, matching the requested placement */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full"
        style={{ backgroundColor: 'var(--color-premium-surface)', border: '1.5px solid var(--color-premium-border-strong)' }}
      >
        <Compass size={13} color="var(--color-premium-gold-400)" />
        <span className="text-[12px] font-bold tracking-wide" style={{ color: 'var(--color-premium-text)' }}>Basti City Map</span>
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
              return (
                <RoadPath
                  key={road.id}
                  id={road.id}
                  from={from}
                  to={to}
                  active={isRoadActive(bastiCity, road, checkUnlocked)}
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
