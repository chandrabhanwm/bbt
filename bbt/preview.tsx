import React from 'react';
import { createRoot } from 'react-dom/client';
import { BusinessGridView } from './src/components/BusinessGridView';
import { buildBusinessesForDistrict } from './src/data/districtBusinesses';
import { recomputeDistrictProfits } from './src/utils/strategyEngine';
import './src/index.css';
import './src/design-system/premium-theme.css';

// Show Badeban (tea_stall, bakery, restaurant) and Bus Stand (bus_cafe, dhaba) - all 5 fixed businesses
const badeban = recomputeDistrictProfits('badeban', buildBusinessesForDistrict('badeban').map((b, i) => i < 4 ? { ...b, level: 1, status: 'unlocked' } : b));
const busStand = recomputeDistrictProfits('bus_stand', buildBusinessesForDistrict('bus_stand').map((b, i) => i < 4 ? { ...b, level: 1, status: 'unlocked' } : b));

function Preview() {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ color: 'white', fontFamily: 'sans-serif' }}>Badeban</h2>
      <BusinessGridView businesses={badeban} onSelectShop={() => {}} readOnly={false} justUpdatedBusinessId={null} cash={500000} contestPointsCelebrationId={null} />
      <h2 style={{ color: 'white', fontFamily: 'sans-serif' }}>Bus Stand</h2>
      <BusinessGridView businesses={busStand} onSelectShop={() => {}} readOnly={false} justUpdatedBusinessId={null} cash={500000} contestPointsCelebrationId={null} />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Preview />);
