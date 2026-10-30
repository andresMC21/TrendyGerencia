import { Link, useNavigate } from 'react-router';
import { useSession } from '../lib/session';

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
  const { user, logout } = useSession();
  const navigate = useNavigate();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo />
        <nav className="header-nav">
          <span className="city-tag">Cali, CO</span>
          {user ? (
            <>
              <Link to="/inicio" className="nav-link">
                Mi Trendy
              </Link>
              <Link to="/publicar" className="nav-link">
                Publicar
              </Link>
              <Link to="/perfil" className="nav-link">
                Mi perfil
              </Link>
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
              <Link to="/ingresar" className="nav-link">
                Ingresar
              </Link>
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
        <span>Equipo Calamares · Innovación y emprendimiento II</span>
      </div>
    </footer>
  );
}

/** Viñeta naranja del informe. */
export function Dot() {
  return <span className="dot" aria-hidden="true" />;
}
