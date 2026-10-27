import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ApiError, productApi, type ProductDetail } from '../lib/api';
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
  const estado = ESTADO_PRODUCTO[p.status] ?? { label: p.status, tone: 'gray' };
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
    </article>
  );
}
