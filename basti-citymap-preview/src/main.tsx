import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { CityMapScreen } from './components/citymap/CityMapScreen.tsx';
import './index.css';

// ---------------------------------------------------------------------
// TEMPORARY PREVIEW MODE: mounting only the new City Map screen so it can
// be reviewed on its own, per request. App.tsx and everything inside it
// (Home/City/Ranks/Profile, all existing gameplay) is completely untouched
// and still works exactly as before — to go back to it, just change the
// line below back to `<App />`.
// ---------------------------------------------------------------------
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div style={{ width: '100vw', height: '100vh' }}>
      <CityMapScreen />
    </div>
    {/* <App /> */}
  </StrictMode>,
);
