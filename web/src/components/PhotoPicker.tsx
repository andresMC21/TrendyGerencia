import { useId, useRef, useState } from 'react';

export async function preparePhoto(file: File, max = 1200): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elige una imagen JPG, PNG o WebP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('La foto debe pesar máximo 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No pudimos preparar la foto. Inténtalo con otra imagen.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.65, 0.45]) {
      const photo = canvas.toDataURL('image/jpeg', quality);
      if (photo.length <= 850000) return photo;
    }
    throw new Error('La imagen tiene demasiado detalle. Prueba con una foto más pequeña.');
  } catch (error) {
    throw error instanceof Error && error.name !== 'EncodingError' ? error : new Error('No pudimos leer esa imagen. Prueba con otra foto.');
  } finally { URL.revokeObjectURL(url); }
}

/** Zona para subir la foto del producto (prototipo): toca o arrastra; muestra la miniatura. */
export function PhotoPicker({ value, onChange, onBusyChange, error, disabled }: { value: string; onChange: (value: string) => void; onBusyChange: (busy: boolean) => void; error?: string; disabled: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const selection = useRef(0);
  const leer = async (file?: File) => {
    if (!file) return;
    const current = ++selection.current;
    setBusy(true); onBusyChange(true); setFileError('');
    try { const photo = await preparePhoto(file); if (current === selection.current) onChange(photo); }
    catch (reason) { if (current === selection.current) setFileError(reason instanceof Error ? reason.message : 'No pudimos procesar la imagen.'); }
    finally { if (current === selection.current) { setBusy(false); onBusyChange(false); } }
  };
  const msg = fileError || error;
  return (
    <div className={`fld${msg ? ' err' : ''}`} style={{ marginBottom: 18 }}>
      <label htmlFor={id} className={`drop${over ? ' over' : ''}`} style={{ marginBottom: 0 }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) void leer(e.dataTransfer.files?.[0]); }}>
        <span className="th">{value ? <img src={value} alt="Vista previa de tu producto" /> : <img src="/img/camara.webp" alt="" style={{ width: 56, height: 'auto', objectFit: 'contain', opacity: 0.6 }} />}</span>
        <span>
          <b>{busy ? 'Preparando tu foto…' : value ? 'Cambiar foto' : 'Sube una foto'}</b>
          <span>{value ? 'Toca para elegir otra.' : 'Arrástrala aquí o toca para elegirla. JPG, PNG o WebP, una sola foto.'}</span>
        </span>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} aria-invalid={Boolean(msg)}
          onChange={(event) => { const f = event.target.files?.[0]; event.target.value = ''; void leer(f); }} />
      </label>
      {msg && <span className="hint"><span>{msg}</span></span>}
    </div>
  );
}
