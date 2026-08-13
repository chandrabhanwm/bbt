import React from 'react';
import { createRoot } from 'react-dom/client';
import { BusinessGridView } from './src/components/BusinessGridView';
import { buildBusinessesForDistrict } from './src/data/districtBusinesses';
import { recomputeDistrictProfits } from './src/utils/strategyEngine';
import './src/index.css';
import './src/design-system/premium-theme.css';

const badeban = recomputeDistrictProfits('badeban', buildBusinessesForDistrict('badeban'));
const busStand = recomputeDistrictProfits('bus_stand', buildBusinessesForDistrict('bus_stand'));

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
