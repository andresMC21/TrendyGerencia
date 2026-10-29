import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ApiError, productApi, transactionApi, type ProductDetail, type Transaction } from '../lib/api';
import { useSession } from '../lib/session';
import { barrio, CONDICION, ESTADO_PRODUCTO, fecha, iniciales, precio } from '../lib/format';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; producto: ProductDetail }
  | { tipo: 'no-existe' }
  | { tipo: 'error' };

/** HU-11 · Consultar un producto (GET /products/:id). */
export default function Producto() {
  const { id = '' } = useParams();
  // key={id}: al cambiar de producto se reinicia el estado sin setState en el efecto.
  return <ProductoPagina key={id} id={id} />;
}

function ProductoPagina({ id }: { id: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    let activo = true;
    productApi
      .get(id)
      .then((producto) => activo && setEstado({ tipo: 'ok', producto }))
      .catch((err) => {
        if (!activo) return;
        // 400 = id con formato inválido, 404 = no existe o fue retirado.
        const noExiste = err instanceof ApiError && (err.status === 404 || err.status === 400);
        setEstado({ tipo: noExiste ? 'no-existe' : 'error' });
      });
    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <Link to="/inicio" className="back-link">
            ← Volver a las publicaciones
          </Link>

          {estado.tipo === 'cargando' && <div className="feed-loading">Cargando producto…</div>}

          {estado.tipo === 'no-existe' && (
            <Alert tone="info">
              Este producto no existe o ya no está publicado.{' '}
              <Link to="/inicio">Ver otras publicaciones</Link>
            </Alert>
          )}

          {estado.tipo === 'error' && (
            <Alert tone="error">No pudimos cargar el producto. Inténtalo de nuevo en un momento.</Alert>
          )}

          {estado.tipo === 'ok' && <Detalle p={estado.producto} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Detalle({ p }: { p: ProductDetail }) {
  const [producto, setProducto] = useState(p);
  const estado = ESTADO_PRODUCTO[producto.status] ?? { label: producto.status, tone: 'gray' };
  const tieneRating = p.seller.reviewsCount > 0;

  return (
    <article className="product-detail">
      <div className="product-top">
        <span className="product-cat">{p.category}</span>
        <span className={`chip chip--${estado.tone}`}>{estado.label}</span>
      </div>

      <h1 data-testid="producto-titulo">{p.title}</h1>
      <p className="product-detail-price" data-testid="producto-precio">
        {precio(Number(p.price))}
        {p.acceptsBarter && <span className="chip chip--orange">Acepta trueque</span>}
      </p>

      <h2 className="detail-h">Descripción</h2>
      <p className="product-detail-desc">{p.description}</p>

      <dl className="profile-data profile-data--plain">
        <div>
          <dt>Condición</dt>
          <dd>{CONDICION[p.condition] ?? p.condition}</dd>
        </div>
        <div>
          <dt>Barrio</dt>
          <dd>{barrio(p.neighborhoodId)}</dd>
        </div>
        <div>
          <dt>Publicado</dt>
          <dd>{fecha(p.createdAt)}</dd>
        </div>
        <div>
          <dt>Visitas · Favoritos</dt>
          <dd>
            {p.viewsCount} · {p.favoritesCount}
          </dd>
        </div>
      </dl>

      <h2 className="detail-h">Vendedor</h2>
      <div className="seller-box" data-testid="producto-vendedor">
        <span className="avatar">{iniciales(p.seller.fullName)}</span>
        <div>
          <strong>{p.seller.fullName}</strong>
          <span>
            {tieneRating
              ? `★ ${Number(p.seller.ratingAverage).toFixed(1)} · ${p.seller.reviewsCount} ${
                  p.seller.reviewsCount === 1 ? 'reseña' : 'reseñas'
                }`
              : 'Vendedor sin calificaciones todavía'}
          </span>
        </div>
      </div>
      <IniciarTransaccion p={producto} onProductChange={setProducto} />
    </article>
  );
}

function IniciarTransaccion({ p, onProductChange }: {
  p: ProductDetail;
  onProductChange: (product: ProductDetail) => void;
}) {
  const { user, token, loading } = useSession();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const inFlight = useRef(false);

  async function iniciar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !user || inFlight.current || transaction || p.status !== 'AVAILABLE' || user.id === p.seller.id) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const created = await transactionApi.create(token, p.id, message.trim() || undefined);
      setTransaction(created);
      onProductChange({ ...p, status: 'RESERVED' });
    } catch (err) {
      setError(err instanceof ApiError
        ? err.status === 401
          ? 'Tu sesión expiró. Vuelve a ingresar para iniciar la transacción.'
          : err.message
        : 'No pudimos iniciar la transacción. Inténtalo de nuevo.');
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
        // Otro comprador pudo reservarlo desde que se abrió el detalle.
        await productApi.get(p.id).then(onProductChange).catch(() => undefined);
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  if (loading) return <p role="status">Comprobando sesión…</p>;
  if (!user || !token) return <Alert tone="info"><Link to="/ingresar">Ingresa a tu cuenta</Link> para iniciar una compra o un trueque.</Alert>;
  if (user.id === p.seller.id) return <Alert tone="info">Esta es tu publicación. No puedes iniciar una compra de tu propio producto.</Alert>;

  return (
    <section className="transaction-start" aria-label="Iniciar una transacción">
      <h2 className="detail-h">{p.acceptsBarter ? 'Comprar o proponer un trueque' : 'Iniciar compra'}</h2>
      {error && <Alert tone="error">{error}</Alert>}
      {transaction ? (
        <Alert tone="success">
          Transacción iniciada en estado PENDING (pendiente) con {p.seller.fullName}.
          {' '}El producto quedó reservado. Referencia: {transaction.id}.
        </Alert>
      ) : p.status !== 'AVAILABLE' ? (
        <Alert tone="info">Este producto ya no está disponible para iniciar una transacción.</Alert>
      ) : (
        <form onSubmit={iniciar} aria-busy={sending}>
          <div className="field">
            <label htmlFor="transaction-message">Mensaje para el vendedor (opcional)</label>
            <textarea
              id="transaction-message"
              className="transaction-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={500}
              rows={3}
              disabled={sending}
              aria-describedby="transaction-message-hint"
              placeholder={p.acceptsBarter ? 'Cuéntale si quieres comprar o qué propones intercambiar.' : 'Cuéntale que te interesa su producto.'}
            />
            <p id="transaction-message-hint" className="field-hint">{message.length}/500 caracteres</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Iniciando…' : p.acceptsBarter ? 'Iniciar compra o trueque' : 'Iniciar compra'}
          </button>
        </form>
      )}
    </section>
  );
}
