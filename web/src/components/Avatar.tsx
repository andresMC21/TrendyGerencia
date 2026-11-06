import { useState } from 'react';
import { iniciales } from '../lib/format';

/** HU-03 · Foto de perfil; si no hay o no carga, muestra las iniciales. */
export function Avatar({
  name,
  photoUrl,
  size,
}: {
  name: string;
  photoUrl?: string | null;
  size?: 'lg';
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const className = `avatar${size ? ` avatar--${size}` : ''}`;

  if (photoUrl && failed !== photoUrl) {
    return (
      <img
        className={`${className} avatar--photo`}
        src={photoUrl}
        alt={`Foto de perfil de ${name}`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(photoUrl)}
        data-testid="avatar-foto"
      />
    );
  }
  return (
    <span className={className} aria-hidden="true">
      {iniciales(name)}
    </span>
  );
}
