import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { Heart, PriceTag } from '../components/PriceTag';
import { RetirarPublicacion } from '../components/RetirarPublicacion';
import { ApiError, productApi, transactionApi, userApi, type Product, type ProductDetail, type PublicProfile } from '../lib/api';
import { barrio, CATEGORIA, CONDICION, precio } from '../lib/format';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; producto: ProductDetail } | { tipo: 'no-existe' } | { tipo: 'error' };

const fechaLarga = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
const estrellas = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

/** HU-11 · Detalle de producto (prototipo TRD-25). */
export default function Producto() {
  const { id = '' } = useParams();
  return <ProductoPagina key={id} id={id} />;
}

function ProductoPagina({ id }: { id: string }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const { state } = useLocation();
  const preview = state as { photoUrl?: string; title?: string } | null;
  useEffect(() => {
    let activo = true;
    productApi.get(id)
      .then((producto) => activo && setEstado({ tipo: 'ok', producto }))
      .catch((err) => {
        if (!activo) return;
        const noExiste = err instanceof ApiError && (err.status === 404 || err.status === 400);
        setEstado({ tipo: noExiste ? 'no-existe' : 'error' });
      });
    return () => { activo = false; };
  }, [id]);

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <p className="crumbs">
          <Link viewTransition to="/explorar">← Volver a las publicaciones</Link>
          {estado.tipo === 'ok' && <> <span aria-hidden="true">·</span> <Link viewTransition to={`/explorar?categoria=${estado.producto.category}`}>{CATEGORIA[estado.producto.category] ?? estado.producto.category}</Link></>}
        </p>
        {estado.tipo === 'cargando' && (
          <div className="pd"><div><div className="gal">{preview?.photoUrl && <div className="zoomwrap"><img src={preview.photoUrl} alt="" /></div>}</div></div><div className="pinfo"><h1 style={{ opacity: 0.4 }}>{preview?.title ?? 'Cargando…'}</h1></div></div>
        )}
        {estado.tipo === 'no-existe' && <Alert tone="info">Este producto no existe o ya no está publicado. <Link viewTransition to="/explorar">Ver otras publicaciones</Link></Alert>}
        {estado.tipo === 'error' && <Alert tone="error">No pudimos cargar el producto. Inténtalo de nuevo en un momento.</Alert>}
        {estado.tipo === 'ok' && <Detalle p={estado.producto} />}
      </main>
    </>
  );
}

