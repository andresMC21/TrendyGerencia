import { useId, useRef, useState } from 'react';

async function preparePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Elige una imagen JPG, PNG o WebP.');
  if (file.size > 10 * 1024 * 1024) throw new Error('La foto debe pesar máximo 10 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
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

export function PhotoPicker({ value, onChange, onBusyChange, error, disabled }: { value: string; onChange: (value: string) => void; onBusyChange: (busy: boolean) => void; error?: string; disabled: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState('');
  const selection = useRef(0);
  return <div className="photo-picker field">
    <label htmlFor={id}>Fotografía del producto <span className="required-label">Obligatoria</span></label>
    <div className={`photo-dropzone${error || fileError ? ' has-error' : ''}`}>
      {value ? <img src={value} alt="Vista previa de tu producto" /> : <span className="photo-empty-icon" aria-hidden="true">＋</span>}
      <div><strong>{value ? 'Tu producto, en primer plano' : 'Muéstralo tal como es'}</strong><p>JPG, PNG o WebP. Hasta 10 MB. Usa una foto con buena luz.</p>
        <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled || busy} aria-invalid={Boolean(error || fileError)} aria-describedby={`${id}-hint`} onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          const current = ++selection.current;
          setBusy(true); onBusyChange(true); setFileError('');
          try { const photo = await preparePhoto(file); if (current === selection.current) onChange(photo); }
          catch (reason) { if (current === selection.current) setFileError(reason instanceof Error ? reason.message : 'No pudimos procesar la imagen.'); }
          finally { if (current === selection.current) { setBusy(false); onBusyChange(false); } }
        }} />
        {value && <button type="button" className="btn btn-ghost photo-remove" disabled={disabled || busy} onClick={() => { onChange(''); setFileError(''); }}>Quitar foto</button>}
      </div>
    </div>
    <p id={`${id}-hint`} className={error || fileError ? 'field-error' : 'field-hint'} role="status">{fileError || error || (busy ? 'Preparando tu fotografía…' : value ? 'Foto lista para publicar.' : 'Agrega una fotografía para continuar.')}</p>
  </div>;
}
