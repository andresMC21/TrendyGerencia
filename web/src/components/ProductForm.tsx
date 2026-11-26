import type { ReactNode } from 'react';
import type { GeoPoint, ProductCondition } from '../lib/api';
import { BARRIOS, CATEGORIAS } from '../lib/barrios';
import { barrio, CATEGORIA, CONDICION } from '../lib/format';
import type { ProductErrors, ProductField } from '../lib/validation';
import { Field, TextAreaField } from './Form';
import { PhotoPicker } from './PhotoPicker';
import { PriceTag } from './PriceTag';
import { Scatter } from './Scatter';

export type Ubicacion = { punto: GeoPoint; origen: 'barrio' | 'dispositivo' };

export type ProductFormState = {
  photoUrl: string; setPhotoUrl: (v: string) => void; setPreparingPhoto: (v: boolean) => void;
  title: string; setTitle: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  condition: ProductCondition | ''; setCondition: (v: ProductCondition) => void;
  price: string; setPrice: (v: string) => void;
  neighborhoodId: string; elegirBarrio: (v: string) => void;
  ubicacion: Ubicacion | null; usarMiUbicacion: () => void; usarUbicacionDelBarrio: () => void; locating: boolean;
  acceptsBarter: boolean; setAcceptsBarter: (v: boolean) => void;
  errors: ProductErrors; clear: (f: ProductField) => void; sending: boolean;
};

/** Campos del prototipo para publicar o editar un producto. */
export function ProductFields(f: ProductFormState) {
  const precioNum = f.price.trim() ? Number(f.price) : null;
  return (
    <>
      <PhotoPicker value={f.photoUrl} onChange={(p) => { f.setPhotoUrl(p); f.clear('photoUrl'); }} onBusyChange={f.setPreparingPhoto} error={f.errors.photoUrl} disabled={f.sending} />
      <Field label="Título" name="title" maxLength={120} placeholder="Bicicleta MTB rin 26" value={f.title} disabled={f.sending}
        onChange={(e) => { f.setTitle(e.target.value); f.clear('title'); }} error={f.errors.title} count={`${f.title.trim().length}/120`} />
      <TextAreaField label="Descripción" name="description" maxLength={2000} rows={4} placeholder="Cambios Shimano, poco uso, incluye luces." value={f.description} disabled={f.sending}
        onChange={(e) => { f.setDescription(e.target.value); f.clear('description'); }} error={f.errors.description} count={`${f.description.trim().length}/2000`} />
      <div className={`fld${f.errors.category ? ' err' : ''}`}>
        <span>Categoría</span>
        <div className="opts" role="group" aria-label="Categoría">
          {CATEGORIAS.map((c) => <button key={c} type="button" aria-pressed={f.category === c} disabled={f.sending} onClick={() => { f.setCategory(c); f.clear('category'); }}>{CATEGORIA[c] ?? c}</button>)}
        </div>
        {f.errors.category && <span className="hint"><span>{f.errors.category}</span></span>}
      </div>
      <div className={`fld${f.errors.condition ? ' err' : ''}`}>
        <span>Condición</span>
        <div className="opts" role="group" aria-label="Condición">
          {Object.entries(CONDICION).map(([v, l]) => <button key={v} type="button" aria-pressed={f.condition === v} disabled={f.sending} onClick={() => { f.setCondition(v as ProductCondition); f.clear('condition'); }}>{l}</button>)}
        </div>
        {f.errors.condition && <span className="hint"><span>{f.errors.condition}</span></span>}
      </div>
      <div className="row2">
        <Field label="Precio" name="price" inputMode="numeric" placeholder="0" disabled={f.sending}
          value={f.price ? Number(f.price).toLocaleString('es-CO') : ''}
          onChange={(e) => { f.setPrice(e.target.value.replace(/\D/g, '').slice(0, 9)); f.clear('price'); }}
          before={<span className="pre">$</span>} after={<span className="pre">COP</span>}
          error={f.errors.price}
          hint={precioNum === null ? 'Pon 0 si lo regalas o solo buscas trueque' : precioNum === 0 ? 'Gratis o solo trueque' : `$${precioNum.toLocaleString('es-CO')} pesos`} />
        <div className={`fld${f.errors.neighborhoodId ? ' err' : ''}`}>
          <label htmlFor="pf-barrio">Barrio</label>
          <span className="in"><select id="pf-barrio" value={f.neighborhoodId} disabled={f.sending} onChange={(e) => f.elegirBarrio(e.target.value)}>
            <option value="">Elige tu barrio</option>
            {BARRIOS.map((b) => <option key={b.id} value={b.id}>{barrio(b.id)}</option>)}
          </select></span>
          {f.errors.neighborhoodId && <span className="hint"><span>{f.errors.neighborhoodId}</span></span>}
        </div>
      </div>
      <div className="loc" data-testid="publicar-ubicacion">
        <span>{f.ubicacion ? (f.ubicacion.origen === 'dispositivo' ? <>📍 Ubicación de tu dispositivo <b>({f.ubicacion.punto.lat}, {f.ubicacion.punto.lng})</b></> : <>📍 Punto aproximado de <b>{barrio(f.neighborhoodId)}</b></>) : '📍 Elige un barrio para fijar la ubicación'}</span>
        {f.ubicacion?.origen === 'dispositivo' && f.neighborhoodId
          ? <button type="button" className="linkbtn" onClick={f.usarUbicacionDelBarrio}>Usar la del barrio</button>
          : <button type="button" className="linkbtn" onClick={f.usarMiUbicacion} disabled={f.locating}>{f.locating ? 'Buscando…' : 'Usar mi ubicación'}</button>}
      </div>
      {f.errors.location && <p className="err" style={{ marginTop: -8 }}>{f.errors.location}</p>}
      <label className="switch"><span><b>Acepto trueque</b><span>Te pueden ofrecer otros objetos además de dinero.</span></span><input type="checkbox" name="acceptsBarter" checked={f.acceptsBarter} onChange={(e) => f.setAcceptsBarter(e.target.checked)} /></label>
    </>
  );
}

