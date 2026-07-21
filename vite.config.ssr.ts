import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Build SSR do entry-server (React) para dist-ssr/entry-server.js.
// É um config separado do vite.config.ts porque o SSR não precisa do PWA nem
// do Tailwind (a árvore da App não importa CSS) e o outDir é outro.
export default defineConfig({
  plugins: [react()],
  build: {
    ssr: 'src/entry-server.tsx',
    outDir: 'dist-ssr',
    emptyOutDir: true,
  },
  ssr: {
    // Bundle auto-contido (só os builtins do Node ficam externos): na Vercel o
    // file-trace da função apenas inclui os node_modules importados
    // estaticamente pelo server.ts, por isso react-dom e as restantes
    // dependências do SSR não existiriam em runtime se ficassem externas.
    noExternal: true,
  },
});
