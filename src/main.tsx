import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ensureSeeded } from './store/store';
import './styles.css';

ensureSeeded();

const root = document.getElementById('root');
if (!root) throw new Error('Élément racine introuvable.');

createRoot(root).render(
  <StrictMode>
    {/* HashRouter : l'app fonctionne sur n'importe quel hébergement statique. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => undefined);
  });
}
