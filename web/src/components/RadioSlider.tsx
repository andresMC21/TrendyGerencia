import { useId, type CSSProperties } from 'react';
import { MARCAS_RADIO, posicionDeRadio, RADIOS } from '../lib/ubicacion';

const km = (v: number) => `${v.toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`;
const ULTIMO = RADIOS.length - 1;
/** Marcas que se ocultan en pantallas angostas para que las etiquetas no se monten. */
const SECUNDARIAS = [2, 20];

/** HU-10 · Deslizador de radio con marcas en los valores comunes. */
export function RadioSlider({ value, onChange }: { value: number; onChange: (km: number) => void }) {
  const id = useId();
  return (
    <div className="radio-slider">
      <label htmlFor={id}>
        Radio de búsqueda: <strong>{km(value)}</strong>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={ULTIMO}
        step={1}
        value={posicionDeRadio(value)}
        list={`${id}-marcas`}
        aria-valuetext={km(value)}
        onChange={(e) => onChange(RADIOS[Number(e.target.value)])}
      />
      <datalist id={`${id}-marcas`}>
        {MARCAS_RADIO.map((m) => (
          <option key={m} value={posicionDeRadio(m)} />
        ))}
      </datalist>
      <div className="radio-marcas" aria-hidden="true">
        {MARCAS_RADIO.map((m) => (
          <button
            key={m}
            type="button"
            tabIndex={-1}
            style={{ '--p': posicionDeRadio(m) / ULTIMO } as CSSProperties}
            className={[
              'radio-marca',
              m === value && 'radio-marca--on',
              SECUNDARIAS.includes(m) && 'radio-marca--secundaria',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onChange(m)}
          >
            {m} km
          </button>
        ))}
      </div>
    </div>
  );
}
