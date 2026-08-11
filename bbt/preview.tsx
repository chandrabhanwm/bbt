import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginScreen } from './src/components/LoginScreen';
import './src/index.css';
import './src/design-system/premium-theme.css';

createRoot(document.getElementById('root')!).render(
  <LoginScreen onSignedIn={() => {}} />
);
