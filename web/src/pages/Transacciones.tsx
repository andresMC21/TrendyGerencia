import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { transactionApi, type Transaction, type TransactionStatus } from '../lib/api';
import { useSession } from '../lib/session';
import { siguientePaso } from '../lib/txNext';

type Estado = { tipo: 'cargando' } | { tipo: 'ok'; items: Transaction[] } | { tipo: 'error' };
const ST: Record<TransactionStatus, [string, string]> = { PENDING: ['Pendiente', 'o'], AGREED_POINT: ['Punto acordado', 'bl'], COMPLETED: ['Completada', 'ok2'], CANCELLED: ['Cancelada', 'n'] };
const TABS: [string, string][] = [['', 'Todas'], ['todo', 'Te esperan'], ['PENDING', 'Pendientes'], ['AGREED_POINT', 'Acordadas'], ['COMPLETED', 'Completadas'], ['CANCELLED', 'Canceladas']];
const LB = ['Solicitud', 'Punto', 'Acordado', 'Completada'];

/** Paso actual (0-3) para la barrita de progreso. */
function paso(t: Transaction): number {
  if (t.status === 'COMPLETED') return 4;
  if (t.status === 'AGREED_POINT') return 2;
  return t.safePointId && t.proposedById ? 1 : 1;
}

/** HU-16 · Mis transacciones: las que esperan algo de mí van primero. */
export default function Transacciones() {
  const { token, user } = useSession();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const [f, setF] = useState('');
  useEffect(() => {
    if (!token) return;
    let activo = true;
    transactionApi.list(token).then((items) => activo && setEstado({ tipo: 'ok', items })).catch(() => activo && setEstado({ tipo: 'error' }));
    return () => { activo = false; };
  }, [token]);

  const items = estado.tipo === 'ok' ? estado.items : [];
  const conPaso = items.map((t) => ({ t, n: siguientePaso(t, user?.id) }));
  const cnt = (k: string) => (k === '' ? items.length : k === 'todo' ? conPaso.filter((x) => x.n.mine && (x.t.status === 'PENDING' || x.t.status === 'AGREED_POINT')).length : items.filter((t) => t.status === k).length);
  const lista = conPaso
    .filter(({ t, n }) => f === '' || (f === 'todo' ? n.mine && (t.status === 'PENDING' || t.status === 'AGREED_POINT') : t.status === f))
    .sort((a, b) => Number(b.n.mine && b.t.status !== 'COMPLETED' && b.t.status !== 'CANCELLED') - Number(a.n.mine && a.t.status !== 'COMPLETED' && a.t.status !== 'CANCELLED'));

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <Link className="back" viewTransition to="/inicio" style={{ marginTop: 10 }}>← Volver a inicio</Link>
        <div className="mph"><div><h1>Mis transacciones</h1><p className="mu" style={{ margin: '8px 0 0', maxWidth: '62ch' }}>Compras y ventas en las que participas. Las que esperan algo de ti aparecen primero.</p></div></div>
        {estado.tipo === 'error' && <Alert tone="error">No pudimos cargar tus transacciones. Inténtalo de nuevo.</Alert>}
        <div className="txtabs" role="group" aria-label="Filtrar transacciones">
          {TABS.map(([k, n]) => <button key={k} type="button" aria-pressed={k === f} onClick={() => setF(k)}>{n}<b>{estado.tipo === 'ok' ? cnt(k) : '…'}</b></button>)}
        </div>
        <ul className="txl" data-testid="transacciones-lista">
          {estado.tipo === 'cargando' && [0, 1, 2].map((i) => <li key={i}><div className="txi skel" style={{ height: 106 }} /></li>)}
          {estado.tipo === 'ok' && lista.length === 0 && (
            <li className="empty"><img src="/img/audifonos.webp" alt="" /><h2 style={{ marginTop: 10 }}>{items.length ? 'Nada por aquí' : 'Todavía no tienes transacciones'}</h2><p className="mu" style={{ margin: '0 0 16px' }}>{items.length ? 'No tienes transacciones en este estado.' : 'Cuando compres o vendas algo, aparecerá aquí.'}</p><Link className="btn" to="/explorar">Explorar productos</Link></li>
          )}
          {lista.map(({ t, n }) => {
            const [l, c] = ST[t.status];
            const soyComprador = t.buyerId === user?.id;
            const otro = (soyComprador ? t.seller?.fullName : t.buyer?.fullName) ?? 'otro usuario';
            const step = paso(t);
            const activa = t.status === 'PENDING' || t.status === 'AGREED_POINT';
            const mine = n.mine && activa;
            return (
              <li key={t.id}>
                <Link className={`txi${mine ? ' todo' : ''}`} viewTransition to={`/transacciones/${t.id}`}>
                  {t.product?.photoUrl ? <img src={t.product.photoUrl} alt="" /> : <span className="noimg" />}
                  <div>
                    <div className="t"><strong>{t.product?.title ?? 'Producto'}</strong><span className={`chip ${c}`}>{l}</span></div>
                    <div className="who"><Avatar name={otro} />{soyComprador ? 'Compras a' : 'Vendes a'} {otro}</div>
                    <div className={`nx${mine ? ' me' : ''}`}>{n.text}</div>
                  </div>
                  <div className="prog">
                    {t.status === 'CANCELLED' ? (
                      <><ul className="mini x"><li /><li /><li /><li /></ul><div className="minil"><span>Cancelada</span></div></>
                    ) : (
                      <><ul className="mini">{[0, 1, 2, 3].map((i) => <li key={i} className={i < step ? 'sd' : i === step ? 'sn' : ''} />)}</ul>
                        <div className="minil"><span>{LB[Math.min(step, 3)]}</span><span>{Math.min(step + 1, 4)} de 4</span></div></>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
