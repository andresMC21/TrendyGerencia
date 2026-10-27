import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { productApi, type Product } from '../lib/api';
import { barrio, CONDICION, fecha, iniciales, precio, ROL, VERIFICACION } from '../lib/format';
import { useSession } from '../lib/session';

export default function Inicio() {
  const { user, isNewAccount, dismissWelcome } = useSession();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [feedError, setFeedError] = useState(false);

  useEffect(() => {
    productApi
      .feed()
      .then((r) => setProducts(r.items))
      .catch(() => setFeedError(true));
  }, []);

  if (!user) return null;
  const nombre = user.fullName.split(' ')[0];
  const ver = VERIFICACION[user.verificationStatus];

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container">
          {isNewAccount && (
            <Alert tone="success">
              <strong>¡Tu cuenta quedó creada, {nombre}!</strong> Ya puedes participar en Trendy.{' '}
              <button className="link-button" onClick={dismissWelcome}>
                Entendido
              </button>
            </Alert>
          )}

          <h1 className="dash-title">Hola, {nombre}</h1>

          <div className="dash-grid">
            <aside className="profile-card">
              <div className="profile-head">
                <span className="avatar">{iniciales(user.fullName)}</span>
                <div>
                  <strong>{user.fullName}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <dl className="profile-data">
                <div>
                  <dt>Rol</dt>
                  <dd>
                    <span className="chip chip--blue">
                      {user.role.map((r) => ROL[r] ?? r).join(', ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Verificación</dt>
                  <dd>
                    <span className={`chip chip--${ver.tone}`}>{ver.label}</span>
                  </dd>
                </div>
                <div>
                  <dt>Estado</dt>
                  <dd>
                    <span className={`chip chip--${user.isActive ? 'green' : 'gray'}`}>
                      {user.isActive ? 'Cuenta activa' : 'Inactiva'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Miembro desde</dt>
                  <dd>{fecha(user.createdAt)}</dd>
                </div>
              </dl>
              <Link to="/perfil" className="btn btn-outline btn-block profile-link">
                Ver mi perfil
              </Link>
            </aside>

            <section>
              <div className="feed-head">
                <h2>Cerca de ti</h2>
                <span>Objetos publicados por vecinos de Cali</span>
              </div>
              {feedError && <Alert tone="info">No pudimos cargar las publicaciones por ahora.</Alert>}
              {products?.length === 0 && <Alert tone="info">Aún no hay publicaciones en tu zona.</Alert>}
              {products === null && !feedError && <div className="feed-loading">Cargando…</div>}
              <div className="feed">
                {products?.map((p) => (
                  <article key={p.id} className="product">
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
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
