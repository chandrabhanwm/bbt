import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { bastiCity, getDistrict, isRoadActive, District } from '../../data/cityMapData';
import { DistrictProgressSummary } from '../../utils/districtProgress';
import { DistrictNode } from './DistrictNode';
import { RoadPath } from './RoadPath';

const EMPTY_PROGRESS: DistrictProgressSummary = {
  income: 0, businessesOwned: 0, businessesTotal: 0, completionPercent: 0, completed: false, stars: 0, districtLevel: 0,
};

interface CityMapScreenProps {
  /** Called when the player taps an unlocked district, in addition to the
   *  always-on console log + toast. Locked districts never trigger this —
   *  the toast is all they get, matching "locked districts cannot be opened." */
  onOpenDistrict?: (district: District) => void;
  /** Live unlock status per district. Falls back to the static seed flag
   *  on District if not provided, so this component still works standalone. */
  isDistrictUnlocked?: (districtId: string) => boolean;
  /** Income/completion/stars per district, keyed by id. Missing entries
   *  just render as zero/incomplete rather than erroring. */
  districtProgress?: Record<string, DistrictProgressSummary>;
}

/**
 * The City Map screen. Fully data-driven and self-contained — it does not
 * touch any existing screen, route, or piece of game state. Drop it in
 * wherever it's needed later (a new tab, a replacement home screen, etc.)
 * by simply rendering <CityMapScreen />.
 *
 * Tapping a district still logs "Open District: <name>" per the original
 * spec; if onOpenDistrict is provided, unlocked taps also fire it so a
 * parent (App.tsx) can load that district onto the Home screen.
 */
export const CityMapScreen: React.FC<CityMapScreenProps> = ({ onOpenDistrict, isDistrictUnlocked, districtProgress }) => {
  const [selected, setSelected] = useState<District | null>(null);

  const checkUnlocked = (districtId: string): boolean => {
    if (isDistrictUnlocked) return isDistrictUnlocked(districtId);
    return getDistrict(bastiCity, districtId)?.unlocked ?? false; // backward-compatible fallback
  };

  const getProgress = (districtId: string): DistrictProgressSummary => {
    return districtProgress?.[districtId] ?? EMPTY_PROGRESS;
  };

  // Map content bounding box, derived from the data rather than hardcoded,
  // so adding districts further out doesn't require touching this file.
  const xs = bastiCity.districts.map((d) => d.x);
  const ys = bastiCity.districts.map((d) => d.y);
  const pad = 90;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const viewBox = `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;

  const handleSelect = (district: District) => {
    // eslint-disable-next-line no-console
    console.log(`Open District: ${district.name}`);
    setSelected(district);
    setTimeout(() => setSelected(null), 1800);
    if (checkUnlocked(district.id)) {
      onOpenDistrict?.(district);
    }
  };

  const selectedUnlocked = selected ? checkUnlocked(selected.id) : false;
  const selectedProgress = selected ? getProgress(selected.id) : EMPTY_PROGRESS;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#8FD9F0] via-[#C9EEFA] to-[var(--color-parchment-100)] overflow-hidden select-none">

      {/* Top label */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border-2 border-[var(--color-ink-900)] text-[10px] font-display font-bold text-[var(--color-ink-900)]">
        <Compass size={12} className="text-[var(--color-marigold-500)]" />
        <span>Basti — City Map</span>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2.5}
        centerOnInit
        wheel={{ step: 0.15 }}
        doubleClick={{ mode: 'zoomIn', step: 0.6 }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
              <svg viewBox={viewBox} className="w-full h-full" style={{ minWidth: 500, minHeight: 900 }}>
                {/* Roads render first so nodes sit visually on top */}
                {bastiCity.roads.map((road) => {
                  const from = getDistrict(bastiCity, road.from);
                  const to = getDistrict(bastiCity, road.to);
                  if (!from || !to) return null;
                  return (
                    <RoadPath key={road.id} id={road.id} from={from} to={to} active={isRoadActive(bastiCity, road, checkUnlocked)} />
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

            {/* Zoom controls */}
            <div className="absolute bottom-5 right-4 z-30 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[var(--color-ink-900)] flex items-center justify-center shadow-[0_3px_0_var(--color-ink-900)] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} className="text-[var(--color-ink-900)]" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[var(--color-ink-900)] flex items-center justify-center shadow-[0_3px_0_var(--color-ink-900)] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} className="text-[var(--color-ink-900)]" />
              </button>
              <button
                onClick={() => resetTransform()}
                className="w-10 h-10 rounded-xl bg-white border-2 border-[var(--color-ink-900)] flex items-center justify-center shadow-[0_3px_0_var(--color-ink-900)] active:shadow-none active:translate-y-[3px] transition-all cursor-pointer"
                aria-label="Recenter map"
              >
                <Maximize size={15} className="text-[var(--color-ink-900)]" />
              </button>
            </div>
          </>
        )}
      </TransformWrapper>

      {/* Tap feedback toast — shows exactly what's needed to unlock, per §3 */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 12, x: '-50%' }}
            className="absolute bottom-6 left-1/2 z-30 px-4 py-2.5 rounded-2xl toy-card text-center whitespace-nowrap"
          >
            {selectedUnlocked ? (
              <span className="font-display font-bold text-[12px] text-[var(--color-ink-900)]">
                {selectedProgress.completed ? `${selected.name} — Completed! ★${selectedProgress.stars}` : `Opening ${selected.name}…`}
              </span>
            ) : (
              <span className="font-display font-bold text-[12px] text-[var(--color-ink-900)]">
                🔒 {selected.name} — {selected.unlockRequirement?.label ?? 'Locked'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
