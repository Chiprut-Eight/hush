import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo2.png'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        // Don't let the service worker serve index.html from cache for navigation.
        // Firebase Hosting sets Cross-Origin-Opener-Policy: same-origin-allow-popups,
        // but the service worker cache strips HTTP headers, breaking signInWithPopup.
        navigateFallbackDenylist: [/./],
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: 'HUSH Social',
        short_name: 'HUSH',
        description: 'Geo-acoustic social network',
        theme_color: '#0A0E17',
        background_color: '#0A0E17',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'hush_logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  }
});
