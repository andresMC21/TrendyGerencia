import { Skeleton } from '../components/Skeleton';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert, SelectField } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { productApi, type Product, type ProductCondition } from '../lib/api';
import { BARRIOS, CATEGORIAS, guardarBarrio } from '../lib/barrios';
import { barrio, CATEGORIA, CONDICION } from '../lib/format';
import { useFavoritos } from '../lib/useFavoritos';

const POR_PAGINA = 12;

type Resultado = { consulta: string; items: Product[] | null; total: number; error: boolean };

/** Un valor de la URL que no está en el catálogo se trata como «sin filtro». */
const delCatalogo = (valor: string | null, catalogo: string[]) =>
  valor && catalogo.includes(valor) ? valor : '';

const paginaDe = (valor: string | null) =>
  valor && /^[1-9]\d{0,5}$/.test(valor) ? Number(valor) : 1;

/**
 * HU-09 · Explorar el barrio. Página pública: los filtros viven en la URL para
 * poder compartirla, y la API solo devuelve productos AVAILABLE.
 */
export default function Explorar() {
  const [params, setParams] = useSearchParams();
  const favoritos = useFavoritos();
  const barrioId = delCatalogo(params.get('barrio'), BARRIOS.map((b) => b.id));
  const categoria = delCatalogo(params.get('categoria'), CATEGORIAS);
  const condicion = delCatalogo(params.get('condicion'), Object.keys(CONDICION));
  const pagina = paginaDe(params.get('pagina'));

  // Un resultado solo vale para su consulta: mientras llega el nuevo, se ve «Cargando…».
  const consulta = params.toString();
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const actual = resultado?.consulta === consulta ? resultado : null;
  const products = actual?.items ?? null;
  const total = actual?.total ?? 0;
  const feedError = actual?.error ?? false;

  useEffect(() => {
    // Evita que una respuesta lenta pise el resultado del filtro más reciente.
    let vigente = true;
    productApi
      .feed({
        neighborhoodId: barrioId || undefined,
        category: categoria || undefined,
        condition: (condicion || undefined) as ProductCondition | undefined,
        page: pagina,
        limit: POR_PAGINA,
      })
      .then((r) => {
        if (vigente) setResultado({ consulta, items: r.items, total: r.total, error: false });
      })
      .catch(() => {
        if (vigente) setResultado({ consulta, items: null, total: 0, error: true });
      });
    return () => {
      vigente = false;
    };
  }, [consulta, barrioId, categoria, condicion, pagina]);

  const filtrar = (clave: string, valor: string) => {
    const siguiente = new URLSearchParams(params);
    if (valor) siguiente.set(clave, valor);
    else siguiente.delete(clave);
    siguiente.delete('pagina');
    setParams(siguiente);
  };

  const irAPagina = (n: number) => {
    const siguiente = new URLSearchParams(params);
    if (n > 1) siguiente.set('pagina', String(n));
    else siguiente.delete('pagina');
    setParams(siguiente);
    window.scrollTo(0, 0);
  };

  const hayFiltros = Boolean(barrioId || categoria || condicion);
  const paginas = Math.ceil(total / POR_PAGINA);

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container">
          <h1 className="dash-title">Explora tu barrio</h1>

          <div className="filters">
            <SelectField
              label="Barrio"
              value={barrioId}
              hint="Recordaremos tu barrio en este dispositivo."
              onChange={(e) => {
                if (e.target.value) guardarBarrio(e.target.value);
                filtrar('barrio', e.target.value);
              }}
            >
              <option value="">Toda Cali</option>
              {BARRIOS.map((b) => (
                <option key={b.id} value={b.id}>
                  {barrio(b.id)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Categoría"
              value={categoria}
              onChange={(e) => filtrar('categoria', e.target.value)}
            >
              <option value="">Todas</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA[c] ?? c}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Condición"
              value={condicion}
              onChange={(e) => filtrar('condicion', e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(CONDICION).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="feed-head">
            <h2>{barrioId ? `Productos en ${barrio(barrioId)}` : 'Todos los productos'}</h2>
            {products && (
              <span>
                {total} {total === 1 ? 'publicación disponible' : 'publicaciones disponibles'}
              </span>
            )}
            {hayFiltros && (
              <button className="link-button" onClick={() => setParams({})}>
                Quitar filtros
              </button>
            )}
          </div>

          {favoritos.error && <Alert tone="error">{favoritos.error}</Alert>}
          {feedError && <Alert tone="info">No pudimos cargar las publicaciones por ahora.</Alert>}
          {products?.length === 0 && (
            <Alert tone="info">
              {hayFiltros ? 'No hay productos con estos filtros.' : 'Aún no hay publicaciones en Cali.'}
            </Alert>
          )}
          {products === null && !feedError && <Skeleton kind="products" />}
          <div className="feed">
            {products?.map((p) => (
              <ProductCard key={p.id} product={p} favorito={favoritos.paraTarjeta(p)} />
            ))}
          </div>

          {products && (paginas > 1 || pagina > 1) && (
            <nav className="pager" aria-label="Paginación">
              <button
                className="btn btn-outline btn-sm"
                disabled={pagina === 1}
                onClick={() => irAPagina(Math.min(pagina - 1, Math.max(paginas, 1)))}
              >
                Anterior
              </button>
              <span>
                Página {pagina} de {Math.max(paginas, 1)}
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={pagina >= paginas}
                onClick={() => irAPagina(pagina + 1)}
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
