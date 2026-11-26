import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ApiError, transactionApi, type Transaction, type TransactionMessage } from '../lib/api';
import { nombrePunto } from '../lib/safePoints';
import { useSession } from '../lib/session';
import { fechaCorta } from '../lib/txNext';
import { Avatar } from './Avatar';

type Item = { at: string; sys?: string; m?: TransactionMessage };

const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });
function dia(iso: string) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

/**
 * TRD-25 · Chat entre comprador y vendedor, con los eventos de la transacción
 * (solicitud, propuesta, acuerdo, cierre) intercalados en el tiempo.
 */
export function TxChat({ tx, tick }: { tx: Transaction; tick: number }) {
  const { token, user } = useSession();
  const [msgs, setMsgs] = useState<TransactionMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const soyComprador = tx.buyerId === user?.id;
  const otro = soyComprador ? tx.seller : tx.buyer;
  const otroNombre = otro?.fullName ?? (soyComprador ? 'Vendedor' : 'Comprador');
  const primer = (id: string) => (id === tx.buyerId ? tx.buyer?.fullName : tx.seller?.fullName)?.split(' ')[0] ?? '';
  const cerrada = tx.status === 'CANCELLED';

  useEffect(() => {
    if (!token) return;
    let activo = true;
    transactionApi.messages(token, tx.id).then((l) => activo && setMsgs(l)).catch(() => undefined);
    return () => { activo = false; };
  }, [token, tx.id, tick]);

  const items: Item[] = [{ at: tx.createdAt ?? new Date().toISOString(), sys: `<b>${primer(tx.buyerId)}</b> envió una solicitud de compra` }];
  if (tx.message) items.push({ at: tx.createdAt ?? '', m: { id: 'inicial', transactionId: tx.id, senderId: tx.buyerId, body: tx.message, createdAt: tx.createdAt ?? '' } });
  for (const m of msgs) items.push({ at: m.createdAt, m });
  if (tx.status === 'PENDING' && tx.safePointId && tx.scheduledTime && tx.proposedById)
    items.push({ at: tx.updatedAt ?? new Date().toISOString(), sys: `📍 <b>${primer(tx.proposedById)}</b> propuso <b>${nombrePunto(tx.safePointId)}</b> · ${fechaCorta(tx.scheduledTime)}` });
  if (tx.agreedAt && tx.safePointId) items.push({ at: tx.agreedAt, sys: `✅ <b>Punto acordado:</b> ${nombrePunto(tx.safePointId)}. ¡Nos vemos allá!` });
  if (tx.status === 'COMPLETED') items.push({ at: tx.updatedAt ?? '', sys: '🎉 <b>Intercambio completado.</b> Califiquen la experiencia.' });
  if (tx.status === 'CANCELLED') items.push({ at: tx.updatedAt ?? '', sys: '<b>Transacción cancelada.</b>' });

  useEffect(() => { if (body.current) body.current.scrollTop = body.current.scrollHeight; }, [items.length]);

  const send = async (t: string) => {
    const v = t.trim();
    if (!v || !token || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const m = await transactionApi.sendMessage(token, tx.id, v);
      setMsgs((l) => [...l, m]);
      setTexto('');
      if (area.current) area.current.style.height = 'auto';
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? 'Esta transacción ya no recibe mensajes.' : 'No pudimos enviar el mensaje.');
    } finally { setEnviando(false); }
  };

  const quick = tx.status === 'PENDING'
    ? (tx.proposedById ? ['¿Te sirve esa hora?', 'Te acabo de proponer un punto'] : ['¿Te sirve el jueves?', '¿A qué hora puedes?', '¿Sigue disponible?'])
    : tx.status === 'AGREED_POINT' ? ['Voy en camino 🚶', 'Ya llegué', '¿Dónde estás?'] : tx.status === 'COMPLETED' ? ['¡Gracias por todo!'] : [];

  const rows: ReactElement[] = [];
  let lastDay = '';
  items.forEach((it, i) => {
    const d = dia(it.at);
    if ((it.m || i === 0) && d !== lastDay) { rows.push(<div className="day" key={`d${i}`}>{d}</div>); lastDay = d; }
    if (it.sys) { rows.push(<div className="sys" key={`s${i}`} dangerouslySetInnerHTML={{ __html: it.sys }} />); return; }
    const m = it.m!;
    const mine = m.senderId === user?.id;
    const nx = items[i + 1];
    const last = !nx || !nx.m || nx.m.senderId !== m.senderId || dia(nx.at) !== d;
    const quien = m.senderId === tx.buyerId ? tx.buyer : tx.seller;
    rows.push(
      <div className={`mrow${mine ? ' me' : ''}${last ? ' last' : ''}`} key={m.id}>
        <Avatar name={quien?.fullName ?? '?'} photoUrl={mine ? user?.photoUrl : quien?.photoUrl} avatar={mine ? user?.avatar : quien?.avatar} />
        <div className="bub">{m.body}<span className="tm">{hora(m.createdAt)}{mine && <span className="tk">✓✓</span>}</span></div>
      </div>,
    );
  });

  return (
    <section className="chat" aria-label="Conversación">
      <header className="chead">
        <Avatar name={otroNombre} photoUrl={otro?.photoUrl} avatar={otro?.avatar} />
        <div><b>{otroNombre}{soyComprador ? '' : ' (comprador)'}</b><small><i className="on" /><span>{soyComprador ? 'Vende este producto' : 'Quiere tu producto'}</span></small></div>
      </header>
      <div className="cbody" ref={body} role="log" aria-live="polite">{rows}</div>
      {error && <p className="err" style={{ padding: '0 12px' }}>{error}</p>}
      {!cerrada && (
        <>
          <div className="quick">{quick.map((q) => <button key={q} type="button" onClick={() => void send(q)}>{q}</button>)}</div>
          <form className="compose" onSubmit={(e) => { e.preventDefault(); void send(texto); }}>
            <textarea ref={area} rows={1} placeholder="Escribe un mensaje…" aria-label="Escribe un mensaje" maxLength={500} value={texto}
              onChange={(e) => { setTexto(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(texto); } }} />
            <button type="submit" aria-label="Enviar" disabled={enviando || !texto.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
        </>
      )}
    </section>
  );
}
