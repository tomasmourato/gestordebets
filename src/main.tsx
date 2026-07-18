import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {initLiveUpdate} from './lib/liveUpdate';
import './index.css';

// App nativa: verifica/descarrega atualizações do frontend em segundo plano
// (self-hosted na Vercel). Na web é um no-op. Nunca bloqueia o arranque.
initLiveUpdate();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
