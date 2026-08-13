import React from 'react';
import { createRoot } from 'react-dom/client';
import { TutorialBanner } from './src/components/TutorialBanner';
import { DailyStreakCard } from './src/components/DailyStreakCard';
import { ShareEarnCard } from './src/components/ShareEarnCard';
import './src/index.css';
import './src/design-system/premium-theme.css';

function Preview() {
  return (
    <>
      <TutorialBanner
        icon="👉"
        title="Buy your first business"
        message="Tap any business card below to open it and make your first purchase."
      />
      <DailyStreakCard currentStreak={4} />
      <ShareEarnCard referrerUid="test123" bonusCoins={2000} />
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
