import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { GeoPoint } from '../lib/api';
import { BARRIOS } from '../lib/barrios';
import { barrio } from '../lib/format';
import { redondearCoordenada } from '../lib/ubicacion';

const CALI: L.LatLngTuple = [3.42, -76.53];

type Props = {
  centro: GeoPoint | null;
  radioKm: number;
  /** `barrioId` llega solo si se tocó el punto de un barrio. */
  onElegir: (punto: GeoPoint, barrioId?: string) => void;
};

/**
 * HU-10 · Mapa de OpenStreetMap para elegir el centro de la búsqueda: un punto
 * cualquiera o el de un barrio. Dibuja el radio a escala real.
 */
export default function MapaUbicacion({ centro, radioKm, onElegir }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaCentro = useRef<L.LayerGroup | null>(null);
  const elegir = useRef(onElegir);

  useEffect(() => {
    elegir.current = onElegir;
  }, [onElegir]);

  useEffect(() => {
    if (!contenedor.current) return;
    const m = L.map(contenedor.current, { center: CALI, zoom: 12, scrollWheelZoom: false });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);

    for (const b of BARRIOS) {
      L.circleMarker([b.punto.lat, b.punto.lng], {
        radius: 7,
        className: 'mapa-barrio',
        bubblingMouseEvents: false,
      })
        .bindTooltip(barrio(b.id))
        .on('click', () => elegir.current(b.punto, b.id))
        .addTo(m);
    }
    m.on('click', (e: L.LeafletMouseEvent) =>
      elegir.current({ lat: redondearCoordenada(e.latlng.lat), lng: redondearCoordenada(e.latlng.lng) }),
    );

    capaCentro.current = L.layerGroup().addTo(m);
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      capaCentro.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    const capa = capaCentro.current;
    if (!m || !capa) return;
    capa.clearLayers();
    if (!centro) return;
    const circulo = L.circle([centro.lat, centro.lng], {
      radius: radioKm * 1000,
      className: 'mapa-radio',
      interactive: false,
    }).addTo(capa);
    L.circleMarker([centro.lat, centro.lng], { radius: 8, className: 'mapa-centro', interactive: false }).addTo(capa);
    m.fitBounds(circulo.getBounds(), { maxZoom: 15, padding: [16, 16] });
  }, [centro, radioKm]);

  return <div ref={contenedor} className="mapa" data-testid="mapa-ubicacion" />;
}
