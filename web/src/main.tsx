import { Toast } from './components/Toast';
import '@fontsource/young-serif/400.css';
import '@fontsource/schibsted-grotesk/400.css';
import '@fontsource/schibsted-grotesk/700.css';
import './styles/app.css';
import './styles/app-extra.css';
import './styles/landing.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from 'react-router';
import { routes } from './App';
import { PageMotion } from './components/PageMotion';
import { SessionProvider } from './lib/session';
import { initializeTheme } from './lib/theme';

initializeTheme();

/** Las páginas internas usan los estilos de .pg-app; la portada tiene los suyos (.pg-land). */
function Shell() {
  const { pathname } = useLocation();
  return (
    <div className={pathname === '/' ? 'pg-root' : 'pg-app'}>
      <Outlet />
      <Toast />
      <PageMotion />
    </div>
  );
}

const router = createBrowserRouter([{
  element: (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  ),
  children: routes,
}]);

createRoot(document.getElementById('root')!).render(
  <StrictMode><RouterProvider router={router} /></StrictMode>,
);
