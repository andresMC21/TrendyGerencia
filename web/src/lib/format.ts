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
