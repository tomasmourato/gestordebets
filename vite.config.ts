import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate', // Atualiza automaticamente os ficheiros da app em segundo plano
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Ficheiros estáticos fundamentais
        manifest: {
          name: 'BetTrackr',
          short_name: 'BetTrackr',
          description: 'Aplicação para gestão e análise de boletins de apostas desportivas',
          theme_color: '#000000', // Altera para a cor principal da tua app se desejares
          background_color: '#ffffff',
          display: 'standalone', // Abre a app em ecrã inteiro sem a barra do browser (como uma app nativa)
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable' // Garante que o Android não corta os cantos do ícone de forma feia
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
