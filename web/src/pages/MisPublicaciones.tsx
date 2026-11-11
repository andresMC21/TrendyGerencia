import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { RetirarPublicacion } from '../components/RetirarPublicacion';
import { ApiError, productApi, type Product } from '../lib/api';
import { barrio, ESTADO_PRODUCTO, fecha, precio } from '../lib/format';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: Product[] }
  | { tipo: 'error'; mensaje: string };

const ACTIVAS = ['AVAILABLE', 'RESERVED'];

/** HU-13 · Publicaciones del vendedor y retiro (borrado lógico). */
export default function MisPublicaciones() {
  const { token } = useSession();
  const location = useLocation();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState<string>(
    (location.state as { retirado?: string } | null)?.retirado
      ? `Retiraste «${(location.state as { retirado: string }).retirado}». Ya no aparece en Trendy.`
      : '',
  );

  const cargar = useCallback(() => {
    if (!token) return Promise.resolve();
    return productApi
      .mine(token)
      .then((items) => setEstado({ tipo: 'ok', items }))
      .catch((err) =>
        setEstado({
          tipo: 'error',
          mensaje:
            err instanceof ApiError && err.status === 401
              ? 'Tu sesión expiró. Vuelve a ingresar.'
              : 'No pudimos cargar tus publicaciones. Inténtalo de nuevo.',
        }),
      );
  }, [token]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const activas = estado.tipo === 'ok' ? estado.items.filter((p) => ACTIVAS.includes(p.status ?? '')) : [];
  const historial = estado.tipo === 'ok' ? estado.items.filter((p) => !ACTIVAS.includes(p.status ?? '')) : [];

  const [problema, setProblema] = useState('');
  const conflicto = (mensaje: string) => {
    setAviso('');
    setProblema(mensaje);
    void cargar();
  };

  const marcarRetirada = (p: Product) => {
    setProblema('');
    setAviso(`Retiraste «${p.title}». Ya no aparece en Trendy.`);
    setEstado((e) =>
      e.tipo === 'ok'
        ? { ...e, items: e.items.map((x) => (x.id === p.id ? { ...x, status: 'REMOVED' } : x)) }
        : e,
    );
  };

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <Link viewTransition to="/inicio" className="back-link">
            ← Volver a Mi Trendy
          </Link>
          <h1 className="dash-title">Mis publicaciones</h1>
          <p className="tx-lead">
            Lo que ofreces en Trendy. Si ya no quieres ofrecer un artículo, retíralo: dejará de verse,
            pero se conserva en tu historial.
          </p>

          {aviso && (
            <div data-testid="aviso-retiro">
              <Alert tone="success">{aviso}</Alert>
            </div>
          )}
          {problema && <Alert tone="error">{problema}</Alert>}
          {estado.tipo === 'cargando' && <Skeleton kind="products" />}
          {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}

          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <EmptyState kind="publications">
              Aún no has publicado nada. <Link viewTransition to="/publicar">Publica tu primer artículo</Link>.
            </EmptyState>
          )}

          {activas.length > 0 && (
            <>
              <h2 className="detail-h">Publicadas</h2>
              <ul className="my-products" data-testid="publicaciones-activas">
                {activas.map((p) => (
                  <MiPublicacion key={p.id} p={p} onRemoved={() => marcarRetirada(p)} onConflict={conflicto} />
                ))}
              </ul>
            </>
          )}

          {historial.length > 0 && (
            <>
              <h2 className="detail-h">Historial</h2>
              <ul className="my-products my-products--history" data-testid="publicaciones-historial">
                {historial.map((p) => (
                  <MiPublicacion key={p.id} p={p} onRemoved={() => marcarRetirada(p)} onConflict={conflicto} />
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function MiPublicacion({
  p,
  onRemoved,
  onConflict,
}: {
  p: Product;
  onRemoved: () => void;
  onConflict: (mensaje: string) => void;
}) {
  const status = p.status ?? 'AVAILABLE';
  const e = ESTADO_PRODUCTO[status] ?? { label: status, tone: 'gray' };
  const visible = status !== 'REMOVED';

  return (
    <li className="my-product" data-testid={`publicacion-${p.id}`}>
      <div className="my-product-main">
        <div className="my-product-head">
          {visible ? (
            <Link viewTransition to={`/producto/${p.id}`}>
              <strong>{p.title}</strong>
            </Link>
          ) : (
            <strong>{p.title}</strong>
          )}
          <span className={`chip chip--${e.tone}`} data-testid="estado-publicacion">
            {e.label}
          </span>
        </div>
        <span className="tx-meta">
          {precio(Number(p.price))} · {barrio(p.neighborhoodId)}
          {p.createdAt ? ` · Publicado el ${fecha(p.createdAt)}` : ''}
        </span>
        {status === 'RESERVED' && (
          <span className="tx-meta tx-meta--todo">
            Reservado: para retirarlo, primero cancela la transacción en{' '}
            <Link viewTransition to="/transacciones">Transacciones</Link>.
          </span>
        )}
        {status === 'REMOVED' && (
          <span className="tx-meta">Retirada · ya no aparece en Trendy, se conserva en tu historial.</span>
        )}
      </div>
      {status === 'AVAILABLE' && (
        <RetirarPublicacion
          productId={p.id}
          title={p.title}
          onRemoved={onRemoved}
          onConflict={onConflict}
          compact
        />
      )}
    </li>
  );
}
