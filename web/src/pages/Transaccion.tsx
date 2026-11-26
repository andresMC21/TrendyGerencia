import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { CalificarIntercambio } from '../components/CalificarIntercambio';
import { Alert } from '../components/Form';
import { SafeMap } from '../components/SafeMap';
import { TxChat } from '../components/TxChat';
import { ApiError, transactionApi, type Transaction as Tx } from '../lib/api';
import { etapaAcuerdo, precio } from '../lib/format';
import { nombrePunto, SAFE_POINTS } from '../lib/safePoints';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; tx: Tx } | { tipo: 'ajena' } | { tipo: 'no-existe' } | { tipo: 'error' };

const fmtLargo = (iso: string) => new Date(iso).toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

/** HU-16 · Acordar el encuentro y HU-17 · cerrar el intercambio (prototipo TRD-25: recibo + mapa + chat). */
export default function Transaccion() {
  const { id = '' } = useParams();
  return <TransaccionPagina key={id} id={id} />;
}

function TransaccionPagina({ id }: { id: string }) {
  const { token } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!token) return;
    let activo = true;
    transactionApi.get(token, id)
      .then((tx) => activo && setEstado({ tipo: 'ok', tx }))
      .catch((err) => {
        if (!activo) return;
        if (err instanceof ApiError && err.status === 403) return setEstado({ tipo: 'ajena' });
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return setEstado({ tipo: 'no-existe' });
        setEstado({ tipo: 'error' });
      });
    return () => { activo = false; };
  }, [id, token]);

  // Mientras siga abierta se consulta cada pocos segundos (respuesta de la otra persona y mensajes nuevos).
  const abierta = estado.tipo === 'ok' && estado.tx.status !== 'CANCELLED';
  const intervalo = estado.tipo === 'ok' && estado.tx.status === 'AGREED_POINT' ? 2500 : 5000;
  useEffect(() => {
    if (!token || !abierta) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setTick((t) => t + 1);
      transactionApi.get(token, id)
        .then((tx) => setEstado((prev) => (prev.tipo === 'ok' && prev.tx.updatedAt === tx.updatedAt ? prev : { tipo: 'ok', tx })))
        .catch(() => undefined);
    }, intervalo);
    return () => window.clearInterval(timer);
  }, [abierta, intervalo, id, token]);

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <p className="crumbs"><Link viewTransition to="/transacciones">← Volver a mis transacciones</Link></p>
        {estado.tipo === 'cargando' && <div className="tx"><div className="receipt skelbox" style={{ height: 420 }} /><div /></div>}
        {estado.tipo === 'ajena' && <Alert tone="error">No participas en esta transacción, así que no puedes verla ni modificarla.</Alert>}
        {estado.tipo === 'no-existe' && <Alert tone="info">Esta transacción no existe.</Alert>}
        {estado.tipo === 'error' && <Alert tone="error">No pudimos cargar la transacción. Inténtalo de nuevo.</Alert>}
        {estado.tipo === 'ok' && <Detalle tx={estado.tx} tick={tick} onChange={(tx) => setEstado({ tipo: 'ok', tx })} />}
      </main>
    </>
  );
}

