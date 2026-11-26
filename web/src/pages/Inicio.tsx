import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { productApi, transactionApi, type Product, type Transaction } from '../lib/api';
import { barrioGuardado } from '../lib/barrios';
import { barrio, ROL } from '../lib/format';
import { useSession } from '../lib/session';
import { siguientePaso } from '../lib/txNext';
import { useFavoritos } from '../lib/useFavoritos';

const VER_CHIP: Record<string, [string, string]> = {
  VERIFIED: ['Verificada', 'ok'], PENDING: ['En revisión', 'bl'], UNVERIFIED: ['Sin verificar', ''], REJECTED: ['Rechazada', 'n'],
};

export default function Inicio() {
  const { user, token, isNewAccount, dismissWelcome } = useSession();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [feedError, setFeedError] = useState(false);
  const [mios, setMios] = useState<number | null>(null);
  const [favs, setFavs] = useState<number | null>(null);
  const [txs, setTxs] = useState<Transaction[] | null>(null);
  const [soloMiBarrio, setSoloMiBarrio] = useState(false);
  const favoritos = useFavoritos();
  const miBarrio = barrioGuardado();

  useEffect(() => {
    setProducts(null);
    productApi
      .feed({ limit: 4, neighborhoodId: soloMiBarrio && miBarrio ? miBarrio : undefined })
      .then((r) => setProducts(r.items))
      .catch(() => setFeedError(true));
  }, [soloMiBarrio, miBarrio]);

  useEffect(() => {
    if (!token) return;
    productApi.mine(token).then((l) => setMios(l.filter((p) => p.status === 'AVAILABLE' || p.status === 'RESERVED').length)).catch(() => undefined);
    productApi.favorites(token).then((l) => setFavs(l.length)).catch(() => undefined);
    transactionApi.list(token).then(setTxs).catch(() => undefined);
  }, [token]);

  if (!user) return null;
  const nombre = user.fullName.split(' ')[0];
  const h = new Date().getHours();
  const saludo = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  const [verL, verC] = VER_CHIP[user.verificationStatus] ?? VER_CHIP.UNVERIFIED;
  const pendientes = (txs ?? []).filter((t) => (t.status === 'PENDING' || t.status === 'AGREED_POINT') && siguientePaso(t, user.id).mine);
  const pend = pendientes[0];
  const nombreBarrio = miBarrio ? barrio(miBarrio) : 'tu barrio';

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        {isNewAccount && (
          <div className="welcome" role="status">
            <span aria-hidden="true">✓</span>
            <span><b>¡Tu cuenta quedó creada, {nombre}!</b> Ya puedes publicar, guardar favoritos y comprar o intercambiar.</span>
            <button type="button" onClick={dismissWelcome}>Entendido</button>
          </div>
        )}
        <div className="hi">
          <div><p className="mu" style={{ margin: '0 0 6px' }}>{saludo}</p><h1>Hola, <span>{nombre}</span></h1></div>
          <div className="acts"><Link className="btn" viewTransition to="/publicar">Publicar algo</Link><Link className="btn2" viewTransition to="/explorar">Explorar</Link></div>
        </div>
        <div className="dash">
          <aside className="acct" aria-label="Tu cuenta">
            <div className="who"><Avatar name={user.fullName} photoUrl={user.photoUrl} avatar={user.avatar} /><div><b>{user.fullName}</b><span>{user.email}</span></div></div>
            <dl>
              <div><dt>Rol</dt><dd><span className="chip n">{user.role.map((r) => ROL[r] ?? r).join(', ')}</span></dd></div>
              <div><dt>Verificación</dt><dd><span className={`chip ${verC}`}>{verL}</span></dd></div>
              <div><dt>Estado</dt><dd><span className={`chip ${user.isActive ? 'ok' : 'n'}`}>{user.isActive ? 'Cuenta activa' : 'Inactiva'}</span></dd></div>
              <div><dt>Miembro desde</dt><dd>{new Date(user.createdAt).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</dd></div>
            </dl>
            <div className="links">
              <Link viewTransition to="/perfil">Mi perfil <small>→</small></Link>
              <Link viewTransition to="/mis-publicaciones">Mis publicaciones <small>{mios ?? '…'}</small></Link>
              <Link viewTransition to="/favoritos">Mis favoritos <small>{favs ?? '…'}</small></Link>
              <Link viewTransition to="/transacciones">Transacciones <small>{txs ? (pendientes.length ? `${pendientes.length} te ${pendientes.length === 1 ? 'espera' : 'esperan'}` : txs.length) : '…'}</small></Link>
            </div>
            {user.verificationStatus === 'UNVERIFIED' && (
              <p className="verify">Verifica tu identidad para que tus compradores confíen más en ti. <Link viewTransition to="/perfil">Verificar</Link></p>
            )}
          </aside>
          <section>
            {pend && (
              <Link className="pend" viewTransition to={`/transacciones/${pend.id}`}>
                {pend.product?.photoUrl ? <img src={pend.product.photoUrl} alt="" /> : <span />}
                <span><b>Tienes una transacción pendiente</b><span>{pend.product?.title ?? 'Producto'} · {siguientePaso(pend, user.id).text}</span></span>
                <span className="go">Continuar →</span>
              </Link>
            )}
            <div className="sechead">
              <h2>{soloMiBarrio ? `Lo más reciente en ${nombreBarrio}` : 'Lo más reciente en Cali'}</h2>
              <div className="seg" role="group" aria-label="Filtrar">
                <button type="button" aria-pressed={!soloMiBarrio} onClick={() => setSoloMiBarrio(false)}>Toda Cali</button>
                <button type="button" aria-pressed={soloMiBarrio} onClick={() => setSoloMiBarrio(true)} disabled={!miBarrio} title={miBarrio ? undefined : 'Elige tu barrio en Explorar o en tu perfil'}>Mi barrio</button>
              </div>
            </div>
            {favoritos.error && <Alert tone="error">{favoritos.error}</Alert>}
            {feedError && <Alert tone="info">No pudimos cargar las publicaciones por ahora.</Alert>}
            <div className="grid small">
              {products === null && !feedError && Array.from({ length: 4 }, (_, i) => <div key={i} className="card skel" />)}
              {products?.length === 0 && (
                <div className="empty"><img src="/img/planta.webp" alt="" /><h2 style={{ marginTop: 10 }}>Aún no hay nada en {nombreBarrio}</h2><p className="mu" style={{ margin: '0 0 16px' }}>Sé el primero en publicar algo.</p><Link className="btn" to="/publicar">Publicar algo</Link></div>
              )}
              {products?.map((p) => <ProductCard key={p.id} product={p} favorito={favoritos.paraTarjeta(p)} />)}
            </div>
            <div style={{ textAlign: 'center', marginTop: 26 }}><Link className="btn2" viewTransition to="/explorar">Ver todos los productos</Link></div>
          </section>
        </div>
      </main>
    </>
  );
}
