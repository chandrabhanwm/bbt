import React from 'react';
import { createRoot } from 'react-dom/client';
import { PortfolioScreen } from './src/components/PortfolioScreen';
import { buildBusinessesForDistrict } from './src/data/districtBusinesses';
import './src/index.css';
import './src/design-system/premium-theme.css';

// Realistic mid-game state: totalLevelSum around 40-50, past a few
// badges, with more still locked ahead — good spread to check both states.
const businessesByDistrict: any = {
  badeban: buildBusinessesForDistrict('badeban').map((b, i) => {
    const levels = [6, 6, 4, 3, 2, 1, 0, 0];
    return levels[i] > 0 ? { ...b, level: levels[i], status: 'unlocked' } : b;
  }),
};

const stats: any = {
  cash: 340000, profitPerMin: 8450, level: 6, xp: 400, nextLevelXp: 1583,
  poolCash: 50000, lastPoolClaimAt: Date.now(), unlockedAchievementIds: [],
  weeklyPoints: 0, adsWatchedCount: 0, totalPlayTimeSeconds: 0,
  hasMadeFirstPurchase: true, hasMadeFirstUpgrade: true, businessesBoughtCount: 15,
  poolClaimsCount: 3, distinctBusinessesOwned: 6, legacyCount: 0, legacyPoints: 0,
  hasClaimedSincePoolCooldown: true, highestBadgeCelebrated: 0,
  rewardCards: [], lastCardsResetAt: Date.now(), dailyReferralClaimsCount: 0, dailyReferralClaimsDate: '',
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
