import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { bastiCity, getDistrict } from '../data/cityMapData';

interface DistrictContextValue {
  currentDistrictId: string;
  setCurrentDistrict: (districtId: string) => void;
  /** Live/dynamic unlock status — the source of truth at runtime, not the
   *  static `unlocked` seed flag on District. */
  isDistrictUnlocked: (districtId: string) => boolean;
  /** Marks a district unlocked and persists it. Idempotent — safe to call
   *  repeatedly (e.g. every time the progression engine re-evaluates). */
  unlockDistrict: (districtId: string) => void;
}

const DistrictContext = createContext<DistrictContextValue | undefined>(undefined);

const CURRENT_DISTRICT_STORAGE_KEY = 'basti_current_district';
const UNLOCKED_DISTRICTS_STORAGE_KEY = 'basti_unlocked_districts';
const DEFAULT_DISTRICT_ID = 'badeban';

function seedUnlockedMap(): Record<string, boolean> {
  const seeded: Record<string, boolean> = {};
  bastiCity.districts.forEach((d) => {
    seeded[d.id] = d.unlocked;
  });
  return seeded;
}

/**
 * Tracks which district is currently loaded on the Home/District screen,
 * and — new in this slice — which districts are actually unlocked right
 * now. This second part used to just be the static `unlocked` flag baked
 * into cityMapData.ts; it's now live, persisted state that the progression
 * engine (in App.tsx) flips on as requirements are met, and once flipped
 * it stays on (no re-locking if net worth dips back down later).
 */
export const DistrictProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDistrictId, setCurrentDistrictId] = useState<string>(() => {
    return localStorage.getItem(CURRENT_DISTRICT_STORAGE_KEY) || DEFAULT_DISTRICT_ID;
  });

  const [unlockedMap, setUnlockedMap] = useState<Record<string, boolean>>(() => {
    const seeded = seedUnlockedMap();
    const saved = localStorage.getItem(UNLOCKED_DISTRICTS_STORAGE_KEY);
    if (!saved) return seeded;
    try {
      // Merge over the seed so a newly-added district (per §10, data-only)
      // is never missing a key just because an old save predates it.
      return { ...seeded, ...JSON.parse(saved) };
    } catch {
      return seeded;
    }
  });

  useEffect(() => {
    localStorage.setItem(CURRENT_DISTRICT_STORAGE_KEY, currentDistrictId);
  }, [currentDistrictId]);

  useEffect(() => {
    localStorage.setItem(UNLOCKED_DISTRICTS_STORAGE_KEY, JSON.stringify(unlockedMap));
  }, [unlockedMap]);

  const isDistrictUnlocked = useCallback((districtId: string): boolean => {
    return unlockedMap[districtId] === true;
  }, [unlockedMap]);

  const unlockDistrict = useCallback((districtId: string) => {
    setUnlockedMap((prev) => {
      if (prev[districtId]) return prev; // already unlocked, no-op
      return { ...prev, [districtId]: true };
    });
  }, []);

  const setCurrentDistrict = useCallback((districtId: string) => {
    const district = getDistrict(bastiCity, districtId);
    // Locked districts cannot be opened — enforced here so every caller
    // (City Map taps, future deep links, anything else) gets this for free
    // rather than needing to remember to check unlocked status itself.
    if (!district || unlockedMap[districtId] !== true) return;
    setCurrentDistrictId(districtId);
  }, [unlockedMap]);

  return (
    <DistrictContext.Provider value={{ currentDistrictId, setCurrentDistrict, isDistrictUnlocked, unlockDistrict }}>
      {children}
    </DistrictContext.Provider>
  );
};

export function useDistrict(): DistrictContextValue {
  const ctx = useContext(DistrictContext);
  if (!ctx) {
    throw new Error('useDistrict must be used within a DistrictProvider');
  }
  return ctx;
}
