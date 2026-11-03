import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Dot, Footer, Header } from '../components/Brand';
import { Alert, Field, SelectField, TextAreaField } from '../components/Form';
import {
  ApiError,
  productApi,
  type GeoPoint,
  type Product,
  type ProductCondition,
} from '../lib/api';
import { BARRIOS, CATEGORIAS } from '../lib/barrios';
import { barrio, CATEGORIA, CONDICION, precio } from '../lib/format';
import { useSession } from '../lib/session';
import {
  mapServerProductValidation,
  validateProduct,
  type ProductErrors,
  type ProductField,
} from '../lib/validation';

type Ubicacion = { punto: GeoPoint; origen: 'barrio' | 'dispositivo' };

/** ~110 m: suficiente para «cerca de ti» sin exponer la dirección exacta. */
const redondear = (v: number) => Math.round(v * 1000) / 1000;

/** HU-08 · Publicar un producto (POST /products). */
export default function Publicar() {
  const { token } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<ProductCondition | ''>('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [price, setPrice] = useState('');
  const [acceptsBarter, setAcceptsBarter] = useState(false);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const [publicado, setPublicado] = useState<Product | null>(null);
  const inFlight = useRef(false);

  const clear = (field: ProductField) => {
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
  };

  const elegirBarrio = (id: string) => {
    setNeighborhoodId(id);
    clear('neighborhoodId');
    clear('location');
    // La ubicación del dispositivo, si ya se tomó, es más precisa que la del barrio.
    if (ubicacion?.origen === 'dispositivo') return;
    const b = BARRIOS.find((x) => x.id === id);
    setUbicacion(b ? { punto: b.punto, origen: 'barrio' } : null);
  };

  const usarMiUbicacion = () => {
    if (!('geolocation' in navigator)) {
      setErrors((e) => ({ ...e, location: 'Tu navegador no permite compartir la ubicación.' }));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUbicacion({
          punto: { lat: redondear(coords.latitude), lng: redondear(coords.longitude) },
          origen: 'dispositivo',
        });
        clear('location');
        setLocating(false);
      },
      () => {
        setErrors((e) => ({
          ...e,
          location: 'No pudimos obtener tu ubicación. Usaremos la del barrio elegido.',
        }));
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const usarUbicacionDelBarrio = () => {
    const b = BARRIOS.find((x) => x.id === neighborhoodId);
    setUbicacion(b ? { punto: b.punto, origen: 'barrio' } : null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || inFlight.current) return;

    const local = validateProduct({
      title,
      description,
      category,
      condition,
      neighborhoodId,
      location: ubicacion?.punto ?? null,
      price,
    });
    setErrors(local);
    setFormError(null);
    setSessionExpired(false);
    if (Object.keys(local).length || !condition || !ubicacion) return;

    inFlight.current = true;
    setSending(true);
    try {
      const creado = await productApi.create(token, {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        neighborhoodId,
        location: ubicacion.punto,
        price: price.trim() ? Number(price) : 0,
        acceptsBarter,
      });
      setPublicado(creado);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSessionExpired(true);
      } else if (err instanceof ApiError && err.status === 400) {
        const mapped = mapServerProductValidation(err.messages);
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError('Revisa los datos e inténtalo de nuevo.');
      } else {
        setFormError(
          err instanceof Error ? err.message : 'No pudimos publicar el producto. Inténtalo de nuevo.',
        );
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  const reiniciar = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setCondition('');
    setPrice('');
    setAcceptsBarter(false);
    setErrors({});
    setPublicado(null);
    // Barrio y ubicación se conservan: lo normal es publicar varias cosas desde el mismo lugar.
  };

  return (
    <>
      <Header />
      <main className="auth">
        <div className="container auth-grid">
          <aside className="learning-card">
            <h2>Publica en menos de un minuto</h2>
            <div className="lc-box lc-box--wide">
              <span className="lc-label">GRATIS</span>
              <p>Publicar en Trendy no tiene costo. Tus vecinos verán el objeto en su barrio.</p>
            </div>
            <span className="lc-step">PARA VENDER MÁS RÁPIDO</span>
            <ul className="lc-list">
              <li>
                <Dot /> Usa un título claro: qué es, marca y talla o tamaño.
              </li>
              <li>
                <Dot /> Cuenta en la descripción el estado real y los detalles de uso.
              </li>
              <li>
                <Dot /> Precio en 0 si lo regalas o si solo buscas un trueque.
              </li>
            </ul>
            <span className="lc-step">TU UBICACIÓN</span>
            <div className="lc-box">
              <p>
                Guardamos un punto aproximado (el del barrio o el de tu dispositivo redondeado), nunca
                tu dirección exacta. Sirve para mostrar tu objeto a quienes están cerca.
              </p>
            </div>
          </aside>

          <section className="form-card">
            <span className="form-kicker">NUEVA PUBLICACIÓN</span>
            <h1>Publica un producto</h1>

            {publicado ? (
              <Publicado p={publicado} onOtro={reiniciar} />
            ) : (
              <>
                <p className="form-sub">
                  Completa los datos básicos. Quedará disponible de inmediato.
                </p>

                {formError && <Alert tone="error">{formError}</Alert>}
                {sessionExpired && (
                  <Alert tone="error">
                    Tu sesión expiró. <Link to="/ingresar">Vuelve a ingresar</Link> para publicar.
                  </Alert>
                )}

                <form onSubmit={onSubmit} noValidate aria-busy={sending}>
                  <Field
                    label="Título"
                    name="title"
                    placeholder="Bicicleta MTB rin 26"
                    maxLength={120}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clear('title');
                    }}
                    error={errors.title}
                    hint={`${title.trim().length}/120 caracteres · mínimo 3`}
                  />
                  <TextAreaField
                    label="Descripción"
                    name="description"
                    placeholder="Cambios Shimano, poco uso, incluye luces."
                    maxLength={2000}
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clear('description');
                    }}
                    error={errors.description}
                    hint={`${description.trim().length}/2000 caracteres`}
                  />
                  <div className="form-row">
                    <SelectField
                      label="Categoría"
                      name="category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        clear('category');
                      }}
                      error={errors.category}
                    >
                      <option value="">Elige una categoría</option>
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORIA[c] ?? c}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Condición"
                      name="condition"
                      value={condition}
                      onChange={(e) => {
                        setCondition(e.target.value as ProductCondition | '');
                        clear('condition');
                      }}
                      error={errors.condition}
                    >
                      <option value="">Elige la condición</option>
                      {Object.entries(CONDICION).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="form-row">
                    <Field
                      label="Precio (COP)"
                      name="price"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      placeholder="0 = gratis o trueque"
                      value={price}
                      onChange={(e) => {
                        setPrice(e.target.value);
                        clear('price');
                      }}
                      error={errors.price}
                      hint={price.trim() ? precio(Number(price) || 0) : 'Opcional'}
                    />
                    <SelectField
                      label="Barrio"
                      name="neighborhoodId"
                      value={neighborhoodId}
                      onChange={(e) => elegirBarrio(e.target.value)}
                      error={errors.neighborhoodId}
                    >
                      <option value="">Elige tu barrio</option>
                      {BARRIOS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {barrio(b.id)}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="location-box" data-testid="publicar-ubicacion">
                    <span>
                      {ubicacion
                        ? ubicacion.origen === 'dispositivo'
                          ? `📍 Ubicación de tu dispositivo (${ubicacion.punto.lat}, ${ubicacion.punto.lng})`
                          : `📍 Punto aproximado de ${barrio(neighborhoodId)}`
                        : '📍 Elige un barrio para fijar la ubicación'}
                    </span>
                    {ubicacion?.origen === 'dispositivo' && neighborhoodId ? (
                      <button type="button" className="link-button" onClick={usarUbicacionDelBarrio}>
                        Usar la del barrio
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="link-button"
                        onClick={usarMiUbicacion}
                        disabled={locating}
                      >
                        {locating ? 'Buscando…' : 'Usar mi ubicación'}
                      </button>
                    )}
                  </div>
                  <p className={`location-msg ${errors.location ? 'field-error' : 'field-hint'}`}>
                    {errors.location ?? ' '}
                  </p>

                  <label className="check">
                    <input
                      type="checkbox"
                      name="acceptsBarter"
                      checked={acceptsBarter}
                      onChange={(e) => setAcceptsBarter(e.target.checked)}
                    />
                    Acepto trueque
                  </label>

                  <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                    {sending ? 'Publicando…' : 'Publicar producto'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Publicado({ p, onOtro }: { p: Product; onOtro: () => void }) {
  return (
    <>
      <Alert tone="success">
        <strong>¡Tu producto quedó publicado!</strong> Ya está disponible para tus vecinos de{' '}
        {barrio(p.neighborhoodId)}.
      </Alert>
      <article className="product" data-testid="publicado">
        <div className="product-top">
          <span className="product-cat">{CATEGORIA[p.category] ?? p.category}</span>
          <span className="chip chip--green">Disponible</span>
        </div>
        <h3>{p.title}</h3>
        <p className="product-desc">{p.description}</p>
        <div className="product-foot">
          <span className="product-price">{precio(Number(p.price))}</span>
          <span className="product-meta">
            {barrio(p.neighborhoodId)} · {CONDICION[p.condition] ?? p.condition}
          </span>
        </div>
      </article>
      <div className="publish-actions">
        <Link to={`/producto/${p.id}`} className="btn btn-primary">
          Ver publicación
        </Link>
        <button type="button" className="btn btn-outline" onClick={onOtro}>
          Publicar otro
        </button>
      </div>
    </>
  );
}
