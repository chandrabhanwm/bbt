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
  activeDoubleProfit: boolean;
  doubleProfitTimeRemaining: number; // in seconds
}

export interface LeaderboardUser {
  rank: number;
  name: string;
  cash: number;
  level: number;
  avatarEmoji: string;
  isPlayer?: boolean;
}

export interface CityArea {
  id: string;
  name: string;
  status: 'active' | 'locked';
  unlockCost: number;
  progress: number;
  image: string;
}