function Detalle({ tx, tick, onChange }: { tx: Tx; tick: number; onChange: (tx: Tx) => void }) {
  const { user } = useSession();
  const soyComprador = tx.buyerId === user?.id;
  const etapa = etapaAcuerdo(tx, user?.id);
  const otro = ((soyComprador ? tx.seller?.fullName : tx.buyer?.fullName) ?? 'la otra persona').split(' ')[0];
  const [aviso, setAviso] = useState('');
  const [stamp, setStamp] = useState<{ t: string; c?: string; n: number } | null>(null);
  const prev = useRef(tx.status);
  useEffect(() => {
    if (prev.current !== tx.status) {
      if (tx.status === 'AGREED_POINT') setStamp({ t: '¡Acordado!', n: Date.now() });
      if (tx.status === 'COMPLETED') setStamp({ t: '¡Completado!', n: Date.now() });
      if (tx.status === 'CANCELLED') setStamp({ t: 'Cancelado', c: '#D62828', n: Date.now() });
      prev.current = tx.status;
    }
  }, [tx.status]);
  const fire = (t: string, c?: string) => setStamp({ t, c, n: Date.now() });

  const st: [string, string] = tx.status === 'PENDING' ? (etapa === 'sin-propuesta' ? ['Pendiente', 'o'] : ['Esperando respuesta', '']) : tx.status === 'AGREED_POINT' ? ['Punto acordado', 'b'] : tx.status === 'COMPLETED' ? ['Completada', 'g'] : ['Cancelada', 'n'];
  const paso = tx.status === 'COMPLETED' ? 4 : tx.status === 'AGREED_POINT' ? 3 : etapa === 'sin-propuesta' ? 1 : 2;
  const titulo = tx.status === 'CANCELLED' ? 'Transacción cancelada' : tx.status === 'COMPLETED' ? 'Intercambio completado' : tx.status === 'AGREED_POINT' ? 'Nos vemos allá' : etapa === 'esperando' ? 'Propuesta enviada' : etapa === 'por-responder' ? 'Tienes una propuesta' : 'Acuerden el encuentro';
  const ref = tx.id.replace(/-/g, '').slice(0, 4).toUpperCase();

  return (
    <>
      <div className="txhead"><h1>{titulo}</h1></div>
      <div className="tx">
        <div className="receipt">
          <div className="rh">
            <span>RECIBO DE {soyComprador ? 'COMPRA' : 'VENTA'} · Nº {ref} <button className="copy" type="button" aria-label="Copiar referencia" onClick={() => { void navigator.clipboard?.writeText(tx.id); notify('Referencia copiada'); }}>Copiar</button></span>
            <span className={`chip ${st[1]}`} data-testid="transaccion-estado">{st[0]}</span>
          </div>
          <div className="deal">
            <span className="thumb">{tx.product?.photoUrl && <img src={tx.product.photoUrl} alt="" />}</span>
            <div>
              {tx.product ? <Link to={`/producto/${tx.productId}`} style={{ color: 'var(--ink)', fontFamily: "'Young Serif',Georgia,serif", fontSize: 19, textDecoration: 'none' }}>{tx.product.title}</Link> : <b>Transacción</b>}
              <div className="parties">
                <Avatar name={tx.buyer?.fullName ?? 'Comprador'} photoUrl={soyComprador ? user?.photoUrl : tx.buyer?.photoUrl} avatar={soyComprador ? user?.avatar : tx.buyer?.avatar} style={{ width: 28, height: 28 }} />
                <Link to={soyComprador ? '/perfil' : `/usuario/${tx.buyerId}`} data-testid="perfil-comprador">{soyComprador ? 'Tú compras' : `${tx.buyer?.fullName ?? 'Comprador'} compra`}</Link>
                <span aria-hidden="true">⇄</span>
                <Avatar name={tx.seller?.fullName ?? 'Vendedor'} photoUrl={!soyComprador ? user?.photoUrl : tx.seller?.photoUrl} avatar={!soyComprador ? user?.avatar : tx.seller?.avatar} style={{ width: 28, height: 28 }} />
                <Link to={!soyComprador ? '/perfil' : `/usuario/${tx.sellerId}`} data-testid="perfil-vendedor">{!soyComprador ? 'Tú vendes' : `${tx.seller?.fullName ?? 'Vendedor'} vende`}</Link>
              </div>
            </div>
            {tx.product && <span className="chip" style={{ fontSize: 14 }}>{precio(Number(tx.product.price))}</span>}
          </div>
          <div className="stampwrap">{stamp && <div key={stamp.n} className="stamp on" role="status" style={stamp.c ? { color: stamp.c, borderColor: stamp.c } : undefined}>{stamp.t}</div>}</div>
          <ol className="track t4">
            {['Solicitud', 'Punto propuesto', 'Punto aceptado', 'Completada'].map((l, i) => (
              <li key={l} className={tx.status === 'CANCELLED' ? '' : i < paso ? 'done' : i === paso ? 'now' : ''}>{l}</li>
            ))}
          </ol>
          {aviso && <Alert tone="info">{aviso}</Alert>}
          {tx.status === 'PENDING' && <AcordarEncuentro tx={tx} onChange={onChange} onFire={fire} />}
          {tx.status === 'AGREED_POINT' && <Acordado tx={tx} onChange={onChange} onAviso={setAviso} />}
          {tx.status === 'COMPLETED' && (
            <div data-testid="resultado-final">
              <div className="agreed on"><b>Intercambio completado.</b><div className="mu" style={{ fontSize: 14 }}>{tx.seller?.fullName ?? 'El vendedor'} marcó el producto como vendido y {tx.buyer?.fullName ?? 'el comprador'} lo recibió.</div></div>
              <CalificarIntercambio tx={tx} />
            </div>
          )}
          {tx.status === 'CANCELLED' && (
            <div data-testid="resultado-final" className="agreed on" style={{ background: 'var(--cr)' }}>
              <b>Transacción cancelada.</b>
              <div className="mu" style={{ fontSize: 14 }}>{tx.product?.status === 'REMOVED' ? 'Después, quien vendía retiró la publicación, así que ya no está disponible.' : 'El producto se liberó y volvió a estar disponible para otros compradores.'}</div>
            </div>
          )}
          {(tx.status === 'PENDING' || tx.status === 'AGREED_POINT') && <Cancelar tx={tx} onChange={onChange} onAviso={setAviso} />}
          <p className="mu" style={{ fontSize: 12, margin: '14px 0 0' }}>Habla con {otro} en el chat de la derecha.</p>
        </div>
        <aside className="side">
          <TxChat tx={tx} tick={tick} />
          <div className="box"><h3>Consejos para el encuentro</h3><ul><li>Elijan un lugar concurrido y de día.</li><li>Revisa el objeto antes de pagar o intercambiar.</li><li>Confirma en Trendy solo cuando todo esté bien.</li></ul></div>
        </aside>
      </div>
    </>
  );
}

