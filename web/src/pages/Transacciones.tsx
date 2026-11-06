import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { transactionApi, type Transaction } from '../lib/api';
import { ESTADO_TRANSACCION, etapaAcuerdo, fechaHora } from '../lib/format';
import { nombrePunto } from '../lib/safePoints';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: Transaction[] }
  | { tipo: 'error' };

/** HU-16 · Lista de transacciones del usuario para elegir cuál organizar. */
export default function Transacciones() {
  const { token, user } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token) return;
    let activo = true;
    transactionApi
      .list(token)
      .then((items) => activo && setEstado({ tipo: 'ok', items }))
      .catch(() => activo && setEstado({ tipo: 'error' }));
    return () => {
      activo = false;
    };
  }, [token]);

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <h1 className="dash-title">Mis transacciones</h1>
          <p className="tx-lead">
            Compras y ventas en las que participas. Abre una pendiente para acordar el punto seguro y
            el horario de entrega.
          </p>

          {estado.tipo === 'cargando' && <div className="feed-loading">Cargando transacciones…</div>}
          {estado.tipo === 'error' && (
            <Alert tone="error">No pudimos cargar tus transacciones. Inténtalo de nuevo.</Alert>
          )}
          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <Alert tone="info">
              Todavía no tienes transacciones. <Link to="/inicio">Explora las publicaciones</Link>.
            </Alert>
          )}
          {estado.tipo === 'ok' && estado.items.length > 0 && (
            <ul className="tx-list" data-testid="transacciones-lista">
              {estado.items.map((t) => {
                const e = ESTADO_TRANSACCION[t.status] ?? { label: t.status, tone: 'gray' };
                const soyComprador = t.buyerId === user?.id;
                const otro = soyComprador ? t.seller?.fullName : t.buyer?.fullName;
                return (
                  <li key={t.id}>
                    <Link to={`/transacciones/${t.id}`} className="tx-item">
                      <div className="product-top">
                        <strong>{t.product?.title ?? 'Producto'}</strong>
                        <span className={`chip chip--${e.tone}`}>{e.label}</span>
                      </div>
                      <span className="tx-meta">
                        {soyComprador ? 'Compras a' : 'Vendes a'} {otro ?? 'otro usuario'}
                      </span>
                      <MetaAcuerdo tx={t} userId={user?.id} otro={otro} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** HU-16 · Resumen del acuerdo del encuentro en la lista. */
function MetaAcuerdo({ tx, userId, otro }: { tx: Transaction; userId?: string; otro?: string }) {
  const lugar =
    tx.safePointId && tx.scheduledTime
      ? `${nombrePunto(tx.safePointId)} · ${fechaHora(tx.scheduledTime)}`
      : null;
  if (tx.status === 'CANCELLED' || tx.status === 'COMPLETED') {
    return lugar && tx.agreedAt ? <span className="tx-meta">{lugar}</span> : null;
  }
  switch (etapaAcuerdo(tx, userId)) {
    case 'sin-propuesta':
      if (tx.rejectedById && tx.rejectedById !== userId) {
        return (
          <span className="tx-meta tx-meta--todo">
            {otro ?? 'La otra persona'} rechazó tu propuesta
            {tx.buyerId === userId ? ' · Propón otro punto u horario' : ''}
          </span>
        );
      }
      if (tx.rejectedById === userId) {
        return (
          <span className="tx-meta">
            Rechazaste la propuesta
            {tx.buyerId === userId ? ' · Propón otro punto u horario' : ` · Esperando otra de ${otro ?? 'el comprador'}`}
          </span>
        );
      }
      return tx.buyerId === userId ? (
        <span className="tx-meta tx-meta--todo">Propón el punto y la hora de entrega</span>
      ) : (
        <span className="tx-meta">Esperando que {otro ?? 'el comprador'} proponga la entrega</span>
      );
    case 'esperando':
      return (
        <span className="tx-meta">
          Propusiste {lugar} · Esperando la respuesta de {otro ?? 'la otra persona'}
        </span>
      );
    case 'por-responder':
      return (
        <span className="tx-meta tx-meta--todo">
          {otro ?? 'La otra persona'} propone {lugar} · Acepta o rechaza la entrega
        </span>
      );
    default:
      return <span className="tx-meta">Acordado: {lugar}</span>;
  }
}
