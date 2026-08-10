import React from 'react';
import { createRoot } from 'react-dom/client';
import { DailyStreakCard } from './src/components/DailyStreakCard';
import { RivalCalloutCard } from './src/components/RivalCalloutCard';
import { ShareEarnCard } from './src/components/ShareEarnCard';
import './src/index.css';
import './src/design-system/premium-theme.css';

const board = [
  { uid: 'u1', playerName: 'Rajesh K.', avatarEmoji: '👨‍🍳', netWorth: 1820000, profitPerMin: 8450, level: 12, updatedAt: Date.now(), weeklyPoints: 340, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 20, poolClaimsCount: 0, distinctBusinessesOwned: 12, totalLevelSum: 95 },
  { uid: 'u2', playerName: 'Priya S.', avatarEmoji: '👩', netWorth: 1560000, profitPerMin: 7120, level: 11, updatedAt: Date.now(), weeklyPoints: 300, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 16, poolClaimsCount: 0, distinctBusinessesOwned: 10, totalLevelSum: 40 },
  { uid: 'me', playerName: 'You', avatarEmoji: '👦', netWorth: 1340000, profitPerMin: 6890, level: 9, updatedAt: Date.now(), weeklyPoints: 280, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 15, poolClaimsCount: 0, distinctBusinessesOwned: 9, totalLevelSum: 22 },
];

function Preview() {
  return (
    <>
      <DailyStreakCard currentStreak={4} />
      <RivalCalloutCard leaderboard={board} myRank={3} myProfitPerMin={6890} myAvatar="👦" />
      <ShareEarnCard referrerUid="test123" bonusCoins={2000} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
