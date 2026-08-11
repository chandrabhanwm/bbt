import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // autoUpdate — critical choice given this app is still under active
        // development during a test phase: a new build takes effect as soon
        // as it's deployed, instead of potentially serving testers a stale
        // cached version of the JS and silently undoing real bug fixes.
        registerType: 'autoUpdate',
        manifest: {
          name: 'Basti Business Tycoon',
          short_name: 'Basti Tycoon',
          description: 'Become the richest businessman in Basti.',
          start_url: '/',
          display: 'standalone',
          background_color: '#1a130e',
          theme_color: '#0a2e4a',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          // Resolves Chrome's two "Richer PWA Install UI won't be
          // available" warnings — one screenshot with form_factor 'wide'
          // for desktop, one without it (implicitly 'narrow') for mobile.
          // Both are real renders of the app's own business grid, not
          // stock/placeholder imagery.
          screenshots: [
            { src: '/screenshots/mobile-1.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow' },
            { src: '/screenshots/desktop-1.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide' },
          ],
        },
        // Deliberately minimal runtime caching — this game needs Firebase
        // connectivity anyway (auth, cloud save, leaderboard), so there's
        // no real offline-gameplay use case here. The goal of this PWA
        // setup is installability (add to home screen, standalone app
        // feel), not offline caching of dynamic data.
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
