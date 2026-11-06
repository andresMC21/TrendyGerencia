import { useRef, useState } from 'react';
import { ApiError, productApi } from '../lib/api';
import { useSession } from '../lib/session';
import { Alert } from './Form';

/**
 * HU-13 · Botón «Retirar publicación» con confirmación.
 * Lo usan el detalle del producto y «Mis publicaciones».
 */
export function RetirarPublicacion({
  productId,
  title,
  onRemoved,
  onConflict,
  compact = false,
}: {
  productId: string;
  title: string;
  onRemoved: () => void;
  /**
   * El producto cambió de estado (por ejemplo, lo reservaron) y hay que
   * recargarlo. Recibe el mensaje para que el padre lo muestre, porque al
   * recargar este botón puede desaparecer.
   */
  onConflict?: (mensaje: string) => void;
  compact?: boolean;
}) {
  const { token } = useSession();
  const [confirmando, setConfirmando] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);

  async function retirar() {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      await productApi.remove(token, productId);
      onRemoved();
    } catch (err) {
      setConfirmando(false);
      if (err instanceof ApiError && err.status === 401) {
        setError('Tu sesión expiró. Vuelve a ingresar para retirar la publicación.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Solo quien publicó el producto puede retirarlo.');
      } else if (err instanceof ApiError && (err.status === 404 || err.status === 409)) {
        const mensaje =
          err.status === 404
            ? 'Esta publicación ya no existe o ya fue retirada.'
            : 'No se puede retirar mientras esté reservada o vendida. Si hay una transacción activa, cancélala primero.';
        if (onConflict) onConflict(mensaje);
        else setError(mensaje);
      } else {
        setError('No pudimos retirar la publicación. Inténtalo de nuevo.');
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  if (confirmando) {
    return (
      <div
        className="tx-confirm tx-confirm--danger"
        role="alertdialog"
        aria-labelledby={`retirar-q-${productId}`}
      >
        <strong id={`retirar-q-${productId}`}>¿Retirar «{title}»?</strong>
        <p>
          Dejará de aparecer en Trendy y nadie podrá iniciar una compra. Se conserva en tu historial
          de publicaciones.
        </p>
        <div className="tx-actions">
          <button
            type="button"
            className="btn btn-danger"
            onClick={retirar}
            disabled={sending}
            data-testid="btn-confirmar-retiro"
          >
            {sending ? 'Retirando…' : 'Sí, retirar'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setConfirmando(false)}
            disabled={sending}
          >
            No, mantenerla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="retirar">
      {error && <Alert tone="error">{error}</Alert>}
      <button
        type="button"
        className={`btn btn-danger-outline${compact ? ' btn-sm' : ''}`}
        onClick={() => setConfirmando(true)}
        data-testid="btn-retirar"
      >
        Retirar publicación
      </button>
    </div>
  );
}
