import { Toast } from './components/Toast';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/open-sans/700.css';
import './index.css';
import './theme.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { routes } from './App';
import { PageMotion } from './components/PageMotion';
import { SessionProvider } from './lib/session';
import { initializeTheme } from './lib/theme';
import { NebulaBackground } from './components/NebulaBackground';

initializeTheme();

const router = createBrowserRouter([{
  element: (
    <SessionProvider>
      <NebulaBackground />
      <Outlet />
      <Toast />
      <PageMotion />
    </SessionProvider>
  ),
  children: routes,
}]);

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
);
