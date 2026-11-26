import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { ApiError, productApi, type Product } from '../lib/api';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; items: Product[] } | { tipo: 'error'; mensaje: string };

/** HU-14 · Mis favoritos: quitar con animación y opción de deshacer. */
export default function Favoritos() {
  const { token } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [saliendo, setSaliendo] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    productApi.favorites(token)
      .then((items) => activo && setEstado({ tipo: 'ok', items }))
      .catch((err) => activo && setEstado({ tipo: 'error', mensaje: err instanceof ApiError && err.status === 401 ? 'Tu sesión expiró. Vuelve a ingresar.' : 'No pudimos cargar tus favoritos. Inténtalo de nuevo.' }));
    return () => { activo = false; };
  }, [token]);

  const items = estado.tipo === 'ok' ? estado.items : [];

  async function quitar(p: Product) {
    if (!token || saliendo) return;
    const pos = items.findIndex((x) => x.id === p.id);
    setSaliendo(p.id);
    try {
      await productApi.removeFavorite(token, p.id);
      window.setTimeout(() => {
        setEstado((e) => (e.tipo === 'ok' ? { ...e, items: e.items.filter((x) => x.id !== p.id) } : e));
        setSaliendo(null);
        notify(`Quitaste «${p.title}» de favoritos`, {
          label: 'Deshacer',
          run: () => {
            void productApi.addFavorite(token, p.id).then(() =>
              setEstado((e) => (e.tipo === 'ok' ? { ...e, items: [...e.items.slice(0, pos), p, ...e.items.slice(pos)] } : e)),
            ).catch(() => notify('No pudimos deshacer el cambio.'));
          },
        });
      }, 280);
    } catch {
      setSaliendo(null);
      notify('No pudimos quitar el producto de tus favoritos. Inténtalo de nuevo.');
    }
  }

  const gone = (p: Product) => (p.status === 'RESERVED' ? 'Reservado' : p.status === 'SOLD' ? 'Vendido' : p.status === 'REMOVED' ? 'Retirado' : undefined);

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <Link className="back" viewTransition to="/inicio" style={{ marginTop: 10 }}>← Volver a inicio</Link>
        <div className="mph">
          <div><h1>Mis favoritos</h1><p className="mu" style={{ margin: '8px 0 0', maxWidth: '62ch' }}>Lo que guardaste para volver a ver. Quitarlo de aquí no afecta la publicación.</p></div>
          {estado.tipo === 'ok' && <span className="count">{items.length === 1 ? '1 guardado' : `${items.length} guardados`}</span>}
        </div>
        {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
        <div className="grid favgrid" data-testid="favoritos-lista">
          {estado.tipo === 'cargando' && [0, 1, 2, 3].map((i) => <div key={i} className="card skel" />)}
          {estado.tipo === 'ok' && items.length === 0 && (
            <div className="empty"><img src="/img/chaqueta.webp" alt="" /><h2 style={{ marginTop: 10 }}>Aún no tienes favoritos</h2><p className="mu" style={{ margin: '0 0 16px' }}>Toca el corazón en cualquier producto para guardarlo aquí.</p><Link className="btn" to="/explorar">Explorar productos</Link></div>
          )}
          {items.map((p) => (
            <ProductCard key={p.id} product={p} gone={gone(p)} className={saliendo === p.id ? 'out' : ''}
              favorito={{ activo: true, ocupado: saliendo !== null, alternar: () => void quitar(p) }} />
          ))}
        </div>
      </main>
    </>
  );
}
