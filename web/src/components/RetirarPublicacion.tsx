import { useRef, useState } from 'react';
import { ApiError, productApi } from '../lib/api';
import { useSession } from '../lib/session';

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
      <span className="confirm" role="alertdialog" aria-label={`¿Retirar «${title}»?`}>
        {compact ? '¿Retirarla?' : 'Dejará de verse en Trendy y queda en tu historial. ¿Retirarla?'}
        <button type="button" className="sbtn rf" onClick={retirar} disabled={sending} data-testid="btn-confirmar-retiro">{sending ? 'Retirando…' : 'Sí, retirar'}</button>
        <button type="button" className="sbtn" onClick={() => setConfirmando(false)} disabled={sending}>No</button>
      </span>
    );
  }
  return (
    <>
      {error && <span className="note">{error}</span>}
      <button type="button" className="sbtn r" onClick={() => setConfirmando(true)} data-testid="btn-retirar">Retirar</button>
    </>
  );
}
