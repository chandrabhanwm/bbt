/**
 * Central configuration for the progression engine. Every number and rule
 * that governs district completion, rewards, and star ratings lives here
 * — nowhere else in the codebase should hardcode these. Retuning game
 * balance later means editing this one file.
 */

export type CompletionRule = 'all_purchased' | 'all_maxed';

export const progressionConfig = {
  /**
   * Option A ('all_purchased'): a district is completed once every
   * business in it has been bought at least once.
   * Option B ('all_maxed'): completed once every business hits its
   * maxLevel. NOTE: no business currently defines maxLevel (that field
   * was intentionally not added/enforced, to avoid changing existing
   * upgrade behavior) — so 'all_maxed' is fully wired but practically
   * unreachable until a future slice adds real level caps. This is
   * correct, not a bug: nothing can be "maxed" if nothing is capped.
   */
  completionRule: 'all_purchased' as CompletionRule,

  /** Cash bonus paid out once, the moment a district completes. */
  completionReward: 500000,

  /** Star rating starts here before any businesses are purchased. */
  defaultStars: 0,

  /** Every this-many percent of completion earns one star. */
  starThresholdPercent: 20,

  /** Star rating never exceeds this. */
  maxStars: 5,

  /** How long a newly-unlocked district's frontier roads stay animated
   *  on the City Map after unlocking. */
  unlockAnimationDurationMs: 4000,

  /** How long a district-completed celebration banner stays on screen. */
  celebrationDurationMs: 3500,

  /** How long roads leading away from a just-completed district pulse. */
  completionRoadPulseDurationMs: 4000,
};
