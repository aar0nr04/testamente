import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { App } from './app/App';
import { AuthProvider } from './contexts/AuthContext';
import { LocaleProvider } from './hooks/useLocale';
import './styles.css';

const rootElement = document.getElementById('root');
// GitHub Pages cannot rewrite deep SPA paths. Firebase Hosting keeps BrowserRouter and its rewrites.
const Router = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io') ? HashRouter : BrowserRouter;

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>
);
