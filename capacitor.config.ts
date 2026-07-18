import type { CapacitorConfig } from '@capacitor/cli';

// Configuração da app nativa (Android via Capacitor).
// Os assets web (dist/) são embutidos no APK e servidos de https://localhost;
// as chamadas à API apontam para a produção (ver src/lib/apiBase.ts) e o
// servidor tem CORS para esta origem (server.ts).
const config: CapacitorConfig = {
  appId: 'pt.bettrackr.app',
  appName: 'BetTrackr',
  webDir: 'dist',
  server: {
    // Origem https estável — necessária para localStorage/crypto e para o
    // CORS do servidor reconhecer a app.
    androidScheme: 'https',
  },
  android: {
    // Sem conteúdo http misturado — tudo é https (API) ou local.
    allowMixedContent: false,
  },
  // Cor de fundo enquanto o WebView arranca (evita flash branco no dark mode
  // e combina com o splash em ambos os temas).
  backgroundColor: '#0f172a',
  plugins: {
    // Live update self-hosted (src/lib/liveUpdate.ts): autoUpdate desligado
    // para o plugin NÃO contactar a cloud da Capgo — quem verifica/descarrega
    // somos nós, a partir da própria Vercel.
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
