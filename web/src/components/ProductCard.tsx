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
    <article className="product product-interactive" onPointerMove={(event) => {
      if (!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
      const box = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      event.currentTarget.style.setProperty('--x', `${x * 100}%`);
      event.currentTarget.style.setProperty('--y', `${y * 100}%`);
      event.currentTarget.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
      event.currentTarget.style.setProperty('--ry', `${(x - 0.5) * 8}deg`);
    }} onPointerLeave={(event) => { event.currentTarget.style.setProperty('--rx', '0deg'); event.currentTarget.style.setProperty('--ry', '0deg'); }}>
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
            <FavoriteIcon active={favorito.activo} />
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
