import React from 'react';
import { createRoot } from 'react-dom/client';
import { DailyStreakCard } from './src/components/DailyStreakCard';
import { ShareEarnCard } from './src/components/ShareEarnCard';
import './src/index.css';
import './src/design-system/premium-theme.css';

function Preview() {
  return (
    <>
      <DailyStreakCard currentStreak={4} />
      <ShareEarnCard referrerUid="test123" bonusCoins={2000} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
