import {StrictMode} from 'react';
import {createRoot, hydrateRoot} from 'react-dom/client';
import App from './App';
import './index.css';

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
