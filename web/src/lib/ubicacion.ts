import type { GeoPoint } from './api';

/** HU-10 · Radio del feed en km: la API acepta de 0,1 a 50. */
export const RADIO_MIN = 0.1;
export const RADIO_MAX = 50;
export const RADIO_POR_DEFECTO = 5;
/** Radios comunes: se marcan bajo el deslizador. */
export const MARCAS_RADIO = [1, 2, 5, 10, 20, 50];

/**
 * Valores que recorre el deslizador, más densos en los radios cortos: con una
 * escala lineal, de 0,1 a 5 km (los más usados) cabría en el 10 % del recorrido.
 * Cada flecha del teclado avanza un valor de la lista.
 */
export const RADIOS = [
  0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10,
  12, 15, 20, 25, 30, 35, 40, 45, 50,
];

/** Índice del valor de la lista más cercano (un radio escrito a mano en la URL puede no estar). */
export const posicionDeRadio = (km: number) =>
  RADIOS.reduce((mejor, r, i) => (Math.abs(r - km) < Math.abs(RADIOS[mejor] - km) ? i : mejor), 0);

/** Radio leído de la URL; uno ausente o fuera de rango vuelve al de por defecto. */
export function radioDeUrl(valor: string | null): number {
  const km = valor ? Number(valor) : NaN;
  return Number.isFinite(km) && km >= RADIO_MIN && km <= RADIO_MAX
    ? Math.round(km * 10) / 10
    : RADIO_POR_DEFECTO;
}

/** Unos 110 m: suficiente para buscar cerca sin exponer la dirección exacta. */
export const redondearCoordenada = (v: number) => Math.round(v * 1000) / 1000;

export function ubicacionDelDispositivo(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    // El navegador solo entrega la ubicación en HTTPS o en localhost.
    if (!window.isSecureContext || !('geolocation' in navigator)) {
      reject(new Error('Este navegador no puede compartir tu ubicación aquí. Elige un punto en el mapa o un barrio.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ lat: redondearCoordenada(coords.latitude), lng: redondearCoordenada(coords.longitude) }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? 'No diste permiso para usar tu ubicación. Elige un punto en el mapa o un barrio.'
              : 'No pudimos obtener tu ubicación. Elige un punto en el mapa o un barrio.',
          ),
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
}

/** true solo si ya hay permiso: así una recarga no vuelve a mostrar la solicitud. */
export async function permisoDeUbicacionConcedido(): Promise<boolean> {
  try {
    const estado = await navigator.permissions?.query({ name: 'geolocation' });
    return estado?.state === 'granted';
  } catch {
    return false;
  }
}
