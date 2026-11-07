import { Link } from 'react-router';
import type { Product } from '../lib/api';
import { barrio, CATEGORIA, CONDICION, precio } from '../lib/format';
import { ProductPhoto } from './ProductPhoto';

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product">
      <Link to={`/producto/${p.id}`} className="product-photo-link" aria-label={`Ver ${p.title}`}><ProductPhoto src={p.photoUrl} title={p.title} /></Link>
      <div className="product-top">
        <span className="product-cat">{CATEGORIA[p.category] ?? p.category}</span>
        {p.acceptsBarter && <span className="chip chip--orange">Acepta trueque</span>}
      </div>
      <h3>
        <Link to={`/producto/${p.id}`} className="product-link">
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
      <Link to={`/producto/${p.id}`} className="product-more">
        Ver producto →
      </Link>
    </article>
  );
}