/** Tarjeta tal como la verán los vecinos, con los datos del formulario. */
export function PreviewCard({ f }: { f: Pick<ProductFormState, 'photoUrl' | 'title' | 'category' | 'condition' | 'price' | 'neighborhoodId' | 'acceptsBarter'> }) {
  return (
    <div className="card">
      <PriceTag price={f.price === '' ? null : Number(f.price)} />
      <div className="ph">{f.photoUrl ? <img src={f.photoUrl} alt="" /> : <span className="noph">Tu foto aparecerá aquí</span>}</div>
      <div className="cb">
        <div className="cardtop">{f.acceptsBarter ? <span className="chip o">Acepta trueque</span> : <span className="chip">Solo venta</span>}<span className="cond">{f.condition ? CONDICION[f.condition] : 'Condición'}</span></div>
        <div className={`ttl${f.title ? '' : ' ph0'}`}>{f.title || 'Título de tu publicación'}</div>
        <div className="meta"><span>{f.neighborhoodId ? barrio(f.neighborhoodId) : 'Tu barrio'}</span>{f.category && <><span aria-hidden="true">·</span><span>{CATEGORIA[f.category] ?? f.category}</span></>}</div>
      </div>
    </div>
  );
}

/** Estructura de Publicar/Editar: formulario en ficha + vista previa y consejos, con objetos de fondo. */
export function ProductLayout({ back, children, preview, done }: { back?: ReactNode; children: ReactNode; preview: ReactNode; done?: boolean }) {
  return (
    <>
      <Scatter deps={[done]} />
      {back ?? <span className="back" style={{ marginTop: 10, visibility: 'hidden' }}>·</span>}
      <div className={`pub${done ? ' isdone' : ''}`}>
        <div className="ficha">{children}</div>
        <aside className="prev" aria-label="Vista previa">
          <div className="lbl"><i />Así la verán tus vecinos</div>
          {preview}
          <div className="box"><h3>Para vender más rápido</h3><ul><li>Título claro: qué es, marca y talla o tamaño.</li><li>Cuenta el estado real y los detalles de uso.</li><li>Una foto con buena luz vende más.</li></ul></div>
          <div className="box"><h3>Tu ubicación</h3><p className="mu" style={{ margin: '8px 0 0', fontSize: 14 }}>Guardamos un punto aproximado (el del barrio o tu dispositivo redondeado), nunca tu dirección exacta.</p></div>
        </aside>
      </div>
    </>
  );
}
