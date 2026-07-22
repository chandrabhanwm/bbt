import { Business, PlayerStats } from '../types';
import { bastiCity } from '../data/cityMapData';
import { isDistrictCompleted, getEmpireTotalInvested } from './districtProgress';

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  unlocked: boolean;
  progress: number;
}

// Category → representative business ids. Built from the real, current
// category mapping (businessCategoryPresentation.ts) rather than assumed —
// there are 7 real categories right now, not 8; the extra "8th" some
// earlier planning docs mentioned doesn't exist yet, so 7 Maharaja
// achievements are built, not a placeholder 8th for a category with no
// businesses in it.
const CATEGORY_BUSINESS_IDS: Record<string, string[]> = {
  'Food & Beverage': ['tea_stall', 'restaurant'],
  'Grocery': ['kirana_store'],
  'Dairy': ['dairy_shop'],
  'Bakery': ['bakery'],
  'Automotive': ['bike_repair'],
  'Healthcare': ['medical'],
  'Events': ['budget_lodge'],
};

const MAHARAJA_LEVEL_TARGET = 5;
const BUSINESS_COUNT_TIERS = [5, 10, 25, 50, 80];
// Cash tiers use Net Worth (cash + total invested), not raw current cash —
// in this game's economy, the only way cash ever leaves your balance is
// spending it on businesses, which getEmpireTotalInvested already tracks
// in full. So cash + invested is mathematically equivalent to "lifetime
// cash earned," without needing a new running-total tracker built just
// for this.
const NET_WORTH_TIERS = [
  { amount: 100000, label: '₹1L' },
  { amount: 1000000, label: '₹10L' },
  { amount: 10000000, label: '₹1Cr' },
];

/**
 * Computes the full achievement list from current game state. Pure and
 * side-effect free — both PortfolioScreen (for display) and App.tsx's
 * global unlock-detection effect (for the Milestone celebration) call
 * this same function, so there's exactly one definition of "what counts
 * as unlocked," not two that could drift apart.
 */
export function computeAchievements(stats: PlayerStats, businessesByDistrict: Record<string, Business[]>): Achievement[] {
  const allBusinesses: Business[] = Object.keys(businessesByDistrict).reduce(
    (acc: Business[], districtId) => acc.concat(businessesByDistrict[districtId]),
    []
  );
  const ownedCount = allBusinesses.filter((b) => b.level > 0).length;
  const netWorth = stats.cash + getEmpireTotalInvested(businessesByDistrict);

  const achievements: Achievement[] = [];

  // 7 category Maharaja achievements
  Object.entries(CATEGORY_BUSINESS_IDS).forEach(([category, businessIds]) => {
    const bestLevel = allBusinesses
      .filter((b) => businessIds.includes(b.id))
      .reduce((max, b) => Math.max(max, b.level), 0);
    achievements.push({
      id: `maharaja_${category.toLowerCase().replace(/[^a-z]/g, '_')}`,
      title: `${category} Maharaja`,
      desc: `Upgrade any ${category} business to Level ${MAHARAJA_LEVEL_TARGET} or higher.`,
      unlocked: bestLevel >= MAHARAJA_LEVEL_TARGET,
      progress: Math.min(100, Math.round((bestLevel / MAHARAJA_LEVEL_TARGET) * 100)),
    });
  });

  // 10 district champion achievements
  bastiCity.districts.forEach((district) => {
    const districtBusinesses = businessesByDistrict[district.id] ?? [];
    const completed = districtBusinesses.length > 0 && isDistrictCompleted(districtBusinesses);
    const ownedHere = districtBusinesses.filter((b) => b.level > 0).length;
    achievements.push({
      id: `champion_${district.id}`,
      title: `${district.name} Champion`,
      desc: `Complete every business in ${district.name}.`,
      unlocked: completed,
      progress: districtBusinesses.length > 0 ? Math.min(100, Math.round((ownedHere / districtBusinesses.length) * 100)) : 0,
    });
  });

  // 5 cumulative business-count tiers
  BUSINESS_COUNT_TIERS.forEach((tier) => {
    achievements.push({
      id: `own_${tier}`,
      title: `${tier} Businesses Strong`,
      desc: `Own ${tier} businesses across your empire.`,
      unlocked: ownedCount >= tier,
      progress: Math.min(100, Math.round((ownedCount / tier) * 100)),
    });
  });

  // 3 cumulative net-worth tiers (replaces the old single "Basti Crorepati")
  NET_WORTH_TIERS.forEach(({ amount, label }) => {
    achievements.push({
      id: `net_worth_${amount}`,
      title: `${label} Empire`,
      desc: `Reach ${label} in total net worth (cash + everything you've built).`,
      unlocked: netWorth >= amount,
      progress: Math.min(100, Math.round((netWorth / amount) * 100)),
    });
  });

  // Kept from the original 4 — genuinely unique, doesn't overlap with any
  // of the new categories above.
  achievements.push({
    id: 'daily_booster',
    title: 'Marketing Genius',
    desc: 'Claim at least one Daily Reward Card.',
    unlocked: stats.rewardCards.some((c) => c.claimed),
    progress: stats.rewardCards.some((c) => c.claimed) ? 100 : 0,
  });

  return achievements;
}
