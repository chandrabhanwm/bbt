import React from 'react';
import { createRoot } from 'react-dom/client';
import { LeaderboardTab } from './src/components/LeaderboardTab';
import './src/index.css';
import './src/design-system/premium-theme.css';

// Fake but realistic data matching the reference image's shape
const board = [
  { uid: 'u1', playerName: 'Rajesh K.', avatarEmoji: '👨‍🍳', netWorth: 1820000, profitPerMin: 8450, level: 12, updatedAt: Date.now(), weeklyPoints: 340, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 20, poolClaimsCount: 0, distinctBusinessesOwned: 12 },
  { uid: 'u2', playerName: 'Priya S.', avatarEmoji: '👩', netWorth: 1560000, profitPerMin: 7120, level: 11, updatedAt: Date.now(), weeklyPoints: 300, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 16, poolClaimsCount: 0, distinctBusinessesOwned: 10 },
  { uid: 'me', playerName: 'You', avatarEmoji: '👦', netWorth: 1340000, profitPerMin: 6890, level: 9, updatedAt: Date.now(), weeklyPoints: 280, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 15, poolClaimsCount: 0, distinctBusinessesOwned: 9 },
  { uid: 'u4', playerName: 'Amit P.', avatarEmoji: '👨', netWorth: 980000, profitPerMin: 5340, level: 8, updatedAt: Date.now(), weeklyPoints: 220, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 10, poolClaimsCount: 0, distinctBusinessesOwned: 7 },
];

function Preview() {
  return (
    <LeaderboardTab
      leaderboard={board}
      myUid="me"
      myRank={3}
      playerName="You"
      playerAvatar="👦"
      playerNetWorth={1340000}
      playerProfitPerMin={6890}
      playerDistinctBusinessesOwned={9}
      playerLevel={9}
      weeklyContestBoard={board}
      myWeeklyRank={3}
      myWeeklyPoints={280}
      lastLeaderboardFetchAt={Date.now()}
    />
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
