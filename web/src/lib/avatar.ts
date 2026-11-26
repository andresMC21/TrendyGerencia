/** Avatares de Trendy: un objeto dibujado sobre un color de la paleta ("planta:#FCBF49"). */
export const AVATAR_OBJETOS: Record<string, string> = {
  planta: 'Planta', camara: 'Cámara', bici: 'Bici', guitarra: 'Guitarra', libros: 'Libros',
  audifonos: 'Audífonos', lampara: 'Lámpara', silla: 'Silla', chaqueta: 'Chaqueta', zapatos: 'Zapatos',
};
export const AVATAR_COLORES: Record<string, string> = {
  '#FCBF49': 'amarillo', '#F77F00': 'naranja', '#BFD7E6': 'azul claro', '#CFE3C8': 'verde', '#F3D9C9': 'durazno',
};
export type AvatarElegido = { objeto: string; color: string };

export function leerAvatar(valor?: string | null): AvatarElegido | null {
  if (!valor) return null;
  const [objeto, color] = valor.split(':');
  return objeto in AVATAR_OBJETOS && color in AVATAR_COLORES ? { objeto, color } : null;
}
export const escribirAvatar = (a: AvatarElegido) => `${a.objeto}:${a.color}`;

/** Sin elección guardada, cada persona recibe siempre el mismo objeto según su nombre. */
export function avatarPorNombre(nombre: string): AvatarElegido {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const objetos = Object.keys(AVATAR_OBJETOS);
  const colores = Object.keys(AVATAR_COLORES);
  return { objeto: objetos[h % objetos.length], color: colores[(h >> 3) % colores.length] };
}
