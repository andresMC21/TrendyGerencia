import { createRoutesFromElements, Navigate, Route } from 'react-router';
import { SoloAdmin, SoloInvitados, SoloModeracion, SoloUsuarios } from './components/RouteGuards';
import AdminUsuarios from './pages/AdminUsuarios';
import EditarPublicacion from './pages/EditarPublicacion';
import Explorar from './pages/Explorar';
import Favoritos from './pages/Favoritos';
import Ingresar from './pages/Ingresar';
import Inicio from './pages/Inicio';
import Landing from './pages/Landing';
import MisPublicaciones from './pages/MisPublicaciones';
import ModerarVerificaciones from './pages/ModerarVerificaciones';
import Perfil from './pages/Perfil';
import PerfilPublico from './pages/PerfilPublico';
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
        path="/editar/:id"
        element={
          <SoloUsuarios>
            <EditarPublicacion />
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
      <Route
        path="/usuario/:id"
        element={
          <SoloUsuarios>
            <PerfilPublico />
          </SoloUsuarios>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <SoloAdmin>
            <AdminUsuarios />
          </SoloAdmin>
        }
      />
      <Route
        path="/moderacion/verificaciones"
        element={
          <SoloModeracion>
            <ModerarVerificaciones />
          </SoloModeracion>
        }
      />
      <Route path="/explorar" element={<Explorar />} />
      <Route path="/producto/:id" element={<Producto />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </>
);
