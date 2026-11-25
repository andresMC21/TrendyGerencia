import { useEffect, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Footer, Header } from '../components/Brand';
import { EmptyState } from '../components/EmptyState';
import { Alert, TextAreaField } from '../components/Form';
import { Skeleton } from '../components/Skeleton';
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
      <main className="dashboard" id="contenido">
        <div className="container container--narrow">
          <h1 className="dash-title">Resolver verificaciones</h1>
          <p className="tx-lead">
            Revisa las solicitudes de verificación de identidad, de la más antigua a la más reciente.
            Al aprobar, la cuenta queda verificada; al rechazar, la persona puede volver a
            solicitarla. No puedes resolver tu propia solicitud.
          </p>

          {estado.tipo === 'cargando' && <Skeleton kind="transactions" />}
          {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <EmptyState kind="search">No hay solicitudes de verificación pendientes.</EmptyState>
          )}
          {estado.tipo === 'ok' && estado.items.length > 0 && (
            <>
              <p className="admin-count">
                {estado.total === 1 ? '1 solicitud pendiente' : `${estado.total} solicitudes pendientes`}
              </p>
              <ul className="tx-list" data-testid="verificaciones-pendientes">
                {estado.items.map((u) => (
                  <FilaSolicitud
                    key={u.id}
                    solicitante={u}
                    esMia={u.id === user?.id}
                    token={token!}
                    onResuelta={() => setRecarga((n) => n + 1)}
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
      notify(
        aprobar
          ? `Verificación de ${solicitante.fullName} aprobada`
          : `Verificación de ${solicitante.fullName} rechazada`,
      );
      onResuelta();
    } catch (e) {
      setError(mensajeError(e));
      setGuardando(null);
      // Si otra persona ya la resolvió, la lista se actualiza para que desaparezca.
      if (e instanceof ApiError && (e.status === 409 || e.status === 404)) onResuelta();
    }
  };

  return (
    <li className="tx-item admin-user" data-testid={`verificacion-${solicitante.id}`}>
      <div className="admin-user__head">
        <Avatar name={solicitante.fullName} photoUrl={solicitante.photoUrl} />
        <div className="admin-user__who">
          <strong>
            {solicitante.fullName}
            {esMia && <span className="chip chip--blue admin-user__me">Tú</span>}
          </strong>
          <span className="tx-meta">{solicitante.email}</span>
          {(solicitante.verificationRequestedAt ?? solicitante.updatedAt) && (
            <span className="tx-meta" data-testid="solicitada-el">
              Solicitada el {fecha((solicitante.verificationRequestedAt ?? solicitante.updatedAt)!)}
            </span>
          )}
        </div>
        <span className="chip chip--blue">En revisión</span>
      </div>

      {solicitante.info && <p className="tx-meta">{solicitante.info}</p>}

      <div className="admin-user__actions">
        {esMia ? (
          <span className="tx-meta">
            Esta es tu solicitud: otra persona de moderación debe resolverla.
          </span>
        ) : rechazando ? (
          <>
            <TextAreaField
              label="Motivo (opcional)"
              value={motivo}
              maxLength={MAX_MOTIVO}
              rows={2}
              hint={`${motivo.length}/${MAX_MOTIVO}. Queda en el registro del servidor, no en el perfil.`}
              onChange={(e) => setMotivo(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              data-testid={`confirmar-rechazo-${solicitante.id}`}
              disabled={guardando !== null}
              onClick={() => resolver(false)}
            >
              {guardando === 'rechazar' ? 'Rechazando…' : 'Confirmar rechazo'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={guardando !== null}
              onClick={() => setRechazando(false)}
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              data-testid={`aprobar-${solicitante.id}`}
              disabled={guardando !== null}
              onClick={() => resolver(true)}
            >
              {guardando === 'aprobar' ? 'Aprobando…' : 'Aprobar'}
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              data-testid={`rechazar-${solicitante.id}`}
              disabled={guardando !== null}
              onClick={() => setRechazando(true)}
            >
              Rechazar
            </button>
          </>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}
    </li>
  );
}
