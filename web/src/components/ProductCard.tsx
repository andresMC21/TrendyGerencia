import { FavoriteIcon } from './FavoriteIcon';
import { Link } from 'react-router';
import type { Product } from '../lib/api';
import { barrio, CATEGORIA, CONDICION, precio } from '../lib/format';
import type { FavoritoDeTarjeta } from '../lib/useFavoritos';
import { ProductPhoto } from './ProductPhoto';

/**
 * Tarjeta de producto. Si recibe `favorito` (HU-14), muestra un corazón para
 * guardar o quitar el producto de mis favoritos sin entrar a su detalle.
 */
export function ProductCard({ product: p, favorito }: { product: Product; favorito?: FavoritoDeTarjeta }) {
  return (
    <article className="product">
      <Link viewTransition to={`/producto/${p.id}`} state={{ photoUrl: p.photoUrl, title: p.title }} onClick={(event) => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey) document.documentElement.dataset.productTransition = p.id; }} className="product-photo-link" aria-label={`Ver ${p.title}`}><ProductPhoto transitionId={p.id} src={p.photoUrl} title={p.title} /></Link>
      <div className="product-top">
        <span className="product-cat">{CATEGORIA[p.category] ?? p.category}</span>
        {p.acceptsBarter && <span className="chip chip--orange">Acepta trueque</span>}
        {favorito && (
          <button
            type="button"
            className={`fav-heart${favorito.activo ? ' fav-heart--on' : ''}`}
            onClick={favorito.alternar}
            disabled={favorito.ocupado}
            aria-pressed={favorito.activo}
            aria-label={favorito.activo ? `Quitar ${p.title} de favoritos` : `Guardar ${p.title} en favoritos`}
            title={favorito.activo ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            data-testid={`corazon-${p.id}`}
          >
            {favorito.activo ? '♥' : '♡'}
          </button>
        )}
      </div>
      <h3>
        <Link viewTransition to={`/producto/${p.id}`} className="product-link">
          {p.title}
        </Link>
      </h3>
      <p className="product-desc">{p.description}</p>
      <div className="product-foot">
        <span className="product-price">{precio(Number(p.price))}</span>
        <span className="product-meta">
          {barrio(p.neighborhoodId)} · {CONDICION[p.condition] ?? p.condition}
        </span>
      </div>
      <Link viewTransition to={`/producto/${p.id}`} className="product-more">
        Ver producto →
      </Link>
    </article>
  );
}
