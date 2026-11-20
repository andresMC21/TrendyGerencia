import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert, SelectField } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { RadioSlider } from '../components/RadioSlider';
import { productApi, type GeoPoint, type Product, type ProductCondition, type ProductSort } from '../lib/api';
import { BARRIOS, CATEGORIAS, guardarBarrio } from '../lib/barrios';
import { barrio, CATEGORIA, CONDICION } from '../lib/format';
import { useFavoritos } from '../lib/useFavoritos';
import {
  permisoDeUbicacionConcedido,
  RADIO_POR_DEFECTO,
  radioDeUrl,
  ubicacionDelDispositivo,
} from '../lib/ubicacion';

// Leaflet solo se descarga si la persona abre el mapa.
const MapaUbicacion = lazy(() => import('../components/MapaUbicacion'));

const POR_PAGINA = 12;
const BARRIO_IDS = BARRIOS.map((b) => b.id);

const ORDENES: { valor: ProductSort; etiqueta: string }[] = [
  { valor: 'recent', etiqueta: 'Más recientes' },
  { valor: 'price_asc', etiqueta: 'Menor precio' },
  { valor: 'price_desc', etiqueta: 'Mayor precio' },
  { valor: 'popular', etiqueta: 'Más vistos' },
  { valor: 'distance', etiqueta: 'Más cercanos' },
];

/**
 * HU-10 · Centros de búsqueda que no van en la URL: las coordenadas del
 * dispositivo o de un punto del mapa se quedan en memoria por seguridad, y la
 * URL solo dice de qué tipo es el centro.
 */
type CentroPrivado = 'mi-ubicacion' | 'punto';

type Resultado = { consulta: string; items: Product[] | null; total: number; error: boolean };

/** Un valor de la URL que no está en el catálogo se trata como «sin filtro». */
const delCatalogo = (valor: string | null, catalogo: string[]) =>
  valor && catalogo.includes(valor) ? valor : '';

const paginaDe = (valor: string | null) =>
  valor && /^[1-9]\d{0,5}$/.test(valor) ? Number(valor) : 1;

const kmTexto = (km: number) => `${km.toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`;

/**
 * HU-09 · Explorar el barrio y HU-10 · Buscar por cercanía. Página pública: los
 * filtros viven en la URL para poder compartirla, y la API solo devuelve
 * productos AVAILABLE.
 */
