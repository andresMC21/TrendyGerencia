import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '../lib/session';

export function SoloInvitados({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? <Navigate to="/inicio" replace /> : children;
}

export function SoloUsuarios({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? children : <Navigate to="/ingresar" replace />;
}

