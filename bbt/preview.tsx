import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DailyRewardCards } from './src/components/DailyRewardCards';
import './src/index.css';
import './src/design-system/premium-theme.css';

function Preview() {
  const [cards, setCards] = useState([
    { scratched: false, value: 5000, claimed: false, tier: 'rare' as const },
    { scratched: false, value: 500, claimed: false, tier: 'small' as const },
    { scratched: false, value: 1500, claimed: false, tier: 'medium' as const },
  ]);
  return (
    <div style={{ padding: '16px', minHeight: '100vh', background: '#0A1A24' }}>
      <DailyRewardCards
        cards={cards}
        onScratch={(i) => setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, scratched: true } : c))}
        onClaim={() => {}}
        lastCardClaimAt={0}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
