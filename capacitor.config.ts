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
      // Instalar um APK novo volta ao bundle embutido, descartando bundles
      // descarregados antes. Sem isto, um bundle antigo já transferido
      // sobrevivia à reinstalação e continuava a substituir a app nova.
      resetWhenUpdate: true,
    },
    // Teclado: empurra o corpo (não sobrepõe) para os campos e as bottom
    // sheets ficarem sempre visíveis; combina com adjustResize no manifesto.
    Keyboard: {
      resize: "body" as any,
    },
    // Splash com a marca em vez do flash de fundo; escondido pela app após o
    // primeiro paint (src/mobile/lib/useNativeChrome.ts).
    // O splash esconde-se sozinho ao fim de launchShowDuration. É uma rede de
    // segurança deliberada: com launchAutoHide:false, qualquer bundle que não
    // chamasse SplashScreen.hide() (ex.: um bundle antigo vindo do live
    // update) deixava a app presa no splash para sempre. A app continua a
    // escondê-lo mal pinta (src/lib/splash.ts), muito antes deste limite.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 3000,
      backgroundColor: "#09090b",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
