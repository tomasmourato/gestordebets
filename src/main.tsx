import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {ErrorBoundary} from './components/ErrorBoundary';
import {initLiveUpdate} from './lib/liveUpdate';
import {hideSplashScreen} from './lib/splash';
import './index.css';

// Chunk desatualizado após um novo deploy: a app aberta há algum tempo ainda
// referencia hashes de chunks lazy antigos; ao trocar de separador (React.lazy)
// o import dinâmico dá 404 e, sem isto, a app ficava em branco. O Vite emite
// `vite:preloadError` quando um import dinâmico falha — recarregamos uma vez
// para apanhar o index.html novo (com os hashes atuais). Limitado a um reload
// por 30s para nunca entrar em loop se o chunk estiver mesmo em falta.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", () => {
    const KEY = "bt:lastChunkReload";
    const last = Number(sessionStorage.getItem(KEY) || 0);
    if (Date.now() - last > 30_000) {
      sessionStorage.setItem(KEY, String(Date.now()));
      window.location.reload();
    }
  });
}

// App nativa: verifica/descarrega atualizações do frontend em segundo plano
// (self-hosted na Vercel). Na web é um no-op. Nunca bloqueia o arranque.
initLiveUpdate();

// Esconde o splash nativo assim que o React pinta. Chamado aqui (e não num
// shell) porque o primeiro ecrã pode ser o login — que vive fora dos shells.
hideSplashScreen();

// SPA pura: sem SSR das páginas, o servidor devolve sempre o index.html vazio
// e o React monta tudo no cliente (a App determina auth/dados no arranque).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
