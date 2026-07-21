import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App from './App';
import {initLiveUpdate} from './lib/liveUpdate';
import './index.css';

// App nativa: verifica/descarrega atualizações do frontend em segundo plano
// (self-hosted na Vercel). Na web é um no-op. Nunca bloqueia o arranque.
initLiveUpdate();

const root = document.getElementById('root')!;
const initialData = window.__BETTRACKR_INITIAL_DATA__;
const app = (
  <StrictMode>
    <App initialData={initialData} />
  </StrictMode>
);

if (root.hasChildNodes() && initialData) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