/** HU-17 · Con el punto acordado, cada uno confirma su parte. */
function Acordado({ tx, onChange, onAviso }: { tx: Tx; onChange: (tx: Tx) => void; onAviso: (m: string) => void }) {
  const { token, user } = useSession();
  const [confirmando, setConfirmando] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const soyVendedor = tx.sellerId === user?.id;
  const otro = ((soyVendedor ? tx.buyer?.fullName : tx.seller?.fullName) ?? 'la otra persona').split(' ')[0];
  const vendedor = (tx.seller?.fullName ?? 'El vendedor').split(' ')[0];
  const comprador = (tx.buyer?.fullName ?? 'El comprador').split(' ')[0];
  const yo = soyVendedor ? tx.sellerConfirmedAt : tx.buyerConfirmedAt;
  const punto = SAFE_POINTS.find((p) => p.id === tx.safePointId);

  const confirmar = async () => {
    if (!token || sending) return;
    setSending(true);
    setError('');
    onAviso('');
    try {
      const updated = await transactionApi.confirmExchange(token, tx.id);
      setConfirmando(false);
      onChange({ ...tx, ...updated });
      notify('Transacción actualizada.');
    } catch (err) {
      setConfirmando(false);
      if (err instanceof ApiError && err.status === 409) {
        onAviso('La transacción se actualizó mientras tanto. Te mostramos su estado actual.');
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else setError(err instanceof ApiError ? err.message : 'No pudimos actualizar la transacción. Inténtalo de nuevo.');
    } finally { setSending(false); }
  };

  return (
    <div className="prop" data-testid="encuentro-acordado">
      <div className="agreed on"><b>{nombrePunto(tx.safePointId ?? '')}</b> · {tx.scheduledTime && fmtLargo(tx.scheduledTime)}<div className="mu" style={{ fontSize: 14 }}>Acordado por los dos.{punto ? ` ${punto.address}.` : ''}</div></div>
      <div className="checks" data-testid="confirmaciones">
        <div className={`ck${tx.sellerConfirmedAt ? ' ok' : ''}`} data-testid="estado-vendedor"><span className="dot">{tx.sellerConfirmedAt ? '✓' : ''}</span><span>{tx.sellerConfirmedAt ? <>{soyVendedor ? 'Marcaste' : `${vendedor} marcó`} <b>producto vendido</b></> : <>Falta que {soyVendedor ? 'marques' : `${vendedor} marque`} <b>producto vendido</b></>}</span></div>
        <div className={`ck${tx.buyerConfirmedAt ? ' ok' : ''}`} data-testid="estado-comprador"><span className="dot">{tx.buyerConfirmedAt ? '✓' : ''}</span><span>{tx.buyerConfirmedAt ? <>{!soyVendedor ? 'Marcaste' : `${comprador} marcó`} <b>producto recibido</b></> : <>Falta que {!soyVendedor ? 'marques' : `${comprador} marque`} <b>producto recibido</b></>}</span></div>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="row">
        {yo ? (
          <span className="mu" data-testid="mi-parte-confirmada">Listo de tu parte. Falta {otro}.</span>
        ) : confirmando ? (
          <span className="confirm">{soyVendedor ? `¿Ya le entregaste el producto a ${otro}?` : '¿Ya recibiste el producto?'} No se puede deshacer.
            <button className="btn" type="button" disabled={sending} onClick={() => void confirmar()} data-testid="btn-confirmar">{sending ? 'Guardando…' : soyVendedor ? 'Sí, producto vendido' : 'Sí, lo recibí'}</button>
            <button className="btn2" type="button" onClick={() => setConfirmando(false)}>No</button>
          </span>
        ) : (
          <button className="btn" type="button" onClick={() => setConfirmando(true)} data-testid={soyVendedor ? 'confirmar-vendedor' : 'confirmar-comprador'}>{soyVendedor ? 'Marcar como vendido' : 'Marcar como recibido'}</button>
        )}
      </div>
    </div>
  );
}

/** HU-17 · Cualquiera de los dos puede cancelar mientras siga abierta. */
function Cancelar({ tx, onChange, onAviso }: { tx: Tx; onChange: (tx: Tx) => void; onAviso: (m: string) => void }) {
  const { token } = useSession();
  const [conf, setConf] = useState(false);
  const [sending, setSending] = useState(false);
  const cancelar = async () => {
    if (!token || sending) return;
    setSending(true);
    try {
      const updated = await transactionApi.updateStatus(token, tx.id, 'CANCELLED');
      onChange({ ...tx, ...updated });
      notify('Transacción cancelada.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        onAviso('La transacción se actualizó mientras tanto. Te mostramos su estado actual.');
        if (token) await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else notify(err instanceof ApiError ? err.message : 'No pudimos cancelar la transacción.');
    } finally { setSending(false); setConf(false); }
  };
  return (
    <div className="cancelrow">
      {conf ? (
        <span>¿Seguro? El producto volverá a estar disponible. <button className="ghost danger" type="button" disabled={sending} onClick={() => void cancelar()} data-testid="btn-confirmar">{sending ? 'Cancelando…' : 'Sí, cancelar'}</button><button className="ghost" type="button" onClick={() => setConf(false)}>No</button></span>
      ) : (
        <button className="ghost" type="button" onClick={() => setConf(true)} data-testid="btn-cancelar">Cancelar transacción</button>
      )}
    </div>
  );
}

/** Valor mínimo para <input type="datetime-local"> en la hora local del navegador. */
function ahoraLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/** Mensaje según el error de la API en la negociación del encuentro. */
function mensajeError(err: unknown, accion: string): string {
  if (err instanceof ApiError && err.status === 401)
    return `Tu sesión expiró. Vuelve a ingresar para ${accion}.`;
  if (err instanceof ApiError && err.status === 403)
    return 'No participas en esta transacción, así que no puedes modificarla.';
  return err instanceof ApiError ? err.message : `No pudimos ${accion}. Inténtalo de nuevo.`;
}

/** HU-16 · Proponer, esperar, aceptar, rechazar o contraproponer el punto y la hora. */
function AcordarEncuentro({ tx, onChange, onFire }: { tx: Tx; onChange: (tx: Tx) => void; onFire: (t: string, c?: string) => void }) {
  const { user, token } = useSession();
  const etapa = etapaAcuerdo(tx, user?.id);
  const soyComprador = tx.buyerId === user?.id;
  const otro = ((soyComprador ? tx.seller?.fullName : tx.buyer?.fullName) ?? 'la otra persona').split(' ')[0];
  const [editando, setEditando] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function responder(accion: 'aceptar' | 'rechazar') {
    if (!token || sending || !tx.safePointId || !tx.scheduledTime) return;
    setSending(true);
    setError('');
    try {
      const updated = accion === 'aceptar'
        ? await transactionApi.acceptMeeting(token, tx.id, tx.safePointId, tx.scheduledTime)
        : await transactionApi.rejectMeeting(token, tx.id);
      onChange({ ...tx, ...updated });
      notify(accion === 'aceptar' ? '¡Punto acordado!' : 'Rechazaste la propuesta.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(`${otro} cambió la propuesta o la transacción cambió de estado. Revisa la versión actual.`);
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else setError(mensajeError(err, accion === 'aceptar' ? 'aceptar la propuesta' : 'rechazar la propuesta'));
    } finally { setSending(false); }
  }

  const rechazo = tx.rejectedById && tx.rejectedSafePointId && tx.rejectedScheduledTime ? (
    <div data-testid="aviso-rechazo">
      <Alert tone={tx.rejectedById === user?.id ? 'info' : 'error'}>
        {tx.rejectedById === user?.id ? <><b>Rechazaste la propuesta de {otro}</b> ({nombrePunto(tx.rejectedSafePointId)}, {fmtLargo(tx.rejectedScheduledTime)}). </> : <><b>{otro} rechazó tu propuesta</b> ({nombrePunto(tx.rejectedSafePointId)}, {fmtLargo(tx.rejectedScheduledTime)}). </>}
        {soyComprador ? 'Propón otro punto u horario.' : `Esperando que ${otro} proponga otra.`}
      </Alert>
    </div>
  ) : null;

  const formulario = (onCancel?: () => void) => (
    <ProponerEncuentro tx={tx} onChange={onChange} onCancel={onCancel} onDone={() => { setEditando(false); onFire('¡Propuesto!', '#F77F00'); }} />
  );

  if (etapa === 'sin-propuesta') {
    return (
      <>
        <p className="mu" data-testid="paso-acuerdo" style={{ fontSize: 13, margin: '0 0 6px' }}>Paso 1 de 2 · {soyComprador ? 'Propón' : `${otro} propone`} el punto y la hora de entrega</p>
        {rechazo}
        {error && <Alert tone="error">{error}</Alert>}
        {soyComprador ? formulario() : <div className="agreed on" data-testid="estado-acuerdo"><b>Esperando la propuesta de {otro}</b><div className="mu" style={{ fontSize: 14 }}>Cuando proponga un punto y una hora, aquí podrás aceptarla o rechazarla.</div></div>}
      </>
    );
  }
  const propuesta = tx.safePointId && tx.scheduledTime ? (
    <div className="agreed on" data-testid="propuesta-encuentro"><b>{nombrePunto(tx.safePointId)}</b> · {fmtLargo(tx.scheduledTime)}
      <div className="mu" style={{ fontSize: 14 }} data-testid="estado-acuerdo">{etapa === 'esperando' ? `Esperando a que ${otro} acepte. Le llegó un aviso.` : soyComprador ? `${otro} propone otro punto u horario. ¿Te sirve?` : `${otro} quiere recibir su compra aquí. ¿Aceptas la entrega?`}</div>
    </div>
  ) : null;
  return (
    <div className="prop">
      <p className="mu" data-testid="paso-acuerdo" style={{ fontSize: 13, margin: '0 0 6px' }}>Paso 2 de 2 · {etapa === 'por-responder' ? 'Te toca responder' : `${otro} debe responder`}</p>
      {error && <Alert tone="error">{error}</Alert>}
      {!editando && propuesta}
      {editando ? formulario(() => setEditando(false)) : etapa === 'esperando' ? (
        <div className="row"><button className="btn2" type="button" onClick={() => setEditando(true)}>Cambiar propuesta</button></div>
      ) : (
        <div className="row">
          <button className="btn" type="button" disabled={sending} onClick={() => void responder('aceptar')} data-testid="btn-aceptar-propuesta">{sending ? 'Guardando…' : 'Aceptar'}</button>
          <button className="btn2" type="button" disabled={sending} onClick={() => setEditando(true)} data-testid="btn-contraproponer">Proponer otro</button>
          <button className="ghost danger" type="button" disabled={sending} onClick={() => void responder('rechazar')} data-testid="btn-rechazar-propuesta">Rechazar</button>
        </div>
      )}
    </div>
  );
}

/** Próximas franjas sugeridas: mañana, pasado mañana… a horas razonables. */
function franjas(): Date[] {
  return [[1, 16], [2, 16], [3, 10], [4, 17]].map(([d, h]) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x; });
}
const isoLocal = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/** HU-16 · Formulario del prototipo: mapa con los puntos, lista, franjas y otra fecha. */
function ProponerEncuentro({ tx, onChange, onDone, onCancel }: { tx: Tx; onChange: (tx: Tx) => void; onDone: () => void; onCancel?: () => void }) {
  const { token } = useSession();
  const slots = useRef(franjas()).current;
  const [safePointId, setSafePointId] = useState(tx.safePointId ?? SAFE_POINTS[1].id);
  const [fechaLocal, setFechaLocal] = useState(isoLocal(slots[0]));
  const [slot, setSlot] = useState<number | null>(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function proponer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || sending) return;
    if (!safePointId) return setError('Elige un punto seguro.');
    const fecha = new Date(fechaLocal);
    if (!fechaLocal || Number.isNaN(fecha.getTime())) return setError('Elige la fecha y la hora del encuentro.');
    if (fecha.getTime() <= Date.now()) return setError('La fecha del encuentro debe ser futura.');
    setSending(true);
    setError('');
    try {
      const updated = await transactionApi.proposeMeeting(token, tx.id, safePointId, fecha.toISOString());
      onChange({ ...tx, ...updated });
      notify('Propuesta enviada.');
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('La transacción cambió de estado mientras tanto. Te mostramos su estado actual.');
        await transactionApi.get(token, tx.id).then(onChange).catch(() => undefined);
      } else setError(mensajeError(err, 'enviar la propuesta'));
    } finally { setSending(false); }
  }

  return (
    <form onSubmit={proponer} noValidate aria-busy={sending}>
      <p className="plabel" style={{ margin: '4px 0 10px' }}>¿Dónde se encuentran? <span className="mu" style={{ fontWeight: 400 }}>Toca un punto en el mapa o en la lista</span></p>
      <div className="pick">
        <SafeMap value={safePointId} onPick={setSafePointId} />
        <div className="points" role="radiogroup" aria-label="Punto seguro">
          {SAFE_POINTS.map((p) => (
            <label className="pt" key={p.id}>
              <input type="radio" name="pt" value={p.id} checked={safePointId === p.id} onChange={() => setSafePointId(p.id)} />
              <span><b>{p.name.replace(' (entrada principal)', '')}</b><small>{p.address}</small></span>
            </label>
          ))}
        </div>
      </div>
      <p className="plabel" style={{ margin: '20px 0 8px' }}>¿Cuándo?</p>
      <div className="slots">
        {slots.map((d, i) => (
          <button key={i} type="button" className="slot" aria-pressed={slot === i} onClick={() => { setSlot(i); setFechaLocal(isoLocal(d)); setError(''); }}>
            <b>{d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })}</b>
            <span>{d.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</span>
          </button>
        ))}
      </div>
      <label className="when" htmlFor="scheduled-time"><span className="mu" style={{ fontWeight: 400, fontSize: 14 }}>u otra fecha y hora</span>
        <input id="scheduled-time" type="datetime-local" value={fechaLocal} min={ahoraLocal()} onChange={(e) => { setFechaLocal(e.target.value); setSlot(null); setError(''); }} disabled={sending} />
      </label>
      <p className="err" role="alert">{error}</p>
      <div className="row" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn" type="submit" disabled={sending} data-testid="btn-proponer">{sending ? 'Enviando…' : 'Enviar propuesta'}</button>
        {onCancel && <button className="btn2" type="button" onClick={onCancel} disabled={sending}>Volver</button>}
      </div>
    </form>
  );
}
