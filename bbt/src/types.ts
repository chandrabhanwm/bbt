export interface Business {
  id: string;
  name: string;
  level: number;
  cost: number;
  baseCost: number;
  costMultiplier: number;
  profitPerMin: number;
  baseProfitPerMin: number;
  unlockAt: number;
  status: 'locked' | 'unlocked';
  emoji: string;
  gradient: string;
  description: string;
  themeColor: string; // Hex code for building accents
  /** Optional level cap, used only by the 'all_maxed' completion rule.
   *  Unset for every business today — leaving upgrades uncapped exactly
   *  as before. Reserved for a future slice. */
  maxLevel?: number;
}

/** A single Daily Reward Card. The value is generated at reset time (not
 *  at scratch time) — the reward already "exists" under the foil before
 *  anyone touches it, same as a real scratch card, so re-opening the app
 *  before scratching never changes what's underneath. tier drives which
 *  icon shows once revealed — it travels with the card regardless of
 *  which position (1/2/3) it gets shuffled into each reset. */
export interface RewardCard {
  scratched: boolean;
  value: number;
  claimed: boolean;
  tier: 'small' | 'medium' | 'rare';
}

export interface PlayerStats {
  cash: number;
  profitPerMin: number;
  rank: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  /** Claim pool — ticks every second at profitPerMin (already the true
   *  combined total across every district, confirmed directly in the
   *  reducer that computes it), accrues in real time even while the app
   *  is closed (via lastPoolClaimAt), caps at 3 hours' worth, and resets
   *  to zero once claimed. */
  poolCash: number;
  /** Real wall-clock ms timestamp of the last pool claim — the basis for
   *  computing offline accrual on next load. Client-clock based
   *  (Date.now()) rather than server-validated: a fine, deliberate
   *  tradeoff for a single-player game with no competitive/real-money
   *  stakes riding on it yet. Revisit only if that changes. */
  lastPoolClaimAt: number;
  /** Three Daily Reward Cards, replacing the old flat Daily Income Boost.
   *  Same one-consistent-rule-everywhere principle as the pool: any
   *  scratched-but-unclaimed value expires at reset rather than carrying
   *  forward, same as unclaimed pool income does. */
  rewardCards: RewardCard[];
  lastCardsResetAt: number;
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  cash: number;
  level: number;
  avatarEmoji: string;
  isPlayer?: boolean;
  /** Optional display-only stats for the Rankings screen's spotlight/list
   *  presentation. Not used by any ranking/sort logic. */
  districtsOwned?: number;
  passiveIncome?: number;
}

export interface CityArea {
  id: string;
  name: string;
  status: 'active' | 'locked';
  unlockCost: number;
  progress: number;
  image: string;
}
