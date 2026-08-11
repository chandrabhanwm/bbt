import React from 'react';
import { createRoot } from 'react-dom/client';
import { LeaderboardTab } from './src/components/LeaderboardTab';
import './src/index.css';
import './src/design-system/premium-theme.css';

const board = [
  { uid: 'u1', playerName: 'Rajesh K.', avatarEmoji: '👨‍🍳', netWorth: 1820000, profitPerMin: 8450, level: 12, updatedAt: Date.now(), weeklyPoints: 340, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 20, poolClaimsCount: 0, distinctBusinessesOwned: 12, totalLevelSum: 95 },
  { uid: 'me', playerName: 'You', avatarEmoji: '👦', netWorth: 1340000, profitPerMin: 6890, level: 9, updatedAt: Date.now(), weeklyPoints: 280, currentDistrictId: 'badeban', totalPlayTimeSeconds: 0, adsWatchedCount: 0, businessesBoughtCount: 15, poolClaimsCount: 0, distinctBusinessesOwned: 9, totalLevelSum: 22 },
];

function Preview() {
  return (
    <LeaderboardTab
      leaderboard={board} myUid="me" myRank={2}
      playerName="You" playerAvatar="👦" playerNetWorth={1340000}
      playerProfitPerMin={6890} playerDistinctBusinessesOwned={9}
      playerTotalLevelSum={22} playerLevel={9}
      weeklyContestBoard={board} myWeeklyRank={2} myWeeklyPoints={280}
      lastLeaderboardFetchAt={Date.now()}
    />
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
