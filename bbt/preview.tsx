import React from 'react';
import { createRoot } from 'react-dom/client';
import { BusinessGridView } from './src/components/BusinessGridView';
import { buildBusinessesForDistrict } from './src/data/districtBusinesses';
import { recomputeDistrictProfits } from './src/utils/strategyEngine';
import './src/index.css';
import './src/design-system/premium-theme.css';

const seeded = buildBusinessesForDistrict('badeban').map((b, i) => {
  const levels = [6, 4, 3, 2, 1, 0, 0, 0];
  const level = levels[i] ?? 0;
  if (level === 0) return b;
  return { ...b, level, status: 'unlocked' as const };
});
const businesses = recomputeDistrictProfits('badeban', seeded);

function Preview() {
  return (
    <div style={{ padding: '16px', minHeight: '100vh' }}>
      <BusinessGridView
        businesses={businesses}
        onSelectShop={() => {}}
        readOnly={false}
        justUpdatedBusinessId={null}
        cash={500000}
        contestPointsCelebrationId={null}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
