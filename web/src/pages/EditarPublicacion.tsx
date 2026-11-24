import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert, Field, SelectField, TextAreaField } from '../components/Form';
import { PhotoPicker } from '../components/PhotoPicker';
import {
  ApiError,
  productApi,
  type GeoPoint,
  type Product,
  type ProductCondition,
  type UpdateProductBody,
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

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; producto: Product }
  | { tipo: 'error'; mensaje: string };

/** ~110 m: suficiente para «cerca de ti» sin exponer la dirección exacta. */
const redondear = (v: number) => Math.round(v * 1000) / 1000;
const mismoPunto = (a: GeoPoint, b: GeoPoint) =>
  Math.abs(a.lat - b.lat) < 0.0005 && Math.abs(a.lng - b.lng) < 0.0005;

/**
 * HU-12 · Editar mi publicación (PUT /products/:id).
 * Se busca el producto entre «mis publicaciones»: si no es del usuario no
 * aparece, y el servidor responde 403 igualmente si se fuerza la petición.
 */
export default function EditarPublicacion() {
  const { id } = useParams();
  const { token } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token || !id) return;
    let activo = true;
    productApi
      .mine(token)
      .then((items) => {
        if (!activo) return;
        const producto = items.find((p) => p.id === id);
        if (!producto) {
          setEstado({ tipo: 'error', mensaje: 'No encontramos esa publicación entre las tuyas.' });
        } else if (producto.status !== 'AVAILABLE') {
          setEstado({
            tipo: 'error',
            mensaje:
              producto.status === 'RESERVED'
                ? 'Está reservada en una transacción: solo se puede editar mientras está disponible.'
                : 'Esta publicación ya no está disponible, así que no se puede editar.',
          });
        } else {
          setEstado({ tipo: 'ok', producto });
        }
      })
      .catch((err) => {
        if (!activo) return;
        setEstado({
          tipo: 'error',
          mensaje:
            err instanceof ApiError && err.status === 401
              ? 'Tu sesión expiró. Vuelve a ingresar.'
              : 'No pudimos cargar la publicación. Inténtalo de nuevo.',
        });
      });
    return () => {
      activo = false;
    };
  }, [token, id]);

  return (
    <>
      <Header />
      <main className="auth">
        <div className="container container--narrow">
          <Link viewTransition to="/mis-publicaciones" className="back-link">
            ← Volver a Mis publicaciones
          </Link>
          <section className="form-card">
            <span className="form-kicker">EDITAR PUBLICACIÓN</span>
            <h1>Edita tu publicación</h1>
            {estado.tipo === 'cargando' && <p className="form-sub">Cargando tu publicación…</p>}
            {estado.tipo === 'error' && (
              <div data-testid="editar-error">
                <Alert tone="error">{estado.mensaje}</Alert>
              </div>
            )}
            {estado.tipo === 'ok' && <Formulario producto={estado.producto} />}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Formulario({ producto }: { producto: Product }) {
  const { token } = useSession();
  const navigate = useNavigate();

  const barrioInicial = BARRIOS.find((b) => b.id === producto.neighborhoodId);
  const [title, setTitle] = useState(producto.title);
  const [photoUrl, setPhotoUrl] = useState(producto.photoUrl ?? '');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [description, setDescription] = useState(producto.description);
  const [category, setCategory] = useState(producto.category);
  const [condition, setCondition] = useState<ProductCondition | ''>(
    producto.condition as ProductCondition,
  );
  const [neighborhoodId, setNeighborhoodId] = useState(producto.neighborhoodId);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(() => {
    if (producto.location) {
      const origen =
        barrioInicial && mismoPunto(producto.location, barrioInicial.punto) ? 'barrio' : 'dispositivo';
      return { punto: producto.location, origen };
    }
    return barrioInicial ? { punto: barrioInicial.punto, origen: 'barrio' } : null;
  });
  const [price, setPrice] = useState(Number(producto.price) ? String(Number(producto.price)) : '');
  const [acceptsBarter, setAcceptsBarter] = useState(producto.acceptsBarter);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [locating, setLocating] = useState(false);
  const [sending, setSending] = useState(false);
  const inFlight = useRef(false);

  const clear = (field: ProductField) => {
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
  };

  const elegirBarrio = (nuevo: string) => {
    setNeighborhoodId(nuevo);
    clear('neighborhoodId');
    clear('location');
    // La ubicación del dispositivo, si ya se tomó, es más precisa que la del barrio.
    if (ubicacion?.origen === 'dispositivo') return;
    const b = BARRIOS.find((x) => x.id === nuevo);
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

  /** Solo viaja lo que cambió: así no se reenvía una foto que no se tocó. */
  const cambios = (): UpdateProductBody => {
    const body: UpdateProductBody = {};
    if (photoUrl !== (producto.photoUrl ?? '')) body.photoUrl = photoUrl;
    if (title.trim() !== producto.title) body.title = title.trim();
    if (description.trim() !== producto.description) body.description = description.trim();
    if (category !== producto.category) body.category = category;
    if (condition && condition !== producto.condition) body.condition = condition;
    if (neighborhoodId !== producto.neighborhoodId) body.neighborhoodId = neighborhoodId;
    if ((price.trim() ? Number(price) : 0) !== Number(producto.price)) {
      body.price = price.trim() ? Number(price) : 0;
    }
    if (acceptsBarter !== producto.acceptsBarter) body.acceptsBarter = acceptsBarter;
    if (ubicacion && (!producto.location || !mismoPunto(ubicacion.punto, producto.location))) {
      body.location = ubicacion.punto;
    }
    return body;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || inFlight.current || preparingPhoto) return;

    const local = validateProduct({
      photoUrl,
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

    const body = cambios();
    if (Object.keys(body).length === 0) {
      setFormError('No hay cambios que guardar: modifica algún dato primero.');
      return;
    }

    inFlight.current = true;
    setSending(true);
    try {
      const editado = await productApi.update(token, producto.id, body);
      navigate('/mis-publicaciones', { state: { editado: editado.title } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setSessionExpired(true);
      } else if (err instanceof ApiError && err.status === 400) {
        const mapped = mapServerProductValidation(err.messages);
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError('Revisa los datos e inténtalo de nuevo.');
      } else if (err instanceof ApiError && err.status === 403) {
        setFormError('Solo el vendedor puede editar esta publicación.');
      } else if (err instanceof ApiError && err.status === 404) {
        setFormError('Esta publicación ya no existe o fue retirada.');
      } else if (err instanceof ApiError && err.status === 409) {
        setFormError('Esta publicación ya no está disponible (se reservó o se vendió), así que no se puede editar.');
      } else {
        setFormError(
          err instanceof Error ? err.message : 'No pudimos guardar los cambios. Inténtalo de nuevo.',
        );
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  };

  return (
    <>
      <p className="form-sub">Cambia lo que necesites y guarda. Los cambios se ven de inmediato.</p>

      {formError && (
        <div data-testid="editar-form-error">
          <Alert tone="error">{formError}</Alert>
        </div>
      )}
      {sessionExpired && (
        <Alert tone="error">
          Tu sesión expiró. <Link viewTransition to="/ingresar">Vuelve a ingresar</Link> para guardar.
        </Alert>
      )}

      <form onSubmit={onSubmit} noValidate aria-busy={sending} data-testid="editar-form">
        <PhotoPicker
          value={photoUrl}
          onChange={(photo) => {
            setPhotoUrl(photo);
            clear('photoUrl');
          }}
          onBusyChange={setPreparingPhoto}
          error={errors.photoUrl}
          disabled={sending}
        />
        <Field
          label="Título"
          name="title"
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
            {!CATEGORIAS.includes(category as never) && category && (
              <option value={category}>{CATEGORIA[category] ?? category}</option>
            )}
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
            {!barrioInicial && neighborhoodId && (
              <option value={neighborhoodId}>{barrio(neighborhoodId)}</option>
            )}
            {BARRIOS.map((b) => (
              <option key={b.id} value={b.id}>
                {barrio(b.id)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="location-box" data-testid="editar-ubicacion">
          <span>
            {ubicacion
              ? ubicacion.origen === 'dispositivo'
                ? `📍 Ubicación guardada (${ubicacion.punto.lat}, ${ubicacion.punto.lng})`
                : `📍 Punto aproximado de ${barrio(neighborhoodId)}`
              : '📍 Elige un barrio para fijar la ubicación'}
          </span>
          {ubicacion?.origen === 'dispositivo' && BARRIOS.some((b) => b.id === neighborhoodId) ? (
            <button type="button" className="link-button" onClick={usarUbicacionDelBarrio}>
              Usar la del barrio
            </button>
          ) : (
            <button type="button" className="link-button" onClick={usarMiUbicacion} disabled={locating}>
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

        <div className="publish-actions">
          <button type="submit" className="btn btn-primary" disabled={sending || preparingPhoto}>
            {preparingPhoto ? 'Preparando fotografía…' : sending ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <Link viewTransition to="/mis-publicaciones" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
