import React from 'react';
import { createRoot } from 'react-dom/client';
import { MilestoneOverlay } from './src/components/MilestoneOverlay';
import './src/index.css';
import './src/design-system/premium-theme.css';

createRoot(document.getElementById('root')!).render(
  <MilestoneOverlay data={{
    icon: '🏆',
    title: '🏆 Grand Champion',
    message: "You've reached 300 total business levels across CoralBay.",
    bonusText: 'A new prestige badge, unlocked.',
    color: 'gold',
  }} />
);
