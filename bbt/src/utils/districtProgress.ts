import { Business } from '../types';
import { progressionConfig } from '../config/progressionConfig';

/**
 * All district-progress numbers (income, completion, stars, level) are
 * derived on the fly from a district's Business[] rather than stored as
 * separate persisted fields. Business[] is already persisted per district,
 * so this avoids a second source of truth that could drift out of sync —
 * these functions are the only place this math lives.
 */

export function getDistrictIncome(businesses: Business[]): number {
  return businesses.reduce((sum, b) => {
    if (b.level === 0) return sum;
    return sum + b.level * b.baseProfitPerMin;
  }, 0);
}

/** What a district could earn if every business were purchased once (but
 *  not further upgraded) — used by the locked-district preview to answer
 *  "what am I unlocking?" before anything has actually been bought. */
export function getDistrictPotentialIncome(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.baseProfitPerMin, 0);
}

export function getDistrictBusinessesOwned(businesses: Business[]): number {
  return businesses.filter((b) => b.level > 0).length;
}

export function getDistrictCompletionPercent(businesses: Business[]): number {
  if (businesses.length === 0) return 0;
  const owned = getDistrictBusinessesOwned(businesses);
  return Math.round((owned / businesses.length) * 100);
}

/**
 * Completion rule is read from progressionConfig.completionRule, not
 * hardcoded — 'all_purchased' (default, matches prior slice's behavior
 * exactly) or 'all_maxed' (every business at its maxLevel; see the config
 * file for why this is currently unreachable in practice).
 */
export function isDistrictCompleted(businesses: Business[]): boolean {
  if (businesses.length === 0) return false;
  if (progressionConfig.completionRule === 'all_maxed') {
    return businesses.every((b) => b.maxLevel !== undefined && b.level >= b.maxLevel);
  }
  return businesses.every((b) => b.level > 0);
}

/** One star per progressionConfig.starThresholdPercent of completion,
 *  capped at progressionConfig.maxStars — both configurable, not hardcoded. */
export function getDistrictStars(businesses: Business[]): number {
  if (businesses.length === 0) return progressionConfig.defaultStars;
  const pct = getDistrictCompletionPercent(businesses);
  return Math.min(progressionConfig.maxStars, Math.floor(pct / progressionConfig.starThresholdPercent));
}

/** District Level: sum of every business's level in the district — a
 *  depth-of-investment metric distinct from "businesses owned" (a count). */
export function getDistrictLevel(businesses: Business[]): number {
  return businesses.reduce((sum, b) => sum + b.level, 0);
}

export interface DistrictProgressSummary {
  income: number;
  businessesOwned: number;
  businessesTotal: number;
  completionPercent: number;
  completed: boolean;
  stars: number;
  districtLevel: number;
}

export function getDistrictProgress(businesses: Business[]): DistrictProgressSummary {
  return {
    income: getDistrictIncome(businesses),
    businessesOwned: getDistrictBusinessesOwned(businesses),
    businessesTotal: businesses.length,
    completionPercent: getDistrictCompletionPercent(businesses),
    completed: isDistrictCompleted(businesses),
    stars: getDistrictStars(businesses),
    districtLevel: getDistrictLevel(businesses),
  };
}
