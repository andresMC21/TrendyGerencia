import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { RetirarPublicacion } from '../components/RetirarPublicacion';
import { ApiError, productApi, transactionApi, type ProductDetail, type Transaction } from '../lib/api';
import { useSession } from '../lib/session';
import { ProductPhoto } from '../components/ProductPhoto';
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
          <Link to="/explorar" className="back-link">
            ← Volver a las publicaciones
          </Link>

          {estado.tipo === 'cargando' && <div className="feed-loading">Cargando producto…</div>}

          {estado.tipo === 'no-existe' && (
            <Alert tone="info">
              Este producto no existe o ya no está publicado.{' '}
              <Link to="/explorar">Ver otras publicaciones</Link>
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
      <ProductPhoto src={p.photoUrl} title={p.title} detail />
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
            {producto.viewsCount} · {producto.favoritesCount}
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
      <Favorito
        p={producto}
        onCountChange={(delta) =>
          setProducto((actual) => ({
            ...actual,
            favoritesCount: Math.max(0, actual.favoritesCount + delta),
          }))
        }
      />
      <IniciarTransaccion p={producto} onProductChange={setProducto} />
    </article>
  );
}

/**
 * HU-14 · Guardar o quitar el producto de mis favoritos. Usa PUT y DELETE, que son
 * idempotentes: un doble clic o un reintento nunca duplica ni falla.
 */
function Favorito({ p, onCountChange }: {
  p: ProductDetail;
  onCountChange: (delta: number) => void;
}) {
  const { user, token } = useSession();
  // null = todavía no sabemos si ya lo tengo en favoritos.
  const [esFavorito, setEsFavorito] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    productApi
      .favorites(token)
      .then((lista) => activo && setEsFavorito(lista.some((f) => f.id === p.id)))
      .catch(() => activo && setEsFavorito(false));
    return () => {
      activo = false;
    };
  }, [token, p.id]);

  // Quien publicó el producto no lo guarda como favorito; los visitantes ven el aviso de ingreso.
  if (!user || !token || user.id === p.seller.id) return null;

  async function alternar() {
    if (!token || inFlight.current || esFavorito === null) return;
    const quiere = !esFavorito;
    inFlight.current = true;
    setEnviando(true);
    setError('');
    try {
      if (quiere) await productApi.addFavorite(token, p.id);
      else await productApi.removeFavorite(token, p.id);
      setEsFavorito(quiere);
      onCountChange(quiere ? 1 : -1);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Tu sesión expiró. Vuelve a ingresar para usar tus favoritos.'
          : err instanceof ApiError && err.status === 404
            ? 'Este producto ya no está publicado.'
            : 'No pudimos actualizar tus favoritos. Inténtalo de nuevo.',
      );
    } finally {
      inFlight.current = false;
      setEnviando(false);
    }
  }

  return (
    <section className="favorite-box" aria-label="Favoritos">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="tx-actions">
        <button
          type="button"
          className={`btn ${esFavorito ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => void alternar()}
          disabled={enviando || esFavorito === null}
          aria-pressed={esFavorito === true}
          data-testid="boton-favorito"
        >
          {esFavorito ? '♥ Guardado en favoritos' : '♡ Guardar en favoritos'}
        </button>
        {esFavorito && <Link to="/favoritos">Ver mis favoritos</Link>}
      </div>
    </section>
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
  if (user.id === p.seller.id) return <MiProducto p={p} onProductChange={onProductChange} />;

  return (
    <section className="transaction-start" aria-label="Iniciar una transacción">
      <h2 className="detail-h">{p.acceptsBarter ? 'Comprar o proponer un trueque' : 'Iniciar compra'}</h2>
      {error && <Alert tone="error">{error}</Alert>}
      {transaction ? (
        <Alert tone="success">
          Transacción iniciada en estado PENDING (pendiente) con {p.seller.fullName}.
          {' '}El producto quedó reservado. Referencia: {transaction.id}.{' '}
          <Link to={`/transacciones/${transaction.id}`}>Acordar punto seguro y horario</Link>
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

/** HU-13 · Vista del dueño: en lugar de comprar, puede retirar la publicación. */
function MiProducto({ p, onProductChange }: {
  p: ProductDetail;
  onProductChange: (product: ProductDetail) => void;
}) {
  const navigate = useNavigate();
  const [problema, setProblema] = useState('');
  return (
    <section className="transaction-start" aria-label="Tu publicación">
      <h2 className="detail-h">Tu publicación</h2>
      {problema && <Alert tone="error">{problema}</Alert>}
      {p.status === 'AVAILABLE' ? (
        <>
          <p className="field-hint">
            Si ya no quieres ofrecer este artículo, retíralo: dejará de aparecer en Trendy y se
            conservará en <Link to="/mis-publicaciones">tu historial</Link>.
          </p>
          <RetirarPublicacion
            productId={p.id}
            title={p.title}
            onRemoved={() => navigate('/mis-publicaciones', { state: { retirado: p.title } })}
            onConflict={(mensaje) => {
              setProblema(mensaje);
              void productApi.get(p.id).then(onProductChange).catch(() => undefined);
            }}
          />
        </>
      ) : (
        <Alert tone="info">
          {p.status === 'RESERVED'
            ? 'Está reservada en una transacción. Para retirarla, primero cancela la transacción en '
            : 'Esta publicación ya no está disponible. Revisa '}
          <Link to={p.status === 'RESERVED' ? '/transacciones' : '/mis-publicaciones'}>
            {p.status === 'RESERVED' ? 'Transacciones' : 'Mis publicaciones'}
          </Link>
          .
        </Alert>
      )}
    </section>
  );
}