export default function Explorar() {
  const [params, setParams] = useSearchParams();
  const favoritos = useFavoritos();
  const barrioId = delCatalogo(params.get('barrio'), BARRIO_IDS);
  const categoria = delCatalogo(params.get('categoria'), CATEGORIAS);
  const condicion = delCatalogo(params.get('condicion'), Object.keys(CONDICION));
  const pagina = paginaDe(params.get('pagina'));
  const orden = delCatalogo(params.get('orden'), ORDENES.map((o) => o.valor)) as ProductSort | '';
  const radio = radioDeUrl(params.get('radio'));
  const centroBarrio = delCatalogo(params.get('centro'), BARRIO_IDS);
  const centroPrivado = delCatalogo(params.get('centro'), ['mi-ubicacion', 'punto']) as CentroPrivado | '';

  const [puntoPrivado, setPuntoPrivado] = useState<{ tipo: CentroPrivado; punto: GeoPoint } | null>(null);
  const centro: GeoPoint | null = centroBarrio
    ? BARRIOS.find((b) => b.id === centroBarrio)!.punto
    : puntoPrivado && puntoPrivado.tipo === centroPrivado
      ? puntoPrivado.punto
      : null;
  const cercania = Boolean(centroBarrio || centroPrivado);
  // Tras recargar, la URL recuerda «mi ubicación», pero las coordenadas no.
  const esperandoCentro = cercania && !centro;

  /** Por qué se abrió el panel: al venir de «Más cercanos», elegir un centro también ordena. */
  const [panel, setPanel] = useState<'orden' | 'cambiar' | null>(null);
  const [ubicando, setUbicando] = useState(false);
  const [errorUbicacion, setErrorUbicacion] = useState('');
  const [radioBorrador, setRadioBorrador] = useState<number | null>(null);
  const temporizadorRadio = useRef<ReturnType<typeof setTimeout>>(undefined);

  const lat = centro?.lat;
  const lng = centro?.lng;

  // Un resultado solo vale para su consulta: mientras llega el nuevo, se ve «Cargando…».
  const consulta = `${params.toString()}|${lat ?? ''},${lng ?? ''}`;
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const actual = resultado?.consulta === consulta ? resultado : null;
  const products = actual?.items ?? null;
  const total = actual?.total ?? 0;
  const feedError = actual?.error ?? false;

  useEffect(() => {
    if (esperandoCentro) return;
    // Evita que una respuesta lenta pise el resultado del filtro más reciente.
    let vigente = true;
    productApi
      .feed({
        neighborhoodId: barrioId || undefined,
        category: categoria || undefined,
        condition: (condicion || undefined) as ProductCondition | undefined,
        lat,
        lng,
        radius: lat !== undefined ? radio : undefined,
        sort: orden && (orden !== 'distance' || lat !== undefined) ? orden : undefined,
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
  }, [consulta, esperandoCentro, barrioId, categoria, condicion, lat, lng, radio, orden, pagina]);

  // Si el navegador ya dio permiso, una recarga recupera la ubicación sin preguntar.
  useEffect(() => {
    if (centroPrivado !== 'mi-ubicacion' || puntoPrivado?.tipo === 'mi-ubicacion') return;
    let vigente = true;
    permisoDeUbicacionConcedido()
      .then((concedido) => (concedido ? ubicacionDelDispositivo() : null))
      .then((punto) => {
        if (vigente && punto) setPuntoPrivado({ tipo: 'mi-ubicacion', punto });
      })
      .catch(() => {
        /* el panel ofrece las otras opciones */
      });
    return () => {
      vigente = false;
    };
  }, [centroPrivado, puntoPrivado]);

  useEffect(() => () => clearTimeout(temporizadorRadio.current), []);

  const cambiar = (cambios: Record<string, string>) => {
    const siguiente = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    siguiente.delete('pagina');
    setParams(siguiente);
  };

  const filtrar = (clave: string, valor: string) => cambiar({ [clave]: valor });

  /** Barrio y cercanía son excluyentes: elegir un barrio quita la búsqueda por radio. */
  const elegirBarrio = (valor: string) => {
    if (valor) guardarBarrio(valor);
    setPanel(null);
    cambiar({
      barrio: valor,
      ...(valor ? { centro: '', radio: '', orden: orden === 'distance' ? '' : orden } : {}),
    });
  };

  const elegirOrden = (valor: string) => {
    if (valor === 'distance' && !centro) {
      setErrorUbicacion('');
      setPanel('orden');
      return;
    }
    filtrar('orden', valor === 'recent' ? '' : valor);
  };

  const aplicarCentro = (nuevo: string) => {
    setErrorUbicacion('');
    cambiar({
      centro: nuevo,
      barrio: '',
      ...(panel === 'orden' ? { orden: 'distance' } : {}),
    });
    setPanel((p) => (p === 'orden' ? 'cambiar' : p));
  };

  const usarMiUbicacion = async () => {
    setUbicando(true);
    setErrorUbicacion('');
    try {
      const punto = await ubicacionDelDispositivo();
      setPuntoPrivado({ tipo: 'mi-ubicacion', punto });
      aplicarCentro('mi-ubicacion');
      setPanel(null);
    } catch (error) {
      setErrorUbicacion(error instanceof Error ? error.message : String(error));
    } finally {
      setUbicando(false);
    }
  };

  const elegirEnMapa = (punto: GeoPoint, barrioDelPunto?: string) => {
    if (barrioDelPunto) {
      aplicarCentro(barrioDelPunto);
      return;
    }
    setPuntoPrivado({ tipo: 'punto', punto });
    aplicarCentro('punto');
  };

  const quitarCercania = () => {
    setPanel(null);
    setPuntoPrivado(null);
    cambiar({ centro: '', radio: '', orden: orden === 'distance' ? '' : orden });
  };

  // El radio se aplica al soltar: así arrastrar no dispara una consulta por píxel.
  const cambiarRadio = (km: number) => {
    setRadioBorrador(km);
    clearTimeout(temporizadorRadio.current);
    temporizadorRadio.current = setTimeout(() => {
      filtrar('radio', km === RADIO_POR_DEFECTO ? '' : String(km));
      setRadioBorrador(null);
    }, 350);
  };

  const irAPagina = (n: number) => {
    const siguiente = new URLSearchParams(params);
    if (n > 1) siguiente.set('pagina', String(n));
    else siguiente.delete('pagina');
    setParams(siguiente);
    window.scrollTo(0, 0);
  };

  const quitarFiltros = () => {
    setPanel(null);
    setPuntoPrivado(null);
    setParams({});
  };

  const radioVisible = radioBorrador ?? radio;
  const nombreCentro = centroBarrio
    ? barrio(centroBarrio)
    : centroPrivado === 'mi-ubicacion'
      ? 'tu ubicación'
      : 'el punto elegido';
  const hayFiltros = Boolean(barrioId || categoria || condicion || cercania || orden);
  const paginas = Math.ceil(total / POR_PAGINA);
  const ordenVisible = orden === 'distance' && !centro ? 'recent' : orden || 'recent';

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
              hint={cercania ? 'Elegir un barrio quita la búsqueda por cercanía.' : 'Recordaremos tu barrio en este dispositivo.'}
              onChange={(e) => elegirBarrio(e.target.value)}
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
            <SelectField
              label="Ordenar por"
              value={ordenVisible}
              hint={centro ? undefined : '«Más cercanos» te pedirá una ubicación.'}
              onChange={(e) => elegirOrden(e.target.value)}
            >
              {ORDENES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.etiqueta}
                </option>
              ))}
            </SelectField>
          </div>

          {cercania && (
            <section className="cerca-bar" aria-label="Búsqueda por cercanía">
              <div className="cerca-centro">
                <span className="cerca-kicker">Buscando cerca de</span>
                <strong>{nombreCentro}</strong>
              </div>
              <RadioSlider value={radioVisible} onChange={cambiarRadio} />
              <div className="cerca-acciones">
                {panel === null && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setPanel('cambiar')}>
                    Cambiar ubicación
                  </button>
                )}
                <button type="button" className="link-button" onClick={quitarCercania}>
                  Quitar ubicación
                </button>
              </div>
            </section>
          )}

          {(panel !== null || esperandoCentro) && (
            <section className="ubicacion-panel" aria-labelledby="ubicacion-titulo">
              <div className="ubicacion-panel-head">
                <div>
                  <h2 id="ubicacion-titulo">¿Desde dónde buscamos?</h2>
                  <p>
                    {esperandoCentro && panel === null
                      ? 'Vuelve a compartir tu ubicación o elige un punto para ver los productos cercanos.'
                      : 'Usa la ubicación de este dispositivo, toca un punto del mapa o elige uno de los barrios marcados.'}{' '}
                    No guardamos tus coordenadas en el enlace de la página.
                  </p>
                </div>
                {panel !== null && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setPanel(null)}>
                    {centro ? 'Listo' : 'Cancelar'}
                  </button>
                )}
              </div>
              <div className="ubicacion-opciones">
                <button type="button" className="btn btn-primary btn-sm" onClick={usarMiUbicacion} disabled={ubicando}>
                  {ubicando ? 'Obteniendo ubicación…' : 'Usar mi ubicación'}
                </button>
                <SelectField
                  label="O un barrio como centro"
                  value={centroBarrio}
                  onChange={(e) => e.target.value && aplicarCentro(e.target.value)}
                >
                  <option value="">Elige un barrio</option>
                  {BARRIOS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {barrio(b.id)}
                    </option>
                  ))}
                </SelectField>
              </div>
              {errorUbicacion && <Alert tone="info">{errorUbicacion}</Alert>}
              <Suspense fallback={<div className="mapa mapa--cargando">Cargando mapa…</div>}>
                <MapaUbicacion centro={centro} radioKm={radioVisible} onElegir={elegirEnMapa} />
              </Suspense>
              <p className="field-hint">Toca el mapa para elegir un punto; el círculo muestra el radio de búsqueda.</p>
            </section>
          )}

          <div className="feed-head">
            <h2>
              {centro
                ? `Cerca de ${nombreCentro}`
                : barrioId
                  ? `Productos en ${barrio(barrioId)}`
                  : 'Todos los productos'}
            </h2>
            {products && (
              <span>
                {total} {total === 1 ? 'publicación disponible' : 'publicaciones disponibles'}
                {centro && ` a menos de ${kmTexto(radio)}`}
              </span>
            )}
            {hayFiltros && (
              <button className="link-button" onClick={quitarFiltros}>
                Quitar filtros
              </button>
            )}
          </div>

          {favoritos.error && <Alert tone="error">{favoritos.error}</Alert>}
          {feedError && <Alert tone="info">No pudimos cargar las publicaciones por ahora.</Alert>}
          {products?.length === 0 && (
            <EmptyState kind="search">
              {centro
                ? `No hay productos a menos de ${kmTexto(radio)}. Prueba con un radio mayor.`
                : hayFiltros
                  ? 'No hay productos con estos filtros.'
                  : 'Aún no hay publicaciones en Cali.'}
            </EmptyState>
          )}
          {products === null && !feedError && !esperandoCentro && <Skeleton kind="products" />}
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
