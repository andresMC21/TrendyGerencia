import { createRoutesFromElements, Navigate, Route } from 'react-router';
import { SoloInvitados, SoloUsuarios } from './components/RouteGuards';
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

export const routes = createRoutesFromElements(
    <>
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
    </>
);
