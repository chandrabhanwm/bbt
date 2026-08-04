import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShopDetailSheet } from './src/components/ShopDetailSheet';
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

const params = new URLSearchParams(window.location.search);
const mode = params.get('mode') ?? 'unowned';

function Preview() {
  if (mode === 'unowned') {
    return <ShopDetailSheet business={businesses[6]} index={6} cash={5000000} onUpgrade={() => {}} onClose={() => {}} readOnly={false} districtId="badeban" districtBusinesses={businesses} />;
  }
  if (mode === 'maxed') {
    return <ShopDetailSheet business={businesses[0]} index={0} cash={5000000} onUpgrade={() => {}} onClose={() => {}} readOnly={false} districtId="badeban" districtBusinesses={businesses} />;
  }
  if (mode === 'locked') {
    return <ShopDetailSheet business={businesses[7]} index={7} cash={5000000} onUpgrade={() => {}} onClose={() => {}} readOnly={true} districtId="badeban" districtBusinesses={businesses} />;
  }
  return null;
}

createRoot(document.getElementById('root')!).render(<Preview />);
