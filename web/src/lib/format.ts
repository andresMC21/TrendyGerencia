import type { UserProfile } from './api';

export const VERIFICACION: Record<UserProfile['verificationStatus'], { label: string; tone: string }> = {
  VERIFIED: { label: 'Identidad verificada', tone: 'green' },
  PENDING: { label: 'Verificación en revisión', tone: 'blue' },
  UNVERIFIED: { label: 'Sin verificar', tone: 'orange' },
  REJECTED: { label: 'Verificación rechazada', tone: 'gray' },
};

export const ROL: Record<string, string> = {
  USER: 'Usuario',
  ADMIN: 'Administrador',
  MODERATOR: 'Moderador',
};

export const CONDICION: Record<string, string> = {
  NUEVO: 'Nuevo',
  COMO_NUEVO: 'Como nuevo',
  USADO: 'Usado',
};

export const CATEGORIA: Record<string, string> = {
  hogar: 'Hogar',
  tecnologia: 'Tecnología',
  ropa: 'Ropa y accesorios',
  libros: 'Libros',
  deportes: 'Deportes',
  muebles: 'Muebles',
  juguetes: 'Juguetes',
  otros: 'Otros',
};

export const ESTADO_PRODUCTO: Record<string, { label: string; tone: string }> = {
  AVAILABLE: { label: 'Disponible', tone: 'green' },
  RESERVED: { label: 'Reservado', tone: 'orange' },
  SOLD: { label: 'Vendido', tone: 'gray' },
  REMOVED: { label: 'Retirado', tone: 'gray' },
};

export const precio = (v: number) =>
  v === 0 ? 'Gratis' : `$${Math.round(v).toLocaleString('es-CO')}`;

export const barrio = (id: string) =>
  id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

export const iniciales = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

export const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CO', { dateStyle: 'long' });

export const ESTADO_TRANSACCION: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Pendiente', tone: 'orange' },
  AGREED_POINT: { label: 'Punto acordado', tone: 'blue' },
  COMPLETED: { label: 'Completada', tone: 'green' },
  CANCELLED: { label: 'Cancelada', tone: 'gray' },
};

export const fechaHora = (iso: string) => {
  const t = new Date(iso).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * HU-16 · En qué punto va el acuerdo del encuentro, visto por `userId`.
 * - sin-propuesta: nadie ha propuesto todavía.
 * - esperando: propuse yo y falta que la otra persona responda.
 * - por-responder: la otra persona propuso y me toca aceptar, contraproponer o rechazar.
 * - acordado: los dos aceptaron el punto y el horario.
 */
export type EtapaAcuerdo = 'sin-propuesta' | 'esperando' | 'por-responder' | 'acordado';

export function etapaAcuerdo(
  tx: { status: string; safePointId?: string | null; scheduledTime?: string | null; proposedById?: string | null },
  userId: string | undefined,
): EtapaAcuerdo {
  if (tx.status !== 'PENDING') return 'acordado';
  if (!tx.safePointId || !tx.scheduledTime || !tx.proposedById) return 'sin-propuesta';
  return tx.proposedById === userId ? 'esperando' : 'por-responder';
}
