import { todayDateString } from './weeklyContest';

/** A 7-day escalating reward cycle that repeats indefinitely — the
 *  streak count itself (currentStreak) never resets on a cycle
 *  boundary, only the reward amount cycles back to Day 1's level. This
 *  is the standard, proven shape for this mechanic: escalating enough
 *  to feel like real progress within a week, but not scaling forever
 *  into implausible numbers for a player on a 200-day streak. */
export const STREAK_REWARD_CYCLE = [500, 750, 1000, 1500, 2000, 3000, 5000];

/** Which streak-day counts get the full-screen milestone treatment
 *  instead of just the routine in-card reward — genuinely notable
 *  lengths, not every single day. */
export const STREAK_MILESTONE_DAYS = [7, 14, 30, 50, 100, 200, 365];

export function getStreakRewardForDay(streakDay: number): number {
  const cycleIndex = (streakDay - 1) % STREAK_REWARD_CYCLE.length;
  return STREAK_REWARD_CYCLE[cycleIndex];
}

export interface StreakLoginResult {
  /** True if this login actually advanced the streak (a new day's
   *  reward should be granted) — false if the player already logged in
   *  today (nothing to do) and this call is a no-op. */
  advanced: boolean;
  newStreak: number;
  newLongestStreak: number;
  rewardAmount: number;
  /** True if the previous streak was broken (a day was missed) rather
   *  than genuinely continued — lets the UI distinguish "streak grew"
   *  from "streak restarted at 1," which matters for how that moment
   *  should feel to the player. */
  wasBroken: boolean;
}

/**
 * Call once per app session, after auth resolves. Compares
 * lastStreakLoginDate against today's real local date (not a raw
 * timestamp, so this is immune to time-of-day drift the same way every
 * other daily-reset mechanic in this app already is):
 *
 * - Same day as last login: no-op, advanced: false. This is what makes
 *   the function safe to call on every app open/reload without
 *   accidentally granting a second reward for the same real day.
 * - Exactly yesterday: streak continues, increments by 1.
 * - Any other gap (2+ days missed, or no previous login at all): streak
 *   resets to 1 — this is the loss-aversion mechanic actually doing its
 *   job, not a bug to soften.
 */
export function processStreakLogin(currentStreak: number, longestStreak: number, lastStreakLoginDate: string): StreakLoginResult {
  const today = todayDateString();

  if (lastStreakLoginDate === today) {
    return { advanced: false, newStreak: currentStreak, newLongestStreak: longestStreak, rewardAmount: 0, wasBroken: false };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const continuedStreak = lastStreakLoginDate === yesterdayStr;
  const newStreak = continuedStreak ? currentStreak + 1 : 1;
  const newLongestStreak = Math.max(longestStreak, newStreak);

  return {
    advanced: true,
    newStreak,
    newLongestStreak,
    rewardAmount: getStreakRewardForDay(newStreak),
    wasBroken: !continuedStreak && currentStreak > 0,
  };
}

/** Hours remaining today before the streak would be at risk of
 *  breaking tomorrow if the player doesn't return — used for the
 *  "streak breaks in Xh" warning. Purely a display calculation; the
 *  actual break/continue decision always happens for real in
 *  processStreakLogin above, this never mutates anything. */
export function getHoursUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
}
