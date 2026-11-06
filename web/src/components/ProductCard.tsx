import { Link } from 'react-router';
import type { Product } from '../lib/api';
import { barrio, CONDICION, precio } from '../lib/format';

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="product">
      <div className="product-top">
        <span className="product-cat">{p.category}</span>
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
