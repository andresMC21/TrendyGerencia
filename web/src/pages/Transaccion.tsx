import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ApiError, transactionApi, type Transaction as Tx } from '../lib/api';
import { ESTADO_TRANSACCION, fechaHora } from '../lib/format';
import { nombrePunto, SAFE_POINTS } from '../lib/safePoints';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; tx: Tx }
  | { tipo: 'ajena' }
  | { tipo: 'no-existe' }
  | { tipo: 'error' };

/** HU-16 · Detalle y punto seguro. HU-17 · Finalizar o cancelar el intercambio. */
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
      {tx.safePointId && tx.scheduledTime ? (
        <div className="meeting-box" data-testid="encuentro-acordado">
          <strong>{nombrePunto(tx.safePointId)}</strong>
          <span>{fechaHora(tx.scheduledTime)}</span>
        </div>
      ) : tx.status === 'PENDING' ? (
        <ConfirmarPunto tx={tx} onChange={onChange} />
      ) : (
        <Alert tone="info">Esta transacción no tiene un punto de encuentro registrado.</Alert>
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
            <strong>Transacción cancelada.</strong> El producto se liberó y volvió a estar
            disponible para otros compradores.
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
          : 'Para marcarla como completada, primero acuerden el punto seguro y el horario. Si ya no se va a dar, puedes cancelarla.'}
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

function ConfirmarPunto({ tx, onChange }: { tx: Tx; onChange: (tx: Tx) => void }) {
  const { token } = useSession();
  const [safePointId, setSafePointId] = useState('');
  const [fechaLocal, setFechaLocal] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const inFlight = useRef(false);

  async function confirmar(event: FormEvent<HTMLFormElement>) {
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
      const updated = await transactionApi.confirmPoint(token, tx.id, safePointId, fecha.toISOString());
      setOk(true);
      // El POST devuelve la transacción; se conservan las relaciones ya cargadas.
      onChange({ ...tx, ...updated });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Tu sesión expiró. Vuelve a ingresar para confirmar el encuentro.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('No participas en esta transacción, así que no puedes modificarla.');
      } else if (err instanceof ApiError && err.status === 409) {
        setError('La otra persona ya acordó el encuentro o la transacción cambió de estado.');
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos guardar el encuentro. Inténtalo de nuevo.');
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <section className="transaction-start" aria-label="Acordar punto seguro y horario">
      {ok && <Alert tone="success">Encuentro acordado. La transacción pasó a AGREED_POINT.</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      <p className="field-hint">
        Elige un lugar público y vigilado. Cualquiera de los dos participantes puede registrarlo.
      </p>
      <form onSubmit={confirmar} aria-busy={sending} noValidate>
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

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? 'Guardando…' : 'Acordar encuentro'}
        </button>
      </form>
    </section>
  );
}
