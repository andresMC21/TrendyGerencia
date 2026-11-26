import { notify } from '../lib/toast';
import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ProductCard } from '../components/ProductCard';
import { PreviewCard, ProductFields, ProductLayout, type ProductFormState, type Ubicacion } from '../components/ProductForm';
import {
  ApiError,
  productApi,
  type Product,
  type ProductCondition,
} from '../lib/api';
import { BARRIOS } from '../lib/barrios';
import { barrio } from '../lib/format';
import { useSession } from '../lib/session';
import {
  mapServerProductValidation,
  validateProduct,
  type ProductErrors,
  type ProductField,
} from '../lib/validation';


/** ~110 m: suficiente para «cerca de ti» sin exponer la dirección exacta. */
const redondear = (v: number) => Math.round(v * 1000) / 1000;

/** HU-08 · Publicar un producto (POST /products). */
export default function Publicar() {
  const { token } = useSession();
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [preparingPhoto, setPreparingPhoto] = useState(false);
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

    inFlight.current = true;
    setSending(true);
    try {
      const creado = await productApi.create(token, {
        photoUrl,
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
      notify('Publicación creada.');
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
    setPhotoUrl('');
    setDescription('');
    setCategory('');
    setCondition('');
    setPrice('');
    setAcceptsBarter(false);
    setErrors({});
    setPublicado(null);
    // Barrio y ubicación se conservan: lo normal es publicar varias cosas desde el mismo lugar.
  };

  const f: ProductFormState = {
    photoUrl, setPhotoUrl, setPreparingPhoto, title, setTitle, description, setDescription, category, setCategory,
    condition, setCondition, price, setPrice, neighborhoodId, elegirBarrio, ubicacion, usarMiUbicacion, usarUbicacionDelBarrio,
    locating, acceptsBarter, setAcceptsBarter, errors, clear, sending,
  };
  const hayErrores = Object.values(errors).some(Boolean);
  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap" data-view="publicar">
        <div id="v-publicar" style={{ position: 'relative' }}>
          <ProductLayout done={!!publicado} preview={<PreviewCard f={f} />}>
            {publicado ? (
              <div className="done">
                <div className="alert s" role="status" style={{ textAlign: 'left' }}><span aria-hidden="true">✓</span><span><b>¡Tu producto quedó publicado!</b> Ya está disponible para tus vecinos de {barrio(publicado.neighborhoodId)}.</span></div>
                <div style={{ maxWidth: 300, margin: '18px auto' }} data-testid="publicado"><ProductCard product={publicado} /></div>
                <div className="actsrow"><Link className="btn" viewTransition to={`/producto/${publicado.id}`}>Ver publicación</Link><button className="btn2" type="button" onClick={reiniciar}>Publicar otro</button></div>
              </div>
            ) : (
              <>
                <div className="kick">Nueva publicación</div>
                <h1>Publica un producto</h1>
                <p className="sub">Completa los datos básicos. Quedará disponible de inmediato.</p>
                {(formError || hayErrores) && <Alert tone="error">{formError ?? 'Revisa los campos marcados en rojo.'}</Alert>}
                {sessionExpired && <Alert tone="error">Tu sesión expiró. <Link viewTransition to="/ingresar">Vuelve a ingresar</Link> para publicar.</Alert>}
                <form onSubmit={onSubmit} noValidate aria-busy={sending}>
                  <ProductFields {...f} />
                  <div className="actsrow"><button className="btn" type="submit" disabled={sending || preparingPhoto}>{preparingPhoto ? 'Preparando fotografía…' : sending ? 'Publicando…' : 'Publicar producto'}</button></div>
                </form>
              </>
            )}
          </ProductLayout>
        </div>
      </main>
    </>
  );
}
