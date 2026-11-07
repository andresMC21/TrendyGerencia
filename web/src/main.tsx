import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import './index.css';
import './theme.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { PageMotion } from './components/PageMotion';
import { SessionProvider } from './lib/session';
import { initializeTheme } from './lib/theme';
import { NebulaBackground } from './components/NebulaBackground';

initializeTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <NebulaBackground />
        <App />
        <PageMotion />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
);
