import type { GeoPoint } from './api';

/**
 * HU-08 · Barrios de Cali con un punto de referencia aproximado.
 * Mientras no exista el módulo de barrios en la API, el formulario de
 * publicación usa este catálogo para enviar `neighborhoodId` (slug) y una
 * ubicación válida sin pedir coordenadas a la persona. Los slugs coinciden con
 * los del seed (granada, san-fernando).
 */
export const BARRIOS: { id: string; punto: GeoPoint }[] = [
  { id: 'alameda', punto: { lat: 3.4417, lng: -76.5357 } },
  { id: 'centro', punto: { lat: 3.4516, lng: -76.532 } },
  { id: 'ciudad-jardin', punto: { lat: 3.3612, lng: -76.5303 } },
  { id: 'el-ingenio', punto: { lat: 3.3826, lng: -76.5296 } },
  { id: 'el-limonar', punto: { lat: 3.3948, lng: -76.5378 } },
  { id: 'el-penon', punto: { lat: 3.4497, lng: -76.5423 } },
  { id: 'granada', punto: { lat: 3.4567, lng: -76.5312 } },
  { id: 'la-flora', punto: { lat: 3.4873, lng: -76.5234 } },
  { id: 'pance', punto: { lat: 3.3311, lng: -76.5349 } },
  { id: 'san-antonio', punto: { lat: 3.4472, lng: -76.5393 } },
  { id: 'san-fernando', punto: { lat: 3.4335, lng: -76.5441 } },
  { id: 'tequendama', punto: { lat: 3.4243, lng: -76.5437 } },
  { id: 'valle-del-lili', punto: { lat: 3.3747, lng: -76.5172 } },
  { id: 'versalles', punto: { lat: 3.4613, lng: -76.5298 } },
];

/** Categorías sugeridas; la API las guarda en minúsculas. */
export const CATEGORIAS = [
  'hogar',
  'tecnologia',
  'ropa',
  'libros',
  'deportes',
  'muebles',
  'juguetes',
  'otros',
];
