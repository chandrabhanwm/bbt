import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShareEarnCard } from './src/components/ShareEarnCard';
import './src/index.css';
import './src/design-system/premium-theme.css';

function Preview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ShareEarnCard referrerUid="test123" bonusCoins={2000} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
