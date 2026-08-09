import { Business } from '../types';

export interface PrestigeBadge {
  /** The total level sum (across every business, every district) required
   *  to earn this badge. */
  threshold: number;
  icon: string;
  name: string;
}

/**
 * Prestige badges — keyed entirely off a player's TOTAL LEVEL SUM (every
 * business's level, added up across all 10 districts), not XP. XP was
 * deliberately ruled out for this: it only ever comes from buy/upgrade
 * actions, and the game has a genuinely finite number of those (80
 * businesses × 6 levels each) — meaning there's a hard, provable ceiling
 * on how much XP could ever exist in a single playthrough, well below
 * what a real 15-tier prestige ladder would need. Total level sum has no
 * such ceiling problem: it ranges cleanly from 0 (nothing owned) to 480
 * (every business in every district fully maxed), and every threshold
 * below is honestly, mathematically reachable — including the top one,
 * which means "you finished the entire game," not "you did something
 * arbitrarily grindy."
 */
export const PRESTIGE_BADGES: PrestigeBadge[] = [
  { threshold: 1, icon: '🏪', name: 'Entrepreneur' },
  { threshold: 15, icon: '⚜️', name: 'Elite' },
  { threshold: 35, icon: '👑', name: 'District Lord' },
  { threshold: 60, icon: '🦁', name: 'Business Lion' },
  { threshold: 90, icon: '💰', name: 'Wealth Baron' },
  { threshold: 125, icon: '🔱', name: 'Empire Builder' },
  { threshold: 165, icon: '💠', name: 'Master Tycoon' },
  { threshold: 210, icon: '🏛️', name: 'Magnate' },
  { threshold: 255, icon: '🛡️', name: 'The Governor' },
  { threshold: 300, icon: '🏆', name: 'Grand Champion' },
  { threshold: 340, icon: '💎', name: 'Diamond Tycoon' },
  { threshold: 375, icon: '💎', name: 'Platinum Elite' },
  { threshold: 405, icon: '🥇', name: 'Supreme Champion' },
  { threshold: 430, icon: '🔥', name: 'The Dominant' },
  { threshold: 455, icon: '👑', name: 'Maharaja' },
  { threshold: 480, icon: '👑', name: 'The Legend' },
];

/** Sum of every business's level, across every district — 0 at a fresh
 *  start, 480 at total, full-game completion. The single source number
 *  the entire prestige badge system is built on. */
export function getTotalLevelSum(businessesByDistrict: Record<string, Business[]>): number {
  return Object.values(businessesByDistrict).reduce((grand, districtBusinesses) => {
    return grand + districtBusinesses.reduce((sum, b) => sum + b.level, 0);
  }, 0);
}

/** The highest badge a player has actually earned at this total level sum
 *  — null if they haven't reached even the first one yet (total level 0,
 *  nothing bought). Badges are cumulative: earning "Empire Builder"
 *  means every badge below it was earned too, but this returns only the
 *  current, highest one — that's the one actually worth displaying. */
export function getCurrentBadge(totalLevelSum: number): PrestigeBadge | null {
  let current: PrestigeBadge | null = null;
  for (const badge of PRESTIGE_BADGES) {
    if (totalLevelSum >= badge.threshold) current = badge;
    else break; // list is in ascending threshold order, safe to stop early
  }
  return current;
}

/** The next badge still ahead, or null if every badge has already been
 *  earned (total level sum is already 480, the game is fully complete). */
export function getNextBadge(totalLevelSum: number): PrestigeBadge | null {
  return PRESTIGE_BADGES.find((b) => totalLevelSum < b.threshold) ?? null;
}
