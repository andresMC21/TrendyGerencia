import { useState, type CSSProperties } from 'react';
import { avatarPorNombre, leerAvatar } from '../lib/avatar';

/**
 * Avatar de objeto (prototipo TRD-25): el objeto elegido sobre su color, con borde
 * de un tono más oscuro. Si la persona tiene foto, se muestra la foto.
 */
export function Avatar({
  name,
  photoUrl,
  avatar,
  large,
  className = '',
  style,
}: {
  name: string;
  photoUrl?: string | null;
  avatar?: string | null;
  large?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const elegido = leerAvatar(avatar) ?? avatarPorNombre(name || '?');
  const cls = `${large ? 'ava' : 'av'} o ${className}`.trim();
  const st = { '--avbg': elegido.color, ...style } as CSSProperties;
  const foto = photoUrl && failed !== photoUrl;
  return (
    <span className={cls} style={st} role="img" aria-label={`Avatar de ${name}`} data-testid={foto ? 'avatar-foto' : undefined}>
      {foto ? (
        <img className="ph" src={photoUrl} alt="" referrerPolicy="no-referrer" onError={() => setFailed(photoUrl)} />
      ) : (
        <img className="oi" src={`/img/${elegido.objeto}.webp`} alt="" />
      )}
    </span>
  );
}
