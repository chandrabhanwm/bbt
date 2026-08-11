import { PlayerStats } from '../types';
import { progressionConfig } from '../config/progressionConfig';

// Structured point values — each action is worth what it actually
// represents, weighted specifically to keep the points leaderboard
// aligned with genuinely good play in a synergy-driven strategy game,
// not working against it.
//
// The daily cap on upgrades from the previous version is gone
// entirely — it turned out to be solving a problem that doesn't
// exist. A business can only ever be upgraded 5 times (level 1→6),
// and there are only 80 businesses in the whole game, so total
// possible upgrade actions (400, ever) are just as naturally bounded
// as total possible new-business purchases (80, ever). The cap wasn't
// preventing an infinite farm; it was discouraging the exact
// deep-investment play the game is built around, since a capped,
// flat-10 upgrade earned less overall than uncapped, flat-25 new
// purchases. Removing the cap alone — not per-level scaling — is what
// actually fixes that: a single flat, uncapped upgrade value already
// makes fully maxing one business (buy + 5 upgrades) worth more than
// buying several shallow ones, with far less to reason about than a
// 5-tier escalating table.
//
// SYNERGY_DISCOVERED_BONUS is the other deliberate piece: the one
// point source tied directly to the strategic layer itself —
// completing a synergy combo — rather than to activity volume. This
// is the direct answer to points otherwise rewarding "buy wide" over
// "build smart."
const POINTS = {
  scratch_card: 5,
  claim: 10,
  upgrade: 15,
  new_business: 20,
  referral: 50,
  synergy_discovered_bonus: 30,
} as const;

export function todayDateString(): string {
  // Local timezone, deliberately — NOT UTC. For a player in India
  // (UTC+5:30), UTC midnight is actually 5:30 AM local time, so a
  // UTC-based date string was resetting daily caps at the wrong real
  // moment. getFullYear/getMonth/getDate are all local-timezone methods
  // in JavaScript, unlike getUTCFullYear etc.
  const d = new Date();
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Same local-date-string logic as todayDateString, but for an
 *  arbitrary past timestamp — used to check "did the calendar day
 *  change since X happened" (e.g. the scratch cards' last reset)
 *  without needing a separate stored date-string field alongside the
 *  existing timestamp. */
export function localDateStringOf(timestampMs: number): string {
  const d = new Date(timestampMs);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

type ContestAction = 'buy_or_upgrade' | 'claim' | 'scratch_card' | 'referral';

interface ContestPointsResult {
  stats: PlayerStats;
  pointsAwarded: boolean;
}

/**
 * Applies points-leaderboard scoring to a stats update — action-based
 * only, never wealth-based, per the confirmed design. This runs as a
 * permanent, all-time leaderboard with NO automatic weekly reset and
 * NO Sunday freeze window — both were removed deliberately. The only
 * way points ever reset to zero is a manual bump of
 * progressionConfig.pointsSeasonId (see that file for how to trigger
 * one), detected below by comparing it against what's stored on this
 * player's own save.
 *
 * isNewBusiness distinguishes a first-time purchase (POINTS.new_business)
 * from a level-up (POINTS.upgrade) — both flat values, no daily cap,
 * no per-level scaling. See the POINTS comment above for why a flat,
 * uncapped upgrade value is enough on its own to make deep investment
 * pay off at least as well as shallow spreading.
 *
 * synergyDiscovered is true only on the exact action that caused a
 * previously-inactive synergy to newly turn on — the same detection
 * already computed by the caller for the "Synergy Discovered!"
 * milestone celebration, reused here rather than recomputed. When
 * true, POINTS.synergy_discovered_bonus is added on top of whatever
 * the underlying buy/upgrade action already earned, not in place of
 * it — completing a synergy combo is additively more valuable than
 * the same action without one, not an alternate reward path.
 *
 * Returns pointsAwarded alongside the updated stats — callers use this
 * to decide whether to show a points celebration.
 */
export function applyContestPoints(
  prev: PlayerStats,
  action: ContestAction,
  isNewBusiness: boolean = false,
  synergyDiscovered: boolean = false,
): ContestPointsResult {
  // A season mismatch means a manual reset was triggered since this
  // player last played — their points start fresh at zero, and their
  // stored season catches up to match the current one.
  const seasonRolledOver = prev.pointsSeasonId !== progressionConfig.pointsSeasonId;
  const weeklyPointsBase = seasonRolledOver ? 0 : prev.weeklyPoints;

  let pointsForThisAction: number;
  if (action === 'buy_or_upgrade') {
    pointsForThisAction = isNewBusiness ? POINTS.new_business : POINTS.upgrade;
  } else if (action === 'claim') {
    pointsForThisAction = POINTS.claim;
  } else if (action === 'scratch_card') {
    pointsForThisAction = POINTS.scratch_card;
  } else {
    pointsForThisAction = POINTS.referral;
  }

  if (synergyDiscovered) {
    pointsForThisAction += POINTS.synergy_discovered_bonus;
  }

  return {
    stats: {
      ...prev,
      weeklyPoints: weeklyPointsBase + pointsForThisAction,
      pointsSeasonId: progressionConfig.pointsSeasonId,
    },
    pointsAwarded: true,
  };
}

// A fixed reference Monday (local time, arbitrary but stable — any
// Monday works, this one just has to never change once chosen).
// Every player's device computes "weeks since this Monday" using
// their own local clock, giving the exact same week boundary reasoning
// already used for todayDateString() — no server needed to keep every
// player's device agreeing on when a new week starts.
const REFERENCE_MONDAY = new Date(2026, 0, 5, 0, 0, 0, 0); // Jan 5, 2026 — a Monday

/** A stable identifier for "which contest week is it right now,"
 *  local-time based. Two players' devices in different timezones
 *  might disagree by up to a day right at the boundary — the same
 *  honest trade-off already accepted for the daily streak's local-time
 *  reasoning — but this is consistent for any single player across
 *  every session. */
export function getContestWeekId(): string {
  const now = new Date();
  const msSinceReference = now.getTime() - REFERENCE_MONDAY.getTime();
  const weeksSinceReference = Math.floor(msSinceReference / (7 * 24 * 60 * 60 * 1000));
  return `W${weeksSinceReference}`;
}

/** Reward tiers for the contest week that just ended, based on the
 *  player's last-known rank during that week (see the rollover
 *  detection in App.tsx for how "last known" is tracked, since there's
 *  no exact server-side snapshot at the precise week boundary — an
 *  honest, acceptable trade-off for an in-game currency reward, not a
 *  real-money prize needing disputable precision). Flat cash amounts,
 *  same scale as the daily streak's own reward range, so a top
 *  contest finish feels comparable in weight to a strong streak, not
 *  wildly larger or smaller. */
export function getContestReward(rank: number | null): number {
  if (rank === null) return 0; // never ranked at all during that week — nothing to reward
  if (rank === 1) return 10000;
  if (rank <= 3) return 5000;
  if (rank <= 10) return 2000;
  return 500; // ranked, but outside the top 10 — a small participation reward
}
