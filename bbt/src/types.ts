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
  /** Last time the flat Daily Income Boost was claimed, or null if never
   *  claimed. Gates the once-per-24-hours reward. */
  lastDailyBoostClaimAt: number | null;
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
