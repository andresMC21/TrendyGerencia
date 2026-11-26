import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { Product } from '../lib/api';
import { barrio, CONDICION, distancia } from '../lib/format';
import type { FavoritoDeTarjeta } from '../lib/useFavoritos';
import { Heart, PriceTag } from './PriceTag';

/**
 * Tarjeta de producto del prototipo: foto, etiqueta de precio colgante, corazón,
 * trueque o solo venta, condición, título, barrio y distancia.
 */
export function ProductCard({ product: p, favorito, gone, style, hideFav, className = '' }: {
  product: Product; favorito?: FavoritoDeTarjeta; gone?: string; style?: CSSProperties; hideFav?: boolean; className?: string;
}) {
  const to = `/producto/${p.id}`;
  return (
    <div className={`card${gone ? ' gone' : ''} ${className}`.trim()} style={style}>
      <Link viewTransition to={to} state={{ photoUrl: p.photoUrl, title: p.title }} className="card-link" aria-label={`Ver ${p.title}`}>
        <PriceTag price={p.price} />
        <div className="ph">
          {p.photoUrl ? <img src={p.photoUrl} alt="" loading="lazy" /> : <span className="noph">Sin fotografía</span>}
          {gone && <span className="over">{gone} · ya no está disponible</span>}
        </div>
        <div className="cb">
          <div className="cardtop">
            {p.acceptsBarter ? <span className="chip o">Acepta trueque</span> : <span className="chip">Solo venta</span>}
            <span className="cond">{CONDICION[p.condition] ?? p.condition}</span>
          </div>
          <div className="ttl">{p.title}</div>
          <div className="meta">
            <span>{barrio(p.neighborhoodId)}</span>
            {p.distanceKm !== undefined && <><span aria-hidden="true">·</span><span>{distancia(p.distanceKm)}</span></>}
          </div>
        </div>
      </Link>
      {favorito && !hideFav && (
        <button
          type="button"
          className={`fav card-fav${favorito.activo ? ' burst' : ''}`}
          onClick={favorito.alternar}
          disabled={favorito.ocupado}
          aria-pressed={favorito.activo}
          aria-label={favorito.activo ? `Quitar ${p.title} de favoritos` : `Guardar ${p.title} en favoritos`}
          data-testid={`corazon-${p.id}`}
        >
          <Heart />
        </button>
      )}
    </div>
  );
}
