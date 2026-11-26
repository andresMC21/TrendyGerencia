import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { adminApi, ApiError, type UserProfile, type UserRole } from '../lib/api';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

const POR_PAGINA = 6;
const ROLES: UserRole[] = ['USER', 'MODERATOR', 'ADMIN'];
const RL: Record<UserRole, string> = { USER: 'Usuario', MODERATOR: 'Moderador', ADMIN: 'Administrador' };

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
  const [stats, setStats] = useState<number[] | null>(null);
  const [version, setVersion] = useState(0);

  // Totales de la cabecera: se recalculan cuando cambia un rol o el estado de una cuenta.
  useEffect(() => {
    if (!token) return;
    let vigente = true;
    const contar = (f: Parameters<typeof adminApi.users>[1]) => adminApi.users(token, { ...f, limit: 1 }).then((r) => r.total);
    Promise.all([contar({}), contar({ isActive: true }), contar({ isActive: false }), contar({ role: 'ADMIN' }), contar({ role: 'MODERATOR' })])
      .then(([t, a, d, ad, mo]) => vigente && setStats([t, a, d, ad + mo]))
      .catch(() => vigente && setStats(null));
    return () => { vigente = false; };
  }, [token, version]);

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

  const reemplazar = (actualizado: UserProfile) => {
    setVersion((v) => v + 1);
    setEstado((e) =>
      e.tipo === 'ok'
        ? { ...e, items: e.items.map((u) => (u.id === actualizado.id ? actualizado : u)) }
        : e,
    );
  };

  const paginas = estado.tipo === 'ok' ? Math.max(1, Math.ceil(estado.total / POR_PAGINA)) : 1;
  const seg = <T extends string>(valor: T, set: (v: T) => void, opciones: [T, string][]) => (
    <div className="seg">
      {opciones.map(([v, l]) => (
        <button key={v || 'todos'} type="button" aria-pressed={valor === v} onClick={() => { set(v); setPagina(1); }}>{l}</button>
      ))}
    </div>
  );

  return (
    <>
      <Header />
      <main className="view on wrap" id="contenido">
        <div className="mph" style={{ marginTop: 18 }}>
          <div>
            <div className="kick" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', color: '#F77F00', textTransform: 'uppercase' }}>Administración</div>
            <h1 style={{ marginTop: 6 }}>Usuarios</h1>
            <p className="mu" style={{ margin: '8px 0 0', maxWidth: '62ch' }}>Cambia roles o desactiva cuentas. Desactivar cierra sus sesiones y le impide ingresar; sus datos se conservan.</p>
          </div>
        </div>
        <div className="stats">
          {[['Usuarios', 0], ['Activas', 1], ['Desactivadas', 2], ['Admins y moderadores', 3]].map(([l, k]) => (
            <div key={l}><b>{stats ? stats[k as number] : '—'}</b><span>{l}</span></div>
          ))}
        </div>
        <div className="adbar" role="search">
          <label className="search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" placeholder="Nombre o correo" aria-label="Buscar usuarios" value={busqueda} maxLength={100} onChange={(e) => setBusqueda(e.target.value)} />
          </label>
          <div className="sel">Rol{seg<'' | UserRole>(rol, setRol, [['', 'Todos'], ['USER', 'Usuario'], ['MODERATOR', 'Moderador'], ['ADMIN', 'Admin']])}</div>
          <div className="sel">Estado{seg<'' | 'true' | 'false'>(activo, setActivo, [['', 'Todas'], ['true', 'Activas'], ['false', 'Desactivadas']])}</div>
        </div>
        {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
        <ul className="ul" data-testid="admin-usuarios" aria-busy={estado.tipo === 'cargando'}>
          <li className="uh" aria-hidden="true"><span>Usuario</span><span>Roles</span><span>Estado</span><span style={{ textAlign: 'right' }}>Acciones</span></li>
          {estado.tipo === 'cargando' && [0, 1, 2].map((i) => <li key={i} className="ur skelrow"><div className="card skel" style={{ height: 44, gridColumn: '1/-1' }} /></li>)}
          {estado.tipo === 'ok' && estado.items.length === 0 && <li className="empty" style={{ border: 0 }}>No hay usuarios que coincidan con estos filtros.</li>}
          {estado.tipo === 'ok' && token && estado.items.map((u) => (
            <FilaUsuario key={`${u.id}-${u.role.join()}-${u.isActive}`} usuario={u} soyYo={u.id === user?.id} token={token} onCambio={reemplazar} />
          ))}
        </ul>
        {paginas > 1 && (
          <div className="pager" aria-label="Paginación">
            <button type="button" disabled={pagina === 1} aria-label="Anterior" onClick={() => setPagina(pagina - 1)}>←</button>
            {Array.from({ length: paginas }, (_, k) => <button key={k} type="button" aria-current={k + 1 === pagina} onClick={() => setPagina(k + 1)}>{k + 1}</button>)}
            <button type="button" disabled={pagina === paginas} aria-label="Siguiente" onClick={() => setPagina(pagina + 1)}>→</button>
          </div>
        )}
      </main>
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
    <li className={`ur${usuario.isActive ? '' : ' off'}`} data-testid="admin-usuario">
      <div className="who">
        <Avatar name={usuario.fullName} photoUrl={usuario.photoUrl} avatar={usuario.avatar} />
        <div>
          <b>{usuario.fullName}{soyYo && <span className="chip bl" style={{ marginLeft: 4 }}>Tú</span>}</b>
          <span>{usuario.email}</span>
        </div>
      </div>
      <div className="rl" role="group" aria-label={`Roles de ${usuario.fullName}`}>
        {ROLES.map((r) => (
          <button key={r} type="button" aria-pressed={roles.includes(r)} disabled={guardando !== null || (soyYo && r === 'ADMIN')}
            title={soyYo && r === 'ADMIN' ? 'No puedes quitarte el rol de administrador' : undefined} onClick={() => alternar(r)}>{RL[r]}</button>
        ))}
        {cambiaron && roles.length > 0 && <button type="button" className="save" disabled={guardando !== null} onClick={() => void guardarRoles()}>{guardando === 'roles' ? 'Guardando…' : 'Guardar'}</button>}
        {roles.length === 0 && <span className="err">Elige al menos un rol.</span>}
      </div>
      <div className="st"><span className={`chip ${usuario.isActive ? 'ok2' : 'n'}`}>{usuario.isActive ? 'Activa' : 'Desactivada'}</span></div>
      <div className="ua">
        {soyYo ? <span>Tu cuenta: no puedes quitarte el rol de admin ni desactivarla.</span>
          : confirmar ? <>
            <span style={{ color: '#B35C00' }}>Se cerrarán sus sesiones. ¿Seguro?</span>
            <button className="sbtn rf" type="button" disabled={guardando !== null} onClick={() => void cambiarEstado(false)}>{guardando === 'estado' ? 'Desactivando…' : 'Sí, desactivar'}</button>
            <button className="sbtn" type="button" disabled={guardando !== null} onClick={() => setConfirmar(false)}>No</button>
          </>
          : usuario.isActive ? <button className="sbtn r" type="button" disabled={guardando !== null} onClick={() => setConfirmar(true)}>Desactivar</button>
          : <button className="sbtn" type="button" disabled={guardando !== null} onClick={() => void cambiarEstado(true)}>{guardando === 'estado' ? 'Reactivando…' : 'Reactivar'}</button>}
      </div>
      {error && <p className="err" role="alert" style={{ gridColumn: '1/-1', margin: 0 }}>{error}</p>}
    </li>
  );
}
