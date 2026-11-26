import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { ApiError, productApi, userApi, type Product, type PublicProfile } from '../lib/api';
import { useSession } from '../lib/session';
import { useFavoritos } from '../lib/useFavoritos';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; perfil: PublicProfile }
  | { tipo: 'no-existe' }
  | { tipo: 'error'; mensaje: string };

const VER: Record<PublicProfile['verificationStatus'], [string, string]> = {
  VERIFIED: ['Identidad verificada', 'b'],
  PENDING: ['Verificación en revisión', 'bl'],
  UNVERIFIED: ['Sin verificar', ''],
  REJECTED: ['Sin verificar', ''],
};

function haceCuanto(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias < 1) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  if (dias < 30) { const s = Math.floor(dias / 7); return s === 1 ? 'hace 1 semana' : `hace ${s} semanas`; }
  const m = Math.floor(dias / 30);
  return m === 1 ? 'hace 1 mes' : m < 12 ? `hace ${m} meses` : 'hace más de un año';
}

/** HU-07 · Perfil público y reputación (GET /user/:id). */
export default function PerfilPublico() {
  const { id = '' } = useParams();
  return <PerfilPublicoPagina key={id} id={id} />;
}

function PerfilPublicoPagina({ id }: { id: string }) {
  const { token, user } = useSession();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token) return;
    let activo = true;
    userApi.publicProfile(token, id)
      .then((perfil) => activo && setEstado({ tipo: 'ok', perfil }))
      .catch((err) => {
        if (!activo) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setEstado({ tipo: 'no-existe' });
        else setEstado({ tipo: 'error', mensaje: 'No pudimos cargar este perfil. Inténtalo de nuevo.' });
      });
    return () => { activo = false; };
  }, [token, id]);

  const esMio = estado.tipo === 'ok' && estado.perfil.id === user?.id;

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        {esMio
          ? <Link className="back" viewTransition to="/perfil" style={{ marginTop: 10 }}>← Volver a mi perfil</Link>
          : <button type="button" className="back" style={{ marginTop: 10, background: 'none', border: 0, padding: 0, cursor: 'pointer' }} onClick={() => navigate(-1)}>← Volver</button>}
        {estado.tipo === 'cargando' && <div className="pubhead"><div className="card skel" style={{ height: 160, gridColumn: '1/-1' }} /></div>}
        {estado.tipo === 'no-existe' && <div className="empty"><img src="/img/lampara.webp" alt="" /><h2 style={{ marginTop: 10 }}>Este perfil no está disponible</h2><p className="mu">Puede que la cuenta no exista o esté desactivada.</p><Link className="btn" to="/explorar">Ir a explorar</Link></div>}
        {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
        {estado.tipo === 'ok' && <Detalle perfil={estado.perfil} esMio={esMio} />}
      </main>
    </>
  );
}

function Detalle({ perfil, esMio }: { perfil: PublicProfile; esMio: boolean }) {
  const favoritos = useFavoritos();
  const [productos, setProductos] = useState<Product[] | null>(null);
  const [todas, setTodas] = useState(false);
  const primerNombre = perfil.fullName.split(' ')[0];
  const [chip, tono] = VER[perfil.verificationStatus];
  const promedio = Number(perfil.ratingAverage ?? 0);
  const hay = perfil.reviewsCount > 0;
  const conteo = [5, 4, 3, 2, 1].map((n) => perfil.recentReviews.filter((r) => r.rating === n).length);
  const total = perfil.recentReviews.length || 1;
  const resenas = todas ? perfil.recentReviews : perfil.recentReviews.slice(0, 2);

  useEffect(() => {
    let activo = true;
    productApi.feed({ sellerId: perfil.id, limit: 12 })
      .then((r) => activo && setProductos(r.items))
      .catch(() => activo && setProductos([]));
    return () => { activo = false; };
  }, [perfil.id]);

  return (
    <>
      {esMio && <div className="mine-note"><span>👀 Así ven tu perfil los demás.</span><Link className="linkbtn" to="/perfil">Editar mi perfil</Link></div>}
      <div className="pubhead" aria-label={`Perfil de ${perfil.fullName}`}>
        <Avatar large name={perfil.fullName} photoUrl={perfil.photoUrl} avatar={perfil.avatar} />
        <div>
          <h1 data-testid="perfil-publico-nombre">{perfil.fullName}</h1>
          <div style={{ marginTop: 6 }}><span className={`chip ${tono}`} data-testid="perfil-publico-verificacion">{chip}</span></div>
          <p className="mu" style={{ margin: '10px 0 0', maxWidth: '60ch' }}>{perfil.info?.trim() || `${primerNombre} aún no ha escrito sobre sí.`}</p>
          <div className="facts">
            <span><b>{perfil.availableProductsCount}</b> {perfil.availableProductsCount === 1 ? 'producto disponible' : 'productos disponibles'}</span>
            <span>Miembro desde <b>{new Date(perfil.memberSince).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</b></span>
          </div>
        </div>
        <div className="score" data-testid="perfil-publico-reputacion">
          <b>{hay ? promedio.toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—'}</b>
          <span className="stars" aria-hidden="true">{'★'.repeat(Math.round(promedio))}<span style={{ color: 'var(--ln)' }}>{'★'.repeat(5 - Math.round(promedio))}</span></span>
          <small>{hay ? `${perfil.reviewsCount} ${perfil.reviewsCount === 1 ? 'reseña' : 'reseñas'}` : 'Sin reseñas aún'}</small>
        </div>
      </div>
      <div className="pubgrid">
        <section>
          <div className="sechead"><h2>Publicaciones de {primerNombre}</h2></div>
          <div className={`grid small${esMio ? ' own' : ''}`} style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
            {productos === null && [0, 1].map((i) => <div key={i} className="card skel" />)}
            {productos?.length === 0 && <p className="mu" style={{ gridColumn: '1/-1' }}>{esMio ? 'No tienes publicaciones disponibles.' : `${primerNombre} no tiene publicaciones disponibles ahora.`}</p>}
            {productos?.map((p) => <ProductCard key={p.id} product={p} hideFav={esMio} favorito={esMio ? undefined : favoritos.paraTarjeta(p)} />)}
          </div>
        </section>
        <aside className="box" style={{ position: 'sticky', top: 96 }}>
          <h3 style={{ fontFamily: "'Young Serif',Georgia,serif", fontWeight: 400, fontSize: 22, margin: 0, color: 'var(--ink)' }}>Reseñas</h3>
          <div className="bars">
            {conteo.map((c, i) => <div key={i}>{5 - i} ★<i style={{ ['--w' as string]: `${Math.round((c / total) * 100)}%` }} />{c}</div>)}
          </div>
          {!hay && <p className="mu" style={{ fontSize: 14 }}>Todavía no hay reseñas.</p>}
          <div data-testid="perfil-publico-resenas">
            {resenas.map((r, i) => (
              <div key={`${r.createdAt}-${i}`} className="rv">
                <div className="h">
                  <Avatar name={r.reviewerName} />
                  <b>{r.reviewerName}</b>
                  <span className="stars" aria-label={`${r.rating} de 5`}>{'★'.repeat(r.rating)}<span style={{ color: 'var(--ln)' }}>{'★'.repeat(5 - r.rating)}</span></span>
                  <small>{haceCuanto(r.createdAt)}</small>
                </div>
                {r.comment && <p>{r.comment}</p>}
              </div>
            ))}
          </div>
          {!todas && perfil.recentReviews.length > 2 && <button className="linkbtn" type="button" onClick={() => setTodas(true)}>Ver más reseñas</button>}
        </aside>
      </div>
    </>
  );
}
