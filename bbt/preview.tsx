import React from 'react';
import { createRoot } from 'react-dom/client';
import { CityMapScreen } from './src/components/citymap/CityMapScreen';
import './src/index.css';
import './src/design-system/premium-theme.css';

const unlockedIds = new Set(['badeban', 'katra', 'court_area']);

function Preview() {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <CityMapScreen
        isDistrictUnlocked={(id) => unlockedIds.has(id)}
        currentDistrictId="badeban"
        districtProgress={{
          badeban: { income: 12000, businessesOwned: 8, businessesTotal: 8, completionPercent: 100, completed: true, stars: 3, districtLevel: 3 },
          katra: { income: 4000, businessesOwned: 3, businessesTotal: 8, completionPercent: 37, completed: false, stars: 1, districtLevel: 1 },
          court_area: { income: 0, businessesOwned: 0, businessesTotal: 8, completionPercent: 0, completed: false, stars: 0, districtLevel: 0 },
        }}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
