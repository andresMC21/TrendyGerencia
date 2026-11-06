import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { productApi, type Product } from '../lib/api';
import { barrioGuardado } from '../lib/barrios';
import { barrio, fecha, iniciales, ROL, VERIFICACION } from '../lib/format';
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
  const miBarrio = barrioGuardado();

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
                <h2>Todos los productos</h2>
                <span>Lo más reciente de toda Cali</span>
              </div>
              <div className="feed-actions">
                <Link
                  to={miBarrio ? `/explorar?barrio=${miBarrio}` : '/explorar'}
                  className="btn btn-primary btn-sm"
                >
                  {miBarrio ? `Productos de ${barrio(miBarrio)}` : 'Productos de mi barrio'}
                </Link>
                <Link to="/explorar" className="btn btn-outline btn-sm">
                  Ver todos los productos
                </Link>
              </div>
              {feedError && <Alert tone="info">No pudimos cargar las publicaciones por ahora.</Alert>}
              {products?.length === 0 && <Alert tone="info">Aún no hay publicaciones en Cali.</Alert>}
              {products === null && !feedError && <div className="feed-loading">Cargando…</div>}
              <div className="feed">
                {products?.map((p) => (
                  <ProductCard key={p.id} product={p} />
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
