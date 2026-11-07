import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useSession } from '../lib/session';
import { useTheme } from '../lib/theme';
import { PullLamp } from './PullLamp';

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Trendy, ir al inicio">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#1A3272" />
        <path
          d="M32 18a5 5 0 1 1 5 5c-2 0-5 1.5-5 4v2M32 29 12 43c-2 1.4-1 4 1.4 4h37.2c2.4 0 3.4-2.6 1.4-4L32 29Z"
          fill="none"
          stroke="#fff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="50" cy="16" r="5" fill="#F7941D" />
      </svg>
      <span>Trendy</span>
    </Link>
  );
}

export function Header() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useSession();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <div className="container header-inner">
        <Logo />
        <div className="header-lamp">
          <span>{theme === 'dark' ? 'Enciende el día' : 'Baja la luz'}</span>
          <PullLamp on={theme === 'light'} onToggle={toggle} label={theme === 'dark' ? 'Tira para activar el modo claro' : 'Tira para activar el modo oscuro'} />
        </div>
        <button className="mobile-menu-button" type="button" aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? 'Cerrar' : 'Menú'} <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
        </button>
        <nav id="main-navigation" aria-label="Navegación principal" className={`header-nav${menuOpen ? ' is-open' : ''}`} onClick={(event) => {
          if ((event.target as HTMLElement).closest('a')) setMenuOpen(false);
        }} onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); document.querySelector<HTMLButtonElement>('.mobile-menu-button')?.focus(); } }}>
          <span className="city-tag">Cali, CO</span>
          <NavLink to="/explorar" className="nav-link">
            Explorar
          </NavLink>
          {user ? (
            <>
              <NavLink to="/inicio" className="nav-link">
                Mi Trendy
              </NavLink>
              <NavLink to="/publicar" className="nav-link">
                Publicar
              </NavLink>
              <NavLink to="/transacciones" className="nav-link">
                Transacciones
              </NavLink>
              <NavLink to="/perfil" className="nav-link">
                Mi perfil
              </NavLink>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  // Primero salir de la ruta protegida; si no, su guardia redirige a /ingresar.
                  navigate('/', { replace: true });
                  void logout();
                }}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <NavLink to="/ingresar" className="nav-link">
                Ingresar
              </NavLink>
              <Link to="/registro" className="btn btn-primary btn-sm">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <span>
          <strong>Trendy</strong> · Espacio digital local para dar una segunda vida a tus objetos
        </span>
      </div>
    </footer>
  );
}

/** Viñeta naranja del informe. */
export function Dot() {
  return <span className="dot" aria-hidden="true" />;
}
