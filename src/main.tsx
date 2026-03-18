import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.log('ServiceWorker registration failed:', err);
    });
  });
}

// Prevent context menu in game
window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
  const isGameActive = document.querySelector('[data-game-active="true"]');
  if (isGameActive) {
    e.preventDefault();
    e.returnValue = '';
  }
});

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
