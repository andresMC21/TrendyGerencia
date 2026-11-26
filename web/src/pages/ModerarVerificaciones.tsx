import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert, TextAreaField } from '../components/Form';
import { ApiError, moderationApi, type UserProfile } from '../lib/api';
import { fecha } from '../lib/format';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

const POR_PAGINA = 10;
const MAX_MOTIVO = 300;

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: UserProfile[]; total: number }
  | { tipo: 'error'; mensaje: string };

/** Traduce los mensajes de la API de moderación. */
function mensajeError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  const texto = error.messages.join(' ');
  if (texto.includes('own verification')) return 'No puedes resolver tu propia solicitud.';
  if (error.status === 401) return 'Tu sesión venció. Vuelve a iniciar sesión.';
  if (error.status === 403) return 'Solo moderadores y administradores pueden resolver verificaciones.';
  if (error.status === 404) return 'Ese usuario ya no existe.';
  if (error.status === 409) return 'Esta solicitud ya fue resuelta por otra persona.';
  if (error.status === 0) return error.messages[0];
  return 'No pudimos resolver la solicitud. Inténtalo de nuevo.';
}

/** HU-19 · Resolver verificaciones: solicitudes de identidad pendientes (MODERATOR y ADMIN). */
export default function ModerarVerificaciones() {
  const { token, user } = useSession();
  const [pagina, setPagina] = useState(1);
  const [recarga, setRecarga] = useState(0);
  const [resultado, setResultado] = useState<{ clave: string; estado: Estado } | null>(null);

  // La clave identifica la consulta: si el resultado guardado es de otra, se muestra "cargando".
  const clave = JSON.stringify([pagina, recarga]);
  const estado: Estado =
    resultado && resultado.clave === clave ? resultado.estado : { tipo: 'cargando' };

  useEffect(() => {
    if (!token) return;
    let vigente = true;
    moderationApi
      .pending(token, { limit: POR_PAGINA, skip: (pagina - 1) * POR_PAGINA })
      .then((r) => {
        if (!vigente) return;
        // Si la última solicitud de esta página se resolvió, vuelve a la anterior.
        if (r.data.length === 0 && pagina > 1) {
          setPagina(pagina - 1);
          return;
        }
        setResultado({ clave, estado: { tipo: 'ok', items: r.data, total: r.total } });
      })
      .catch(
        (e) => vigente && setResultado({ clave, estado: { tipo: 'error', mensaje: mensajeError(e) } }),
      );
    return () => {
      vigente = false;
    };
  }, [token, clave, pagina]);

  const paginas = estado.tipo === 'ok' ? Math.max(1, Math.ceil(estado.total / POR_PAGINA)) : 1;

  return (
    <>
      <Header />
      <main className="view on wrap" id="contenido">
        <div className="mph" style={{ marginTop: 18 }}>
          <div>
            <div className="kick" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.14em', color: '#F77F00', textTransform: 'uppercase' }}>Moderación</div>
            <h1 style={{ marginTop: 6 }}>Verificaciones</h1>
            <p className="mu" style={{ margin: '8px 0 0', maxWidth: '64ch' }}>Revisa las solicitudes de la más antigua a la más reciente. Al aprobar, la cuenta queda verificada; al rechazar, la persona puede volver a solicitarla. No puedes resolver tu propia solicitud.</p>
          </div>
          {estado.tipo === 'ok' && <span className="count">{estado.total === 1 ? '1 pendiente' : `${estado.total} pendientes`}</span>}
        </div>
        {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
        <ul className="ul vlist" data-testid="verificaciones-pendientes" aria-busy={estado.tipo === 'cargando'}>
          {estado.tipo === 'cargando' && [0, 1].map((i) => <li key={i} className="ur skelrow"><div className="card skel" style={{ height: 44, gridColumn: '1/-1' }} /></li>)}
          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <li className="empty" style={{ border: 0 }}><img src="/img/libros.webp" alt="" /><h2 style={{ marginTop: 10 }}>Todo al día</h2><p className="mu" style={{ margin: 0 }}>No hay solicitudes de verificación pendientes.</p></li>
          )}
          {estado.tipo === 'ok' && token && estado.items.map((u) => (
            <FilaSolicitud key={u.id} solicitante={u} esMia={u.id === user?.id} token={token} onResuelta={() => setRecarga((n) => n + 1)} />
          ))}
        </ul>
        {estado.tipo === 'ok' && paginas > 1 && (
          <div className="pager" aria-label="Paginación">
            <button type="button" disabled={pagina === 1} aria-label="Anterior" onClick={() => setPagina(pagina - 1)}>←</button>
            {Array.from({ length: paginas }, (_, k) => <button key={k} type="button" aria-current={k + 1 === pagina} onClick={() => setPagina(k + 1)}>{k + 1}</button>)}
            <button type="button" disabled={pagina >= paginas} aria-label="Siguiente" onClick={() => setPagina(pagina + 1)}>→</button>
          </div>
        )}
      </main>
    </>
  );
}

