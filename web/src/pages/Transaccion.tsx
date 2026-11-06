import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ApiError, transactionApi, type Transaction as Tx } from '../lib/api';
import { ESTADO_TRANSACCION, etapaAcuerdo, fechaHora } from '../lib/format';
import { nombrePunto, SAFE_POINTS } from '../lib/safePoints';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; tx: Tx }
  | { tipo: 'ajena' }
  | { tipo: 'no-existe' }
  | { tipo: 'error' };

/**
 * HU-16 · Detalle y acuerdo del punto seguro entre comprador y vendedor.
 * HU-17 · Finalizar o cancelar el intercambio.
 */
export default function Transaccion() {
  const { id = '' } = useParams();
  return <TransaccionPagina key={id} id={id} />;
}

function TransaccionPagina({ id }: { id: string }) {
  const { token } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token) return;
    let activo = true;
    transactionApi
      .get(token, id)
      .then((tx) => activo && setEstado({ tipo: 'ok', tx }))
      .catch((err) => {
        if (!activo) return;
        if (err instanceof ApiError && err.status === 403) return setEstado({ tipo: 'ajena' });
        if (err instanceof ApiError && (err.status === 404 || err.status === 400))
          return setEstado({ tipo: 'no-existe' });
        setEstado({ tipo: 'error' });
      });
    return () => {
      activo = false;
    };
  }, [id, token]);

  // HU-16 · Mientras la transacción siga abierta, se consulta cada pocos segundos para
  // ver la respuesta de la otra persona (propuesta, aceptación o cancelación).
  const abierta =
    estado.tipo === 'ok' && (estado.tx.status === 'PENDING' || estado.tx.status === 'AGREED_POINT');
  useEffect(() => {
    if (!token || !abierta) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      transactionApi
        .get(token, id)
        .then((tx) =>
          setEstado((prev) =>
            prev.tipo === 'ok' && prev.tx.updatedAt === tx.updatedAt ? prev : { tipo: 'ok', tx },
          ),
        )
        .catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [abierta, id, token]);

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <Link to="/transacciones" className="back-link">
            ← Volver a mis transacciones
          </Link>

          {estado.tipo === 'cargando' && <div className="feed-loading">Cargando transacción…</div>}
          {estado.tipo === 'ajena' && (
            <Alert tone="error">
              No participas en esta transacción, así que no puedes verla ni modificarla.
            </Alert>
          )}
          {estado.tipo === 'no-existe' && (
            <Alert tone="info">Esta transacción no existe.</Alert>
          )}
          {estado.tipo === 'error' && (
            <Alert tone="error">No pudimos cargar la transacción. Inténtalo de nuevo.</Alert>
          )}
          {estado.tipo === 'ok' && (
            <Detalle tx={estado.tx} onChange={(tx) => setEstado({ tipo: 'ok', tx })} />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Detalle({ tx, onChange }: { tx: Tx; onChange: (tx: Tx) => void }) {
  const { user } = useSession();
  const e = ESTADO_TRANSACCION[tx.status] ?? { label: tx.status, tone: 'gray' };
  const soyComprador = tx.buyerId === user?.id;
  // HU-17 · aviso que debe sobrevivir aunque la sección de acciones desaparezca.
  const [aviso, setAviso] = useState('');

  return (
    <article className="product-detail">
      <div className="product-top">
        <span className="product-cat">{soyComprador ? 'Compra' : 'Venta'}</span>
        <span className={`chip chip--${e.tone}`} data-testid="transaccion-estado">
          {e.label}
        </span>
      </div>

      <h1>
        {tx.product ? (
          <Link to={`/producto/${tx.productId}`} className="product-link">
            {tx.product.title}
          </Link>
        ) : (
          'Transacción'
        )}
      </h1>

      <dl className="profile-data profile-data--plain">
        <div>
          <dt>Comprador</dt>
          <dd>{tx.buyer?.fullName ?? tx.buyerId}</dd>
        </div>
        <div>
          <dt>Vendedor</dt>
          <dd>{tx.seller?.fullName ?? tx.sellerId}</dd>
        </div>
        {tx.message && (
          <div>
            <dt>Mensaje</dt>
            <dd>{tx.message}</dd>
          </div>
        )}
        <div>
          <dt>Referencia</dt>
          <dd className="tx-ref">{tx.id}</dd>
        </div>
      </dl>

      <h2 className="detail-h">Entrega presencial</h2>
      {tx.status === 'PENDING' ? (
        <AcordarEncuentro tx={tx} onChange={onChange} />
      ) : tx.safePointId && tx.scheduledTime && (tx.agreedAt || tx.status !== 'CANCELLED') ? (
        <div className="meeting-box" data-testid="encuentro-acordado">
          <span className="meeting-kicker">Acordado por los dos</span>
          <strong>{nombrePunto(tx.safePointId)}</strong>
          <span>{fechaHora(tx.scheduledTime)}</span>
        </div>
      ) : (
        <Alert tone="info">Esta transacción no llegó a acordar un punto de encuentro.</Alert>
      )}

      <h2 className="detail-h">Resultado del intercambio</h2>
      {aviso && <Alert tone="error">{aviso}</Alert>}
      {tx.status === 'COMPLETED' && (
        <div data-testid="resultado-final">
          <Alert tone="success">
            <strong>Intercambio completado.</strong> El producto quedó marcado como vendido.
          </Alert>
        </div>
      )}
      {tx.status === 'CANCELLED' && (
        <div data-testid="resultado-final">
          <Alert tone="info">
            <strong>Transacción cancelada.</strong>{' '}
            {tx.product?.status === 'REMOVED'
              ? 'Después, quien vendía retiró la publicación (HU-13), así que ya no está disponible.'
              : 'El producto se liberó y volvió a estar disponible para otros compradores.'}
          </Alert>
        </div>
      )}
      {(tx.status === 'PENDING' || tx.status === 'AGREED_POINT') && (
        <CerrarIntercambio tx={tx} onChange={onChange} onAviso={setAviso} />
      )}
    </article>
  );
}

type Accion = 'COMPLETED' | 'CANCELLED';

const CONFIRMACION: Record<Accion, { pregunta: string; detalle: string; boton: string }> = {
  COMPLETED: {
    pregunta: '¿Ya se encontraron y se hizo el intercambio?',
    detalle: 'La transacción quedará completada y el producto pasará a vendido. No se puede deshacer.',
    boton: 'Sí, completar',
  },
  CANCELLED: {
    pregunta: '¿Seguro que quieres cancelar esta transacción?',
    detalle: 'El producto volverá a estar disponible para otros compradores. No se puede deshacer.',
    boton: 'Sí, cancelar',
  },
};

/** HU-17 · Comprador o vendedor completan o cancelan la transacción. */
function CerrarIntercambio({
  tx,
  onChange,
  onAviso,
}: {
  tx: Tx;
  onChange: (tx: Tx) => void;
  onAviso: (mensaje: string) => void;
}) {
  const { token } = useSession();
  const [pendiente, setPendiente] = useState<Accion | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const puedeCompletar = tx.status === 'AGREED_POINT';

  async function enviar(accion: Accion) {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    onAviso('');
    try {
      const updated = await transactionApi.updateStatus(token, tx.id, accion);
      onChange({ ...tx, ...updated });
    } catch (err) {
      setPendiente(null);
      if (err instanceof ApiError && err.status === 401) {
        setError('Tu sesión expiró. Vuelve a ingresar para actualizar la transacción.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Solo el comprador y el vendedor pueden completar o cancelar esta transacción.');
      } else if (err instanceof ApiError && err.status === 409) {
        // La otra persona ya la completó o canceló: se avisa y se muestra el estado real.
        onAviso('La transacción cambió de estado mientras tanto. Te mostramos su estado actual.');
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos actualizar la transacción. Inténtalo de nuevo.');
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  if (pendiente) {
    const c = CONFIRMACION[pendiente];
    return (
      <section
        className={`tx-confirm tx-confirm--${pendiente === 'CANCELLED' ? 'danger' : 'ok'}`}
        role="alertdialog"
        aria-labelledby="tx-confirm-q"
        aria-describedby="tx-confirm-d"
      >
        <strong id="tx-confirm-q">{c.pregunta}</strong>
        <p id="tx-confirm-d">{c.detalle}</p>
        <div className="tx-actions">
          <button
            type="button"
            className={`btn ${pendiente === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => enviar(pendiente)}
            disabled={sending}
            data-testid="btn-confirmar"
          >
            {sending ? 'Guardando…' : c.boton}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setPendiente(null)}
            disabled={sending}
          >
            No, volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tx-close" aria-label="Finalizar o cancelar el intercambio">
      {error && <Alert tone="error">{error}</Alert>}
      <p className="field-hint">
        {puedeCompletar
          ? 'Cuando se encuentren y hagan el intercambio, márcalo como completado. Si no se va a dar, cancélalo para liberar el producto.'
          : 'Para marcarla como completada, primero los dos deben acordar el punto seguro y el horario. Si ya no se va a dar, puedes cancelarla.'}
      </p>
      <div className="tx-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setPendiente('COMPLETED')}
          disabled={!puedeCompletar}
          data-testid="btn-completar"
        >
          Marcar como completada
        </button>
        <button
          type="button"
          className="btn btn-danger-outline"
          onClick={() => setPendiente('CANCELLED')}
          data-testid="btn-cancelar"
        >
          Cancelar transacción
        </button>
      </div>
    </section>
  );
}

/** Valor mínimo para <input type="datetime-local"> en la hora local del navegador. */
function ahoraLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Mensaje según el error de la API en la negociación del encuentro. */
function mensajeError(err: unknown, accion: string): string {
  if (err instanceof ApiError && err.status === 401)
    return `Tu sesión expiró. Vuelve a ingresar para ${accion}.`;
  if (err instanceof ApiError && err.status === 403)
    return 'No participas en esta transacción, así que no puedes modificarla.';
  return err instanceof ApiError ? err.message : `No pudimos ${accion}. Inténtalo de nuevo.`;
}

/**
 * HU-16 · Comprador y vendedor acuerdan el encuentro: uno propone y el otro acepta,
 * contrapropone o rechaza. Solo cuando los dos están de acuerdo pasa a AGREED_POINT.
 */
function AcordarEncuentro({ tx, onChange }: { tx: Tx; onChange: (tx: Tx) => void }) {
  const { user, token } = useSession();
  const etapa = etapaAcuerdo(tx, user?.id);
  const soyComprador = tx.buyerId === user?.id;
  const otro = (soyComprador ? tx.seller?.fullName : tx.buyer?.fullName) ?? 'la otra persona';
  const [editando, setEditando] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const inFlight = useRef(false);

  async function recargar() {
    if (token) await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
  }

  async function responder(accion: 'aceptar' | 'rechazar') {
    if (!token || inFlight.current || !tx.safePointId || !tx.scheduledTime) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    setAviso('');
    try {
      const updated =
        accion === 'aceptar'
          ? await transactionApi.acceptMeeting(token, tx.id, tx.safePointId, tx.scheduledTime)
          : await transactionApi.rejectMeeting(token, tx.id);
      setAviso(
        accion === 'aceptar'
          ? '¡Listo! Los dos quedaron de acuerdo en el punto y el horario.'
          : soyComprador
            ? `Rechazaste la propuesta. Puedes proponer otro punto u horario a ${otro}.`
            : `Rechazaste la propuesta. ${otro} puede proponer otro punto u horario.`,
      );
      onChange({ ...tx, ...updated });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(`${otro} cambió la propuesta o la transacción cambió de estado. Revisa la versión actual.`);
        await recargar();
      } else {
        setError(mensajeError(err, accion === 'aceptar' ? 'aceptar la propuesta' : 'rechazar la propuesta'));
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  const propuesta =
    tx.safePointId && tx.scheduledTime ? (
      <div className="meeting-box" data-testid="propuesta-encuentro">
        <span className="meeting-kicker">
          {etapa === 'esperando' ? 'Tu propuesta' : `Propuesta de ${otro}`}
        </span>
        <strong>{nombrePunto(tx.safePointId)}</strong>
        <span>{fechaHora(tx.scheduledTime)}</span>
      </div>
    ) : null;

  return (
    <section className="meeting-agreement" aria-label="Acordar punto seguro y horario">
      <p className="agreement-progress" data-testid="paso-acuerdo">
        {etapa === 'sin-propuesta'
          ? `Paso 1 de 2 · ${soyComprador ? 'Propón' : `${otro} propone`} el punto y la hora de entrega`
          : `Paso 2 de 2 · ${etapa === 'por-responder' ? 'Te toca responder' : `${otro} debe responder`}`}
      </p>

      {aviso && <Alert tone="success">{aviso}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {etapa === 'sin-propuesta' && !soyComprador && (
        <p className="agreement-status" data-testid="estado-acuerdo">
          Esperando que {otro} proponga el punto seguro y la hora de entrega. Cuando lo haga, aquí
          podrás aceptarla o rechazarla.
        </p>
      )}

      {etapa === 'sin-propuesta' && soyComprador && (
        <>
          <p className="field-hint">
            Propón un lugar público y vigilado y una hora. {otro} tendrá que aceptarlo para que quede
            acordado.
          </p>
          <ProponerEncuentro
            tx={tx}
            onChange={onChange}
            onDone={() => setAviso(`Propuesta enviada. Ahora ${otro} debe aceptarla.`)}
          />
        </>
      )}

      {etapa === 'esperando' && (
        <>
          {propuesta}
          <p className="agreement-status" data-testid="estado-acuerdo">
            Esperando que {otro} acepte tu propuesta. Si cambias algo, {otro} verá la nueva propuesta.
          </p>
          {editando ? (
            <ProponerEncuentro
              tx={tx}
              onChange={onChange}
              onCancel={() => setEditando(false)}
              onDone={() => {
                setEditando(false);
                setAviso(`Cambiaste la propuesta. ${otro} debe aceptar la nueva.`);
              }}
            />
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setEditando(true)}>
              Cambiar mi propuesta
            </button>
          )}
        </>
      )}

      {etapa === 'por-responder' && (
        <>
          {propuesta}
          <p className="agreement-status agreement-status--todo" data-testid="estado-acuerdo">
            {soyComprador
              ? `${otro} propone otro punto u horario. ¿Te sirve?`
              : `${otro} quiere recibir su compra aquí. ¿Aceptas la entrega?`}
          </p>
          {editando ? (
            <ProponerEncuentro
              tx={tx}
              onChange={onChange}
              onCancel={() => setEditando(false)}
              onDone={() => {
                setEditando(false);
                setAviso(`Enviaste otra propuesta. Ahora ${otro} debe aceptarla.`);
              }}
            />
          ) : (
            <>
              <div className="tx-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => responder('aceptar')}
                  disabled={sending}
                  data-testid="btn-aceptar-propuesta"
                >
                  {sending ? 'Guardando…' : soyComprador ? 'Aceptar' : 'Aceptar entrega'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger-outline"
                  onClick={() => responder('rechazar')}
                  disabled={sending}
                  data-testid="btn-rechazar-propuesta"
                >
                  Rechazar
                </button>
              </div>
              <button
                type="button"
                className="link-button agreement-alt"
                onClick={() => setEditando(true)}
                disabled={sending}
                data-testid="btn-contraproponer"
              >
                ¿Ni sí ni no? Propón otro punto u hora
              </button>
            </>
          )}
        </>
      )}
    </section>
  );
}

/** HU-16 · Formulario para proponer (o contraproponer) punto seguro y horario. */
function ProponerEncuentro({
  tx,
  onChange,
  onDone,
  onCancel,
}: {
  tx: Tx;
  onChange: (tx: Tx) => void;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const { token } = useSession();
  const [safePointId, setSafePointId] = useState('');
  const [fechaLocal, setFechaLocal] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function proponer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || inFlight.current) return;

    if (!safePointId) return setError('Elige un punto seguro.');
    const fecha = new Date(fechaLocal);
    if (!fechaLocal || Number.isNaN(fecha.getTime())) return setError('Elige la fecha y la hora del encuentro.');
    if (fecha.getTime() <= Date.now()) return setError('El encuentro debe ser en una fecha y hora futuras.');

    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const updated = await transactionApi.proposeMeeting(token, tx.id, safePointId, fecha.toISOString());
      // El POST devuelve la transacción; se conservan las relaciones ya cargadas.
      onChange({ ...tx, ...updated });
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('La transacción cambió de estado mientras tanto. Te mostramos su estado actual.');
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else {
        setError(mensajeError(err, 'enviar la propuesta'));
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <form className="transaction-start" onSubmit={proponer} aria-busy={sending} noValidate>
      {error && <Alert tone="error">{error}</Alert>}
      <fieldset className="safe-points" disabled={sending}>
        <legend>Punto seguro</legend>
        {SAFE_POINTS.map((p) => (
          <label key={p.id} className={`safe-point${safePointId === p.id ? ' safe-point--on' : ''}`}>
            <input
              type="radio"
              name="safePointId"
              value={p.id}
              checked={safePointId === p.id}
              onChange={() => setSafePointId(p.id)}
            />
            <span>
              <strong>{p.name}</strong>
              <small>{p.address}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="field">
        <label htmlFor="scheduled-time">Fecha y hora del encuentro</label>
        <div className="field-box">
          <input
            id="scheduled-time"
            type="datetime-local"
            value={fechaLocal}
            min={ahoraLocal()}
            onChange={(ev) => setFechaLocal(ev.target.value)}
            disabled={sending}
            required
          />
        </div>
      </div>

      <div className="tx-actions">
        <button type="submit" className="btn btn-primary" disabled={sending} data-testid="btn-proponer">
          {sending ? 'Enviando…' : 'Enviar propuesta'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={sending}>
            Volver
          </button>
        )}
      </div>
    </form>
  );
}
