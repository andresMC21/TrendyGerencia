import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { transactionApi, type Transaction } from '../lib/api';
import { ESTADO_TRANSACCION, fechaHora } from '../lib/format';
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
                      {t.safePointId && t.scheduledTime ? (
                        <span className="tx-meta">
                          {nombrePunto(t.safePointId)} · {fechaHora(t.scheduledTime)}
                        </span>
                      ) : (
                        t.status === 'PENDING' && (
                          <span className="tx-meta tx-meta--todo">Falta acordar punto y horario</span>
                        )
                      )}
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
