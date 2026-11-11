import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useSession } from './lib/session';
import Explorar from './pages/Explorar';
import Favoritos from './pages/Favoritos';
import Ingresar from './pages/Ingresar';
import Inicio from './pages/Inicio';
import Landing from './pages/Landing';
import MisPublicaciones from './pages/MisPublicaciones';
import Perfil from './pages/Perfil';
import Producto from './pages/Producto';
import Publicar from './pages/Publicar';
import Registro from './pages/Registro';
import Transaccion from './pages/Transaccion';
import Transacciones from './pages/Transacciones';

function SoloInvitados({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? <Navigate to="/inicio" replace /> : children;
}

function SoloUsuarios({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  if (loading) return <div className="page-loading" />;
  return user ? children : <Navigate to="/ingresar" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/registro"
        element={
          <SoloInvitados>
            <Registro />
          </SoloInvitados>
        }
      />
      <Route
        path="/ingresar"
        element={
          <SoloInvitados>
            <Ingresar />
          </SoloInvitados>
        }
      />
      <Route
        path="/inicio"
        element={
          <SoloUsuarios>
            <Inicio />
          </SoloUsuarios>
        }
      />
      <Route
        path="/perfil"
        element={
          <SoloUsuarios>
            <Perfil />
          </SoloUsuarios>
        }
      />
      <Route
        path="/publicar"
        element={
          <SoloUsuarios>
            <Publicar />
          </SoloUsuarios>
        }
      />
      <Route
        path="/mis-publicaciones"
        element={
          <SoloUsuarios>
            <MisPublicaciones />
          </SoloUsuarios>
        }
      />
      <Route
        path="/favoritos"
        element={
          <SoloUsuarios>
            <Favoritos />
          </SoloUsuarios>
        }
      />
      <Route
        path="/transacciones"
        element={
          <SoloUsuarios>
            <Transacciones />
          </SoloUsuarios>
        }
      />
      <Route
        path="/transacciones/:id"
        element={
          <SoloUsuarios>
            <Transaccion />
          </SoloUsuarios>
        }
      />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/producto/:id" element={<Producto />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
