import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'FitnessPal',
      short_name: 'FitnessPal',
      description: 'Track food, calories, and macros',
      theme_color: '#f3f4f6',
      background_color: '#f3f4f6',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        {
          src: 'pwa-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'pwa-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'open-food-facts',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
          },
        },
      ],
    },
  }), cloudflare()],
  server: {
    host: true,
  },
})