import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { useSession } from '../lib/session';
import { useTheme } from '../lib/theme';
import { Avatar } from './Avatar';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link viewTransition to={to} className="logo" aria-label="Trendy, ir al inicio">
      Trendy
    </Link>
  );
}

/** Lámpara de la cabecera: alterna el modo claro y oscuro. */
export function Lamp() {
  const { theme, toggle } = useTheme();
  const night = theme === 'dark';
  return (
    <button className="lamp" type="button" aria-pressed={night} onClick={toggle}>
      <span>{night ? 'Enciende el día' : 'Baja la luz'}</span>
      <svg width="44" height="50" viewBox="0 0 60 66" aria-hidden="true">
        <line x1="30" y1="0" x2="30" y2="9" stroke="currentColor" strokeWidth="2" />
        <path d="M10 30 Q30 2 50 30 Z" fill="#F77F00" stroke="#003049" strokeWidth="2.2" />
        <rect x="8" y="29" width="44" height="5" rx="2.5" fill="#003049" />
        <ellipse cx="30" cy="36" rx="8" ry="4" fill="#FCBF49" stroke="#003049" strokeWidth="1.6" />
        <g className="cord">
          <line x1="44" y1="34" x2="44" y2="54" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="44" cy="58" r="5" fill="#FCBF49" stroke="#003049" strokeWidth="1.6" />
        </g>
      </svg>
    </button>
  );
}

export function Header({ land = false }: { land?: boolean }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const enAuth = pathname === '/ingresar' || pathname === '/registro';
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!menu.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <header className={scrolled ? 'scrolled' : undefined}>
      <a className="skip-link" href="#contenido">Ir al contenido</a>
      <div className="wrap">
        <Logo to={user ? '/inicio' : '/'} />
        <nav className="main" aria-label="Principal">
          <Lamp />
          <NavLink viewTransition to="/explorar">Explorar</NavLink>
          {user ? (
            <>
              <NavLink viewTransition className="hide" to="/publicar">Publicar</NavLink>
              <NavLink viewTransition className="hide" to="/transacciones">Transacciones</NavLink>
              <div className="me-menu" ref={menu}>
                <button type="button" className="me-btn" aria-haspopup="menu" aria-expanded={open} aria-label="Tu cuenta" onClick={() => setOpen((v) => !v)}>
                  <Avatar name={user.fullName} photoUrl={user.photoUrl} avatar={user.avatar} />
                </button>
                {open && (
                  <div className="me-pop" role="menu" onClick={() => setOpen(false)}>
                    <div className="me-who"><b>{user.fullName}</b><span>{user.email}</span></div>
                    <Link role="menuitem" viewTransition to="/inicio">Inicio</Link>
                    <Link role="menuitem" viewTransition to="/perfil">Mi perfil</Link>
                    <Link role="menuitem" viewTransition to="/mis-publicaciones">Mis publicaciones</Link>
                    <Link role="menuitem" viewTransition to="/favoritos">Favoritos</Link>
                    <Link role="menuitem" viewTransition className="only-m" to="/publicar">Publicar</Link>
                    <Link role="menuitem" viewTransition className="only-m" to="/transacciones">Transacciones</Link>
                    {user.role.includes('ADMIN') && <Link role="menuitem" viewTransition to="/admin/usuarios">Administrar usuarios</Link>}
                    {(user.role.includes('ADMIN') || user.role.includes('MODERATOR')) && <Link role="menuitem" viewTransition to="/moderacion/verificaciones">Verificaciones</Link>}
                    <button role="menuitem" type="button" onClick={() => { navigate('/', { replace: true }); void logout(); }}>Cerrar sesión</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {!enAuth && <NavLink viewTransition className="hide" to="/ingresar">Ingresar</NavLink>}
              <Link viewTransition className={land ? undefined : 'btn2 cta'} to="/registro">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/** Las páginas internas del prototipo no llevan pie; la portada tiene el suyo. */
export function Footer() {
  return null;
}

/** Viñeta naranja. */
export function Dot() {
  return <span className="dot" aria-hidden="true" />;
}
