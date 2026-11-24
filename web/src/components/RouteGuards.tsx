import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '../lib/session';

export function SoloInvitados({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? <Navigate to="/inicio" replace /> : children;
}

/** HU-20 · Solo cuentas con rol ADMIN; los demás vuelven a su inicio. */
export function SoloAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  if (!user) return <Navigate to="/ingresar" replace />;
  return user.role.includes('ADMIN') ? children : <Navigate to="/inicio" replace />;
}

export function SoloUsuarios({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? children : <Navigate to="/ingresar" replace />;
}

