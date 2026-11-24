import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, reviewApi, type Review, type Transaction } from '../lib/api';
import { fecha } from '../lib/format';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';
import { Alert } from './Form';

const MAX_COMENTARIO = 1000;
const ETIQUETAS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

/** Estrellas fijas para mostrar una calificación ya guardada. */
function Estrellas({ valor }: { valor: number }) {
  return (
    <span className="review-stars" role="img" aria-label={`${valor} de 5 estrellas`}>
      {'★'.repeat(valor)}
      <span className="review-stars__off">{'★'.repeat(5 - valor)}</span>
    </span>
  );
}

/**
 * HU-18 · Calificar a la otra persona tras un intercambio completado.
 *
 * Cada participante deja una calificación de 1 a 5 con comentario opcional,
 * puede editarla o borrarla, y ve si la otra persona ya lo calificó. La API
 * recalcula el promedio y el conteo de quien recibe la reseña.
 */
export function CalificarIntercambio({ tx }: { tx: Transaction }) {
  const { token, user } = useSession();
  const soyComprador = tx.buyerId === user?.id;
  const otro = (soyComprador ? tx.seller?.fullName : tx.buyer?.fullName) ?? 'la otra persona';
  const otroId = soyComprador ? tx.sellerId : tx.buyerId;
  const [resenas, setResenas] = useState<Review[] | null>(null);
  const [errorCarga, setErrorCarga] = useState(false);
  const [editando, setEditando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => {
    if (!token) return;
    reviewApi
      .forTransaction(token, tx.id)
      .then((r) => {
        setResenas(r);
        setErrorCarga(false);
      })
      .catch(() => setErrorCarga(true));
  };
  useEffect(cargar, [token, tx.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mia = resenas?.find((r) => r.reviewer.id === user?.id) ?? null;
  const suya = resenas?.find((r) => r.reviewer.id === otroId) ?? null;

  async function guardar(rating: number, comentario: string) {
    if (!token) return;
    setSending(true);
    setError('');
    try {
      const comment = comentario.trim() || null;
      if (mia) {
        await reviewApi.update(token, mia.id, rating, comment);
        notify('Actualizaste tu calificación.');
      } else {
        await reviewApi.create(token, tx.id, rating, comment);
        notify(`¡Gracias! Calificaste a ${otro}.`);
      }
      setEditando(false);
      cargar();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Ya habías calificado esta transacción. Te mostramos tu calificación.');
        setEditando(false);
        cargar();
      } else {
        setError(err instanceof ApiError ? err.message : 'No pudimos guardar tu calificación. Inténtalo de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  async function borrar() {
    if (!token || !mia) return;
    setSending(true);
    setError('');
    try {
      await reviewApi.remove(token, mia.id);
      notify('Borraste tu calificación.');
      setBorrando(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos borrar tu calificación.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rate-exchange" aria-labelledby="rate-title" data-testid="calificar">
      <h2 id="rate-title" className="detail-h">
        Califica a {otro}
      </h2>
      {errorCarga && <Alert tone="error">No pudimos cargar las calificaciones de esta transacción.</Alert>}
      {error && <Alert tone="info">{error}</Alert>}
      {resenas === null && !errorCarga && <div className="feed-loading">Cargando calificaciones…</div>}

      {resenas !== null && (!mia || editando) && (
        <FormularioCalificacion
          key={mia?.id ?? 'nueva'}
          otro={otro}
          inicial={mia}
          sending={sending}
          onGuardar={guardar}
          onCancelar={mia ? () => setEditando(false) : undefined}
        />
      )}

      {mia && !editando && (
        <div className="review-card review-card--mine" data-testid="mi-calificacion">
          <div className="review-card__head">
            <strong>Tu calificación</strong>
            <Estrellas valor={mia.rating} />
          </div>
          <p>{mia.comment ?? <span className="field-hint">Sin comentario.</span>}</p>
          {borrando ? (
            <div className="tx-confirm tx-confirm--danger" role="alertdialog" aria-label="Confirmar borrado">
              <strong>¿Borrar tu calificación?</strong>
              <p>El promedio de {otro} se recalculará. Después podrás calificar de nuevo.</p>
              <div className="tx-actions">
                <button type="button" className="btn btn-danger" onClick={borrar} disabled={sending} data-testid="btn-confirmar-borrar">
                  {sending ? 'Borrando…' : 'Sí, borrar'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setBorrando(false)} disabled={sending}>
                  No, volver
                </button>
              </div>
            </div>
          ) : (
            <div className="tx-actions">
              <button type="button" className="btn btn-outline" onClick={() => setEditando(true)} data-testid="btn-editar-calificacion">
                Editar
              </button>
              <button type="button" className="btn btn-danger-outline" onClick={() => setBorrando(true)} data-testid="btn-borrar-calificacion">
                Borrar
              </button>
            </div>
          )}
        </div>
      )}

      {resenas !== null && (
        <div className="review-card" data-testid="calificacion-recibida">
          {suya ? (
            <>
              <div className="review-card__head">
                <strong>{otro} te calificó</strong>
                <Estrellas valor={suya.rating} />
              </div>
              {suya.comment && <p>{suya.comment}</p>}
              <small className="field-hint">{fecha(suya.createdAt)}</small>
            </>
          ) : (
            <span className="field-hint">{otro} todavía no te ha calificado.</span>
          )}
        </div>
      )}
    </section>
  );
}

function FormularioCalificacion({
  otro,
  inicial,
  sending,
  onGuardar,
  onCancelar,
}: {
  otro: string;
  inicial: Review | null;
  sending: boolean;
  onGuardar: (rating: number, comentario: string) => void;
  onCancelar?: () => void;
}) {
  const [rating, setRating] = useState(inicial?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState(inicial?.comment ?? '');
  const [aviso, setAviso] = useState('');
  const enviado = useRef(false);
  const visible = hover || rating;

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (sending || enviado.current) return;
    if (rating < 1) return setAviso('Elige de 1 a 5 estrellas.');
    enviado.current = true;
    onGuardar(rating, comentario);
    window.setTimeout(() => (enviado.current = false), 500);
  }

  return (
    <form className="review-form" onSubmit={enviar} noValidate>
      <fieldset className="star-picker" disabled={sending} onMouseLeave={() => setHover(0)}>
        <legend>¿Cómo fue el intercambio con {otro}?</legend>
        <div className="star-picker__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`star-picker__star${n <= visible ? ' is-on' : ''}`}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}: ${ETIQUETAS[n]}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => {
                setRating(n);
                setAviso('');
              }}
              data-testid={`estrella-${n}`}
            >
              ★
            </button>
          ))}
          <span className="star-picker__label" aria-live="polite">
            {visible ? ETIQUETAS[visible] : 'Sin calificar'}
          </span>
        </div>
      </fieldset>
      {aviso && <p className="field-error">{aviso}</p>}

      <div className="field">
        <label htmlFor="review-comment">Comentario (opcional)</label>
        <div className="field-box">
          <textarea
            id="review-comment"
            className="transaction-message"
            rows={3}
            maxLength={MAX_COMENTARIO}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={`Cuéntale a la comunidad cómo fue con ${otro}.`}
            disabled={sending}
          />
        </div>
        <small className="field-hint">
          {comentario.length}/{MAX_COMENTARIO}
        </small>
      </div>

      <div className="tx-actions">
        <button type="submit" className="btn btn-primary" disabled={sending} data-testid="btn-enviar-calificacion">
          {sending ? 'Guardando…' : inicial ? 'Guardar cambios' : 'Enviar calificación'}
        </button>
        {onCancelar && (
          <button type="button" className="btn btn-outline" onClick={onCancelar} disabled={sending}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
