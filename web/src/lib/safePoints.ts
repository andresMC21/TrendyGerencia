/**
 * HU-16 · Catálogo de puntos seguros para las entregas presenciales.
 *
 * La API guarda `safePointId` como texto y todavía no expone un recurso de
 * puntos seguros, así que la web ofrece esta lista cerrada. Los identificadores
 * siguen el formato del seed del backend (por ejemplo, `cai-granada`).
 */
export type SafePoint = {
  id: string;
  name: string;
  address: string;
  neighborhoodId: string;
};

export const SAFE_POINTS: SafePoint[] = [
  {
    id: 'cai-granada',
    name: 'CAI Granada',
    address: 'Av. 9N con Calle 15N',
    neighborhoodId: 'granada',
  },
  {
    id: 'cai-san-fernando',
    name: 'CAI San Fernando',
    address: 'Calle 5 con Carrera 34',
    neighborhoodId: 'san-fernando',
  },
  {
    id: 'cai-ciudad-jardin',
    name: 'CAI Ciudad Jardín',
    address: 'Carrera 105 con Calle 16',
    neighborhoodId: 'ciudad-jardin',
  },
  {
    id: 'estacion-mio-universidades',
    name: 'Estación MIO Universidades',
    address: 'Av. Cañasgordas, frente a la Universidad Icesi',
    neighborhoodId: 'pance',
  },
  {
    id: 'cc-chipichape',
    name: 'Centro Comercial Chipichape (entrada principal)',
    address: 'Calle 38N # 6N-35',
    neighborhoodId: 'chipichape',
  },
];

/** Nombre legible de un punto; si no está en el catálogo, se muestra el id. */
export const nombrePunto = (id: string) => SAFE_POINTS.find((p) => p.id === id)?.name ?? id;