function Detalle({ p: inicial }: { p: ProductDetail }) {
  const { user, token, loading } = useSession();
  const navigate = useNavigate();
  const [p, setP] = useState(inicial);
  const [perfil, setPerfil] = useState<PublicProfile | null>(null);
  const [verRevs, setVerRevs] = useState(false);
  const [esFav, setEsFav] = useState<boolean | null>(null);
  const [burst, setBurst] = useState(0);
  const [zoom, setZoom] = useState<string | null>(null);
  const [panel, setPanel] = useState<null | 'compra' | 'trueque'>(null);
  const [msg, setMsg] = useState('');
  const [mios, setMios] = useState<Product[] | null>(null);
  const [ofrezco, setOfrezco] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const soyDueno = user?.id === p.seller.id;

  useEffect(() => {
    if (!token) return;
    userApi.publicProfile(token, p.seller.id).then(setPerfil).catch(() => undefined);
    productApi.favorites(token).then((l) => setEsFav(l.some((f) => f.id === p.id))).catch(() => setEsFav(false));
    productApi.mine(token).then((l) => setMios(l.filter((x) => x.status === 'AVAILABLE'))).catch(() => setMios([]));
  }, [token, p.seller.id, p.id]);

  const alternarFav = async () => {
    if (!token || esFav === null) return;
    const quiere = !esFav;
    try {
      if (quiere) await productApi.addFavorite(token, p.id); else await productApi.removeFavorite(token, p.id);
      setEsFav(quiere);
      if (quiere) setBurst((b) => b + 1);
      setP((x) => ({ ...x, favoritesCount: Math.max(0, x.favoritesCount + (quiere ? 1 : -1)) }));
      notify(quiere ? 'Guardado en favoritos' : 'Quitado de favoritos');
    } catch { notify('No pudimos actualizar tus favoritos'); }
  };

  const abrir = (tipo: 'compra' | 'trueque') => {
    if (!user) { navigate('/ingresar'); return; }
    setPanel(tipo);
    setError('');
    window.setTimeout(() => panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
  };

  const enviar = async () => {
    if (!token) return;
    if (panel === 'trueque' && ofrezco.length === 0) { notify('Elige al menos una publicación para ofrecer'); return; }
    const ofertas = (mios ?? []).filter((x) => ofrezco.includes(x.id)).map((x) => x.title);
    const texto = [panel === 'trueque' && ofertas.length ? `Propongo un trueque: ofrezco ${ofertas.join(', ')}.` : '', msg.trim()].filter(Boolean).join(' ');
    setEnviando(true);
    setError('');
    try {
      const tx = await transactionApi.create(token, p.id, texto || undefined);
      notify('Solicitud enviada · ahora acuerden el encuentro');
      navigate(`/transacciones/${tx.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? (err.status === 401 ? 'Tu sesión expiró. Vuelve a ingresar.' : err.message) : 'No pudimos iniciar la transacción. Inténtalo de nuevo.');
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) await productApi.get(p.id).then(setP).catch(() => undefined);
    } finally { setEnviando(false); }
  };

  const disponible = p.status === 'AVAILABLE';
  const chipEstado = disponible ? ['● Disponible', 'g'] : p.status === 'RESERVED' ? ['Reservado', 'o'] : p.status === 'SOLD' ? ['Vendido', 'n'] : ['Retirado', 'n'];
  const verificado = perfil?.verificationStatus === 'VERIFIED';
  const nombre = p.seller.fullName.split(' ')[0];

  return (
    <>
      <div className="pd">
        <div>
          <div className={`gal${zoom ? ' zoom' : ''}`} tabIndex={0} aria-label="Foto del producto"
            onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom(`${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`); }}
            onMouseLeave={() => setZoom(null)}>
            <PriceTag price={p.price} className="bigtag" big />
            <div className="zoomwrap">{p.photoUrl ? <img src={p.photoUrl} alt={p.title} style={zoom ? { transformOrigin: zoom } : undefined} /> : <span className="noph" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>Sin fotografía</span>}</div>
            {p.photoUrl && <span className="zhint" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" /></svg>Pasa el mouse para ver de cerca</span>}
          </div>
        </div>
        <div className="pinfo">
          <span className="mu" style={{ fontSize: 14, fontWeight: 700 }}>{CATEGORIA[p.category] ?? p.category}</span>
          <h1 style={{ marginTop: 6 }} data-testid="producto-titulo">{p.title}</h1>
          <p className="price" data-testid="producto-precio">{precio(Number(p.price))}</p>
          <div className="chips">
            <span className={`chip ${chipEstado[1]}`}>{chipEstado[0]}</span>
            {p.acceptsBarter && <span className="chip o">Acepta trueque</span>}
            <span className="chip n">{CONDICION[p.condition] ?? p.condition}</span>
            <span className="chip n">{barrio(p.neighborhoodId)}</span>
          </div>
          <p className="stats"><span>{p.viewsCount} visitas</span><span aria-hidden="true">·</span><span><b>{p.favoritesCount}</b> lo guardaron</span><span aria-hidden="true">·</span><span>Publicado el {new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}</span></p>
          <div className="seller" data-testid="producto-vendedor">
            <Avatar name={p.seller.fullName} photoUrl={perfil?.photoUrl} avatar={perfil?.avatar} />
            <div style={{ flex: 1 }}>
              <Link to={soyDueno ? '/perfil' : `/usuario/${p.seller.id}`} style={{ color: 'var(--ink)', fontWeight: 700 }} data-testid="ver-perfil-vendedor">{p.seller.fullName}</Link>
              {verificado && <span className="chip b" style={{ marginLeft: 6 }}>Verificada</span>}
              <div className="mu" style={{ fontSize: 14 }}>
                {p.seller.reviewsCount > 0
                  ? <><span className="stars" aria-label={`${Number(p.seller.ratingAverage).toFixed(1)} de 5`}>{estrellas(Number(p.seller.ratingAverage))}</span> {Number(p.seller.ratingAverage).toLocaleString('es-CO', { maximumFractionDigits: 1 })} · {p.seller.reviewsCount} {p.seller.reviewsCount === 1 ? 'reseña' : 'reseñas'}</>
                  : 'Sin calificaciones todavía'}
              </div>
            </div>
            {perfil && perfil.recentReviews.length > 0 && <button className="ghost" type="button" aria-expanded={verRevs} onClick={() => setVerRevs((v) => !v)}>{verRevs ? 'Ocultar reseñas' : 'Ver reseñas'}</button>}
          </div>
          {verRevs && perfil && (
            <div className="revs">
              {perfil.recentReviews.slice(0, 3).map((r, i) => (
                <div className="rev" key={i}><span className="stars">{estrellas(r.rating)}</span>{r.comment && <p>“{r.comment}”</p>}<small>{r.reviewerName.split(' ')[0]} · {new Date(r.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</small></div>
              ))}
            </div>
          )}

          {loading ? null : soyDueno ? (
            <div className="acts">
              {disponible ? (
                <>
                  <Link className="btn2" viewTransition to={`/editar/${p.id}`}>Editar publicación</Link>
                  <RetirarPublicacion productId={p.id} title={p.title} onRemoved={() => navigate('/mis-publicaciones', { state: { retirado: p.title } })}
                    onConflict={(m) => { notify(m); void productApi.get(p.id).then(setP).catch(() => undefined); }} />
                </>
              ) : (
                <p className="noswap">{p.status === 'RESERVED' ? <>Está reservada en una transacción. Para retirarla, primero cancélala en <Link to="/transacciones">Transacciones</Link>.</> : <>Ya no está disponible. Revisa <Link to="/mis-publicaciones">Mis publicaciones</Link>.</>}</p>
              )}
            </div>
          ) : (
            <>
              <div className="acts">
                <button className="btn" type="button" disabled={!disponible} onClick={() => abrir('compra')}>Comprar</button>
                {p.acceptsBarter && (mios === null || mios.length > 0) && <button className="btn2" type="button" disabled={!disponible} onClick={() => abrir('trueque')}>Proponer trueque</button>}
                {user && esFav !== null && (
                  <button className={`fav big${burst ? ' burst' : ''}`} key={burst} type="button" aria-pressed={esFav} aria-label={esFav ? 'Quitar de favoritos' : 'Guardar en favoritos'} onClick={() => void alternarFav()} data-testid="boton-favorito"><Heart /></button>
                )}
              </div>
              {!disponible && <p className="noswap">Este producto ya no está disponible para iniciar una transacción.</p>}
              {p.acceptsBarter && mios !== null && mios.length === 0 && <p className="noswap">¿Quieres intercambiar? <Link to="/publicar">Publica algo primero →</Link></p>}
              {!user && <p className="noswap"><Link to="/ingresar">Ingresa a tu cuenta</Link> para comprar, proponer un trueque o guardarlo.</p>}
              <div className={`panel${panel ? ' on' : ''}`} ref={panelRef} role="region" aria-labelledby="panel-t">
                <h2 id="panel-t" style={{ fontSize: 20 }}>{panel === 'trueque' ? 'Proponer trueque' : 'Iniciar compra'}</h2>
                {error && <Alert tone="error">{error}</Alert>}
                {panel === 'trueque' && (
                  <div>
                    <p className="plabel">¿Qué ofreces a cambio? <span className="mu" style={{ fontWeight: 400 }}>Elige una o varias de tus publicaciones</span></p>
                    <div className="mine">
                      {(mios ?? []).map((x) => (
                        <label className="mi" key={x.id}>
                          <input type="checkbox" checked={ofrezco.includes(x.id)} onChange={(e) => setOfrezco((o) => e.target.checked ? [...o, x.id] : o.filter((v) => v !== x.id))} />
                          {x.photoUrl ? <img src={x.photoUrl} alt="" /> : <span />}
                          <span><b>{x.title}</b><small>{precio(Number(x.price))}</small></span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <label className="plabel" htmlFor="msg">Mensaje para {nombre} <span className="mu" style={{ fontWeight: 400 }}>(opcional)</span></label>
                <textarea id="msg" maxLength={500} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={panel === 'trueque' ? 'Cuéntale por qué te interesa o qué más podrías agregar' : 'Hola, me interesa. ¿Podemos vernos esta semana?'} />
                <div className="mu" style={{ fontSize: 12, textAlign: 'right' }}>{msg.length}/500</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button className="btn" type="button" disabled={enviando} onClick={() => void enviar()}>{enviando ? 'Enviando…' : panel === 'trueque' ? 'Enviar propuesta de trueque' : 'Enviar solicitud'}</button>
                  <button className="ghost" type="button" onClick={() => setPanel(null)}>Cancelar</button>
                </div>
              </div>
            </>
          )}
          <div className="safe">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>
            <div><b style={{ color: 'var(--ink)' }}>Entrega presencial en un punto seguro</b><div className="mu" style={{ fontSize: 14 }}>Después de iniciar, uno propone un CAI o una estación del MIO con la hora, y el otro lo acepta.</div></div>
          </div>
        </div>
      </div>
      <div className="desc">
        <h2>Descripción</h2>
        <p className="mu" style={{ maxWidth: 720, margin: 0, whiteSpace: 'pre-line' }}>{p.description}</p>
        <dl className="dl"><div><dt>Condición</dt><dd>{CONDICION[p.condition] ?? p.condition}</dd></div><div><dt>Barrio</dt><dd>{barrio(p.neighborhoodId)}</dd></div><div><dt>Publicado</dt><dd>{fechaLarga(p.createdAt)}</dd></div></dl>
      </div>
    </>
  );
}
