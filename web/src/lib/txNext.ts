import type { Transaction } from './api';
import { etapaAcuerdo } from './format';
import { nombrePunto } from './safePoints';

/** Fecha corta del prototipo: «jue 26, 4:00 p. m.». */
export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).replace('.,', '').replace(/\s+/g, ' ');

/** Qué sigue en una transacción vista por `me`, y si me toca a mí (para «Te toca»). */
export function siguientePaso(tx: Transaction, me: string | undefined): { text: string; mine: boolean } {
  const soyComprador = tx.buyerId === me;
  const otroCompleto = (soyComprador ? tx.seller?.fullName : tx.buyer?.fullName) ?? 'la otra persona';
  const otro = otroCompleto.split(' ')[0];
  const lugar = tx.safePointId && tx.scheduledTime ? `${nombrePunto(tx.safePointId)} · ${fechaCorta(tx.scheduledTime)}` : '';
  if (tx.status === 'CANCELLED') return { text: 'Transacción cancelada', mine: false };
  if (tx.status === 'COMPLETED') return { text: lugar ? `Entregado en ${nombrePunto(tx.safePointId!)}` : 'Intercambio completado', mine: false };
  switch (etapaAcuerdo(tx, me)) {
    case 'sin-propuesta':
      if (tx.rejectedById && tx.rejectedById !== me)
        return { text: `${otro} rechazó la propuesta${soyComprador ? ' · Propón otro punto u horario' : ''}`, mine: soyComprador };
      if (tx.rejectedById === me)
        return { text: soyComprador ? 'Rechazaste la propuesta · Propón otro punto u horario' : `Rechazaste la propuesta · Esperando otra de ${otro}`, mine: soyComprador };
      return soyComprador
        ? { text: 'Propón el punto y la hora de entrega', mine: true }
        : { text: `Esperando que ${otro} proponga la entrega`, mine: false };
    case 'esperando':
      return { text: `Propusiste ${lugar} · Esperando la respuesta de ${otro}`, mine: false };
    case 'por-responder':
      return { text: `${otro} propone ${lugar} · Acepta o rechaza`, mine: true };
    default: {
      const soyVendedor = tx.sellerId === me;
      const mia = soyVendedor ? tx.sellerConfirmedAt : tx.buyerConfirmedAt;
      const accion = soyVendedor ? 'producto vendido' : 'producto recibido';
      return mia
        ? { text: `Acordado: ${lugar} · Esperando que ${otro} confirme`, mine: false }
        : { text: `Acordado: ${lugar} · Marca «${accion}» después del encuentro`, mine: true };
    }
  }
}
