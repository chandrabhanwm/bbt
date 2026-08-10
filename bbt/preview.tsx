import React from 'react';
import { createRoot } from 'react-dom/client';
import { PortfolioScreen } from './src/components/PortfolioScreen';
import { buildBusinessesForDistrict } from './src/data/districtBusinesses';
import './src/index.css';
import './src/design-system/premium-theme.css';

const businessesByDistrict: any = {
  badeban: buildBusinessesForDistrict('badeban').map((b, i) => {
    const levels = [6, 6, 4, 3, 2, 1, 0, 0];
    return levels[i] > 0 ? { ...b, level: levels[i], status: 'unlocked' } : b;
  }),
  katra: buildBusinessesForDistrict('katra').map((b, i) => {
    const levels = [6, 6, 6, 6, 6, 6, 6, 6]; // fully complete district
    return { ...b, level: levels[i], status: 'unlocked' };
  }),
};

const stats: any = {
  cash: 340000, profitPerMin: 8450, level: 6, xp: 400, nextLevelXp: 1583,
  poolCash: 50000, lastPoolClaimAt: Date.now(), unlockedAchievementIds: [],
  weeklyPoints: 0, adsWatchedCount: 0, totalPlayTimeSeconds: 0,
  hasMadeFirstPurchase: true, hasMadeFirstUpgrade: true, businessesBoughtCount: 15,
  poolClaimsCount: 3, distinctBusinessesOwned: 14, legacyCount: 0, legacyPoints: 0,
  hasClaimedSincePoolCooldown: true, highestBadgeCelebrated: 0,
  rewardCards: [], lastCardsResetAt: Date.now(), dailyReferralClaimsCount: 0, dailyReferralClaimsDate: '',
  currentStreak: 4, longestStreak: 4, lastStreakLoginDate: '',
};

function Preview() {
  return (
    <PortfolioScreen
      stats={stats}
      businessesByDistrict={businessesByDistrict}
      avatarEmoji="👦"
      playerName="You"
      onSignOut={() => {}}
      onClaimPool={() => 0}
      onDoubleClaim={() => false}
      onManageDistrict={() => {}}
      onEstablishLegacy={() => {}}
    />
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
