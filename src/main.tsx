import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {initLiveUpdate} from './lib/liveUpdate';
import {hideSplashScreen} from './lib/splash';
import './index.css';

// App nativa: verifica/descarrega atualizações do frontend em segundo plano
// (self-hosted na Vercel). Na web é um no-op. Nunca bloqueia o arranque.
initLiveUpdate();

// Esconde o splash nativo assim que o React pinta. Chamado aqui (e não num
// shell) porque o primeiro ecrã pode ser o login — que vive fora dos shells.
hideSplashScreen();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
