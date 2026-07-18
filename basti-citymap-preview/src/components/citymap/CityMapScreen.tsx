import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Compass, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { bastiCity, getDistrict, isRoadActive, District } from '../../data/cityMapData';
import { DistrictNode } from './DistrictNode';
import { RoadPath } from './RoadPath';

/**
 * The City Map screen. Fully data-driven and self-contained — it does not
 * touch any existing screen, route, or piece of game state. Drop it in
 * wherever it's needed later (a new tab, a replacement home screen, etc.)
 * by simply rendering <CityMapScreen />.
 *
 * For now, tapping a district just logs "Open District: <name>" per spec;
 * wiring that into real navigation is a follow-up decision, not made here.
 */
export const CityMapScreen: React.FC = () => {
  const [selected, setSelected] = useState<District | null>(null);

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
    setTimeout(() => setSelected(null), 1400);
  };

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
                    <RoadPath key={road.id} id={road.id} from={from} to={to} active={isRoadActive(bastiCity, road)} />
                  );
                })}

                {bastiCity.districts.map((district) => (
                  <DistrictNode key={district.id} district={district} onSelect={handleSelect} />
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

      {/* Tap feedback toast */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 12, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 12, x: '-50%' }}
            className="absolute bottom-6 left-1/2 z-30 px-4 py-2.5 rounded-2xl toy-card text-[12px] font-display font-bold text-[var(--color-ink-900)] whitespace-nowrap"
          >
            {selected.unlocked ? `Opening ${selected.name}…` : `${selected.name} is locked`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
