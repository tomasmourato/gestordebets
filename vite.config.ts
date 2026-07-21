import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Instante deste build. Vai (a) embutido no bundle como __BUILD_TIME__, para
// o código saber a idade do bundle que está a correr, e (b) escrito em
// dist/build-time.json, que o scripts/bundle-app.mjs copia para
// app-version.json. Com os dois valores, o live update consegue recusar
// bundles que NÃO sejam mais recentes do que o que já corre (ver
// src/lib/liveUpdate.ts) — sem isto, um APK novo era "atualizado" para um
// bundle de produção mais antigo.
const BUILD_TIME = Date.now();

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  build: {
    rollupOptions: {
      output: {
        // Divide as dependências pesadas em chunks próprios: o arranque (login,
        // shell) deixa de descarregar/parsear o Recharts inteiro, o que pesa
        // sobretudo no WebView Android da app nativa. Chunks separados também
        // cacheiam melhor: mudar código da app não invalida o vendor.
        manualChunks: {
          'vendor-charts': ['recharts'],
          'vendor-motion': ['motion'],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      // Escreve o mesmo BUILD_TIME num ficheiro, para o empacotador do live
      // update (scripts/bundle-app.mjs) o publicar em app-version.json.
      name: 'bettrackr-build-time',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'build-time.json',
          source: JSON.stringify({ buildTime: BUILD_TIME }) + '\n',
        });
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png'],
      workbox: {
        // O index.html (app shell) NÃO é pré-cacheado. Cada navegação vai
        // sempre à rede e recebe o shell atual, que referencia os assets com o
        // hash correto. Isto elimina o bug do "shell obsoleto": antes o SW
        // servia um index.html em cache de um build antigo, cujos assets já
        // tinham sido removidos no deploy seguinte -> ecrã em branco no desktop.
        // Só os assets imutáveis (com hash no nome) são pré-cacheados, para
        // carregamento rápido; a app continua instalável (o SW tem fetch handler).
        // Esta app precisa sempre de rede (login/BD/API), por isso não perdemos
        // funcionalidade offline útil.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff,woff2}'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'BetTrackr',
        short_name: 'BetTrackr',
        description: 'Aplicação para gestão e análise de boletins de apostas desportivas',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            // 'any' e 'maskable' têm de vir em entradas separadas.
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'wide',
            label: 'BetTrackr Desktop'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'BetTrackr Mobile'
          }
        ]
      }
    })
  ]
});