function FilaSolicitud({
  solicitante,
  esMia,
  token,
  onResuelta,
}: {
  solicitante: UserProfile;
  esMia: boolean;
  token: string;
  onResuelta: () => void;
}) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState<'aprobar' | 'rechazar' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolver = async (aprobar: boolean) => {
    setGuardando(aprobar ? 'aprobar' : 'rechazar');
    setError(null);
    try {
      await moderationApi.resolve(token, solicitante.id, aprobar, motivo.trim() || undefined);
      notify(aprobar ? `Verificación de ${solicitante.fullName} aprobada` : `Verificación de ${solicitante.fullName} rechazada`);
      onResuelta();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(null);
      // Si otra persona ya la resolvió, la lista se actualiza para que desaparezca.
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) onResuelta();
    }
  };

  const pedida = solicitante.verificationRequestedAt ?? solicitante.updatedAt;

  return (
    <li className="vreq" data-testid={`verificacion-${solicitante.id}`}>
      <div className="who">
        <Avatar name={solicitante.fullName} photoUrl={solicitante.photoUrl} avatar={solicitante.avatar} />
        <div>
          <b>{solicitante.fullName}{esMia && <span className="chip bl" style={{ marginLeft: 6 }}>Tú</span>}</b>
          <span>{solicitante.email}</span>
          {pedida && <span data-testid="solicitada-el">Solicitada el {fecha(pedida)}</span>}
        </div>
        <span className="chip bl" style={{ marginLeft: 'auto' }}>En revisión</span>
      </div>
      {solicitante.info && <p className="bio">“{solicitante.info}”</p>}
      <div className="ua">
        {esMia ? (
          <span className="mu">Esta es tu solicitud: otra persona de moderación debe resolverla.</span>
        ) : rechazando ? (
          <div className="rej">
            <TextAreaField label="Motivo (opcional)" value={motivo} maxLength={MAX_MOTIVO} rows={2}
              hint="La persona lo verá en su perfil para saber qué corregir." count={`${motivo.length}/${MAX_MOTIVO}`}
              onChange={(e) => setMotivo(e.target.value)} />
            <div className="acts">
              <button type="button" className="sbtn rf" data-testid={`confirmar-rechazo-${solicitante.id}`} disabled={guardando !== null} onClick={() => void resolver(false)}>
                {guardando === 'rechazar' ? 'Rechazando…' : 'Confirmar rechazo'}
              </button>
              <button type="button" className="sbtn" disabled={guardando !== null} onClick={() => setRechazando(false)}>Cancelar</button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" className="btn" data-testid={`aprobar-${solicitante.id}`} disabled={guardando !== null} onClick={() => void resolver(true)}>
              {guardando === 'aprobar' ? 'Aprobando…' : 'Aprobar'}
            </button>
            <button type="button" className="sbtn r" data-testid={`rechazar-${solicitante.id}`} disabled={guardando !== null} onClick={() => setRechazando(true)}>Rechazar</button>
          </>
        )}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </li>
  );
}
