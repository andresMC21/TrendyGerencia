import { Skeleton } from '../components/Skeleton';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { ApiError, productApi, type Product } from '../lib/api';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: Product[] }
  | { tipo: 'error'; mensaje: string };

/** HU-14 · Mis productos favoritos: ver la lista y quitar productos de ella. */
export default function Favoritos() {
  const { token } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [aviso, setAviso] = useState('');
  const [problema, setProblema] = useState('');
  const [quitando, setQuitando] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    productApi
      .favorites(token)
      .then((items) => activo && setEstado({ tipo: 'ok', items }))
      .catch(
        (err) =>
          activo &&
          setEstado({
            tipo: 'error',
            mensaje:
              err instanceof ApiError && err.status === 401
                ? 'Tu sesión expiró. Vuelve a ingresar.'
                : 'No pudimos cargar tus favoritos. Inténtalo de nuevo.',
          }),
      );
    return () => {
      activo = false;
    };
  }, [token]);

  async function quitar(p: Product) {
    if (!token || quitando) return;
    setQuitando(p.id);
    setAviso('');
    setProblema('');
    try {
      await productApi.removeFavorite(token, p.id);
      setEstado((e) =>
        e.tipo === 'ok' ? { ...e, items: e.items.filter((x) => x.id !== p.id) } : e,
      );
      setAviso(`Quitaste «${p.title}» de tus favoritos. La publicación sigue en Trendy.`);
    } catch {
      setProblema('No pudimos quitar el producto de tus favoritos. Inténtalo de nuevo.');
    } finally {
      setQuitando(null);
    }
  }

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container">
          <Link viewTransition to="/inicio" className="back-link">
            ← Volver a Mi Trendy
          </Link>
          <h1 className="dash-title">Mis favoritos</h1>
          <p className="tx-lead">
            Los productos que guardaste para volver a verlos. Quitarlos de aquí no afecta la
            publicación.
          </p>

          {aviso && (
            <div data-testid="aviso-favorito">
              <Alert tone="success">{aviso}</Alert>
            </div>
          )}
          {problema && <Alert tone="error">{problema}</Alert>}
          {estado.tipo === 'cargando' && <Skeleton kind="products" />}
          {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}

          {estado.tipo === 'ok' && estado.items.length === 0 && (
            <Alert tone="info">
              Aún no tienes favoritos. <Link viewTransition to="/explorar">Explora los productos</Link> y guarda los
              que te interesen.
            </Alert>
          )}

          {estado.tipo === 'ok' && estado.items.length > 0 && (
            <div className="feed" data-testid="favoritos-lista">
              {estado.items.map((p) => (
                <div key={p.id} className="fav-item" data-testid={`favorito-${p.id}`}>
                  <ProductCard product={p} />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => void quitar(p)}
                    disabled={quitando !== null}
                  >
                    {quitando === p.id ? 'Quitando…' : 'Quitar de favoritos'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
