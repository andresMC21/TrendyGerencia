import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Footer, Header } from '../components/Brand';
import { EmptyState } from '../components/EmptyState';
import { Alert, Field, SelectField } from '../components/Form';
import { Skeleton } from '../components/Skeleton';
import { adminApi, ApiError, type UserProfile, type UserRole } from '../lib/api';
import { ROL } from '../lib/format';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

const POR_PAGINA = 10;
const ROLES: UserRole[] = ['USER', 'MODERATOR', 'ADMIN'];

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: UserProfile[]; total: number }
  | { tipo: 'error'; mensaje: string };

/** Traduce los mensajes de la API de administración. */
function mensajeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const texto = error.messages.join(' ');
  if (texto.includes('own admin role')) return 'No puedes quitarte el rol de administrador.';
  if (texto.includes('deactivate your own account')) return 'No puedes desactivar tu propia cuenta.';
  if (error.status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  if (error.status === 403) return 'Solo un administrador puede hacer este cambio.';
  if (error.status === 404) return 'Ese usuario ya no existe.';
  if (error.status === 0) return error.messages[0];
  return 'No pudimos guardar el cambio. Inténtalo de nuevo.';
}

/** HU-20 · Administrar usuarios: roles y estado de las cuentas (solo ADMIN). */
export default function AdminUsuarios() {
  const { token, user } = useSession();
  const [busqueda, setBusqueda] = useState('');
  const [termino, setTermino] = useState('');
  const [rol, setRol] = useState<'' | UserRole>('');
  const [activo, setActivo] = useState<'' | 'true' | 'false'>('');
  const [pagina, setPagina] = useState(1);
  const [resultado, setResultado] = useState<{ clave: string; estado: Estado } | null>(null);

  // Espera a que la persona deje de escribir antes de buscar.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTermino(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [busqueda]);

  // La clave identifica la consulta: si el resultado guardado es de otra, se muestra "cargando".
  const clave = JSON.stringify([termino, rol, activo, pagina]);
  const estado: Estado =
    resultado && resultado.clave === clave ? resultado.estado : { tipo: 'cargando' };
  const setEstado = (actualizar: (e: Estado) => Estado) =>
    setResultado((r) => (r ? { ...r, estado: actualizar(r.estado) } : r));

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    adminApi
      .users(token, {
        search: termino || undefined,
        role: rol || undefined,
        isActive: activo === '' ? undefined : activo === 'true',
        limit: POR_PAGINA,
        skip: (pagina - 1) * POR_PAGINA,
      })
      .then(
        (r) =>
          vigente &&
          setResultado({ clave, estado: { tipo: 'ok', items: r.data, total: r.total } }),
      )
      .catch(
        (e) => vigente && setResultado({ clave, estado: { tipo: 'error', mensaje: mensajeError(e) } }),
      );
    return () => {
      vigente = false;
    };
  }, [token, clave, termino, rol, activo, pagina]);

  const reemplazar = (actualizado: UserProfile) =>
    setEstado((e) =>
      e.tipo === 'ok'
        ? { ...e, items: e.items.map((u) => (u.id === actualizado.id ? actualizado : u)) }
        : e,
    );

  const paginas = estado.tipo === 'ok' ? Math.max(1, Math.ceil(estado.total / POR_PAGINA)) : 1;

  return (
    <>
      <Header />
      <main className="dashboard" id="contenido">
        <div className="container container--narrow">
          <h1 className="dash-title">Administrar usuarios</h1>
          <p className="tx-lead">
            Cambia los roles y activa o desactiva cuentas. Desactivar una cuenta conserva sus datos y
            cierra todas sus sesiones abiertas.
          </p>

          <div className="filters" role="search">
            <Field
              label="Buscar"
              type="search"
              placeholder="Nombre o correo"
              value={busqueda}
              maxLength={100}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <SelectField
              label="Rol"
              value={rol}
              onChange={(e) => {
                setRol(e.target.value as '' | UserRole);
                setPagina(1);
              }}
            >
              <option value="">Todos</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROL[r]}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Estado"
              value={activo}
              onChange={(e) => {
                setActivo(e.target.value as '' | 'true' | 'false');
                setPagina(1);
              }}
            >
              <option value="">Todas</option>
              <option value="true">Activas</option>
              <option value="false">Desactivadas</option>
            </SelectField>
          </div>

          {estado.tipo === 'cargando' && <Skeleton kind="transactions" />}
          {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <EmptyState kind="search">No hay usuarios que coincidan con estos filtros.</EmptyState>
          )}
          {estado.tipo === 'ok' && estado.items.length > 0 && (
            <>
              <p className="admin-count">
                {estado.total === 1 ? '1 usuario' : `${estado.total} usuarios`}
              </p>
              <ul className="tx-list" data-testid="admin-usuarios">
                {estado.items.map((u) => (
                  <FilaUsuario
                    key={`${u.id}-${u.role.join()}-${u.isActive}`}
                    usuario={u}
                    soyYo={u.id === user?.id}
                    token={token!}
                    onCambio={reemplazar}
                  />
                ))}
              </ul>
            </>
          )}

          {estado.tipo === 'ok' && paginas > 1 && (
            <nav className="pager" aria-label="Paginación">
              <button
                className="btn btn-outline btn-sm"
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {paginas}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagina >= paginas}
                onClick={() => setPagina(pagina + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function FilaUsuario({
  usuario,
  soyYo,
  token,
  onCambio,
}: {
  usuario: UserProfile;
  soyYo: boolean;
  token: string;
  onCambio: (u: UserProfile) => void;
}) {
  const [roles, setRoles] = useState<UserRole[]>(usuario.role);
  const [guardando, setGuardando] = useState<'roles' | 'estado' | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiaron =
    roles.length !== usuario.role.length || roles.some((r) => !usuario.role.includes(r));

  const alternar = (r: UserRole) =>
    setRoles((actual) =>
      actual.includes(r) ? actual.filter((x) => x !== r) : ROLES.filter((x) => x === r || actual.includes(x)),
    );

  const guardarRoles = async () => {
    setGuardando('roles');
    setError(null);
    try {
      const actualizado = await adminApi.changeRoles(token, usuario.id, roles);
      notify(`Roles de ${usuario.fullName} actualizados`);
      onCambio(actualizado);
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(null);
    }
  };

  const cambiarEstado = async (isActive: boolean) => {
    setGuardando('estado');
    setError(null);
    try {
      const actualizado = await adminApi.setActive(token, usuario.id, isActive);
      notify(isActive ? `Cuenta de ${usuario.fullName} reactivada` : `Cuenta de ${usuario.fullName} desactivada`);
      onCambio(actualizado);
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(null);
      setConfirmar(false);
    }
  };

  return (
    <li
      className={`tx-item admin-user${usuario.isActive ? '' : ' admin-user--inactive'}`}
      data-testid="admin-usuario"
    >
      <div className="admin-user__head">
        <Avatar name={usuario.fullName} photoUrl={usuario.photoUrl} />
        <div className="admin-user__who">
          <strong>
            {usuario.fullName}
            {soyYo && <span className="chip chip--blue admin-user__me">Tú</span>}
          </strong>
          <span className="tx-meta">{usuario.email}</span>
        </div>
        <span className={`chip chip--${usuario.isActive ? 'green' : 'gray'}`}>
          {usuario.isActive ? 'Activa' : 'Desactivada'}
        </span>
      </div>

      <fieldset className="admin-roles" disabled={guardando !== null}>
        <legend>Roles</legend>
        {ROLES.map((r) => {
          const bloqueado = soyYo && r === 'ADMIN';
          return (
            <label
              key={r}
              className={`check admin-role${roles.includes(r) ? ' admin-role--on' : ''}`}
              title={bloqueado ? 'No puedes quitarte el rol de administrador' : undefined}
            >
              <input
                type="checkbox"
                checked={roles.includes(r)}
                disabled={bloqueado}
                onChange={() => alternar(r)}
              />
              {ROL[r]}
            </label>
          );
        })}
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!cambiaron || roles.length === 0}
          onClick={guardarRoles}
        >
          {guardando === 'roles' ? 'Guardando…' : 'Guardar roles'}
        </button>
      </fieldset>
      {roles.length === 0 && <p className="field-error">Elige al menos un rol.</p>}

      <div className="admin-user__actions">
        {soyYo ? (
          <span className="tx-meta">
            Esta es tu cuenta: no puedes quitarte el rol de administrador ni desactivarla.
          </span>
        ) : usuario.isActive ? (
          confirmar ? (
            <>
              <span className="tx-meta tx-meta--todo">
                Se cerrarán sus sesiones y no podrá ingresar. Sus datos se conservan.
              </span>
              <button
                type="button"
                className="btn btn-danger-outline btn-sm"
                disabled={guardando !== null}
                onClick={() => cambiarEstado(false)}
              >
                {guardando === 'estado' ? 'Desactivando…' : 'Sí, desactivar'}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={guardando !== null}
                onClick={() => setConfirmar(false)}
              >
                Cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              disabled={guardando !== null}
              onClick={() => setConfirmar(true)}
            >
              Desactivar cuenta
            </button>
          )
        ) : (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={guardando !== null}
            onClick={() => cambiarEstado(true)}
          >
            {guardando === 'estado' ? 'Reactivando…' : 'Reactivar cuenta'}
          </button>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
    </li>
  );
}
