import { Business } from '../types';

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

export function getDistrictBusinessesOwned(businesses: Business[]): number {
  return businesses.filter((b) => b.level > 0).length;
}

export function getDistrictCompletionPercent(businesses: Business[]): number {
  if (businesses.length === 0) return 0;
  const owned = getDistrictBusinessesOwned(businesses);
  return Math.round((owned / businesses.length) * 100);
}

/**
 * Completion rule for this slice: every business in the district has been
 * purchased at least once (spec's "Option A"). Kept as its own function so
 * switching to "Option B — all businesses max upgraded" later is a
 * one-line change here, not a hunt through every caller.
 */
export function isDistrictCompleted(businesses: Business[]): boolean {
  if (businesses.length === 0) return false;
  return businesses.every((b) => b.level > 0);
}

/** 1 star per 20% completion, capped at 5 — simple, tunable in one place. */
export function getDistrictStars(businesses: Business[]): number {
  const pct = getDistrictCompletionPercent(businesses);
  return Math.min(5, Math.floor(pct / 20));
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
