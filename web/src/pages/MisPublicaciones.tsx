import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { RetirarPublicacion } from '../components/RetirarPublicacion';
import { ApiError, productApi, type Product } from '../lib/api';
import { barrio, precio } from '../lib/format';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; items: Product[] }
  | { tipo: 'error'; mensaje: string };

const ACTIVAS = ['AVAILABLE', 'RESERVED'];

/** HU-13 · Publicaciones del vendedor y retiro (borrado lógico). HU-12 · enlace para editarlas. */
export default function MisPublicaciones() {
  const { token } = useSession();
  const location = useLocation();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  const navegacion = location.state as { retirado?: string; editado?: string } | null;
  const [aviso, setAviso] = useState<string>(
    navegacion?.retirado
      ? `Retiraste «${navegacion.retirado}». Ya no aparece en Trendy.`
      : navegacion?.editado
        ? `Guardaste los cambios de «${navegacion.editado}».`
        : '',
  );

  const cargar = useCallback(() => {
    if (!token) return Promise.resolve();
    return productApi
      .mine(token)
      .then((items) => setEstado({ tipo: 'ok', items }))
      .catch((err) =>
        setEstado({
          tipo: 'error',
          mensaje:
            err instanceof ApiError && err.status === 401
              ? 'Tu sesión expiró. Vuelve a ingresar.'
              : 'No pudimos cargar tus publicaciones. Inténtalo de nuevo.',
        }),
      );
  }, [token]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const activas = estado.tipo === 'ok' ? estado.items.filter((p) => ACTIVAS.includes(p.status ?? '')) : [];
  const historial = estado.tipo === 'ok' ? estado.items.filter((p) => !ACTIVAS.includes(p.status ?? '')) : [];

  const [problema, setProblema] = useState('');
  const conflicto = (mensaje: string) => {
    setAviso('');
    setProblema(mensaje);
    void cargar();
  };

  const marcarRetirada = (p: Product) => {
    setProblema('');
    setAviso(`Retiraste «${p.title}». Ya no aparece en Trendy.`);
    setEstado((e) =>
      e.tipo === 'ok'
        ? { ...e, items: e.items.map((x) => (x.id === p.id ? { ...x, status: 'REMOVED' } : x)) }
        : e,
    );
  };

  const items = estado.tipo === 'ok' ? estado.items : [];
  const n = (st: string) => items.filter((p) => p.status === st).length;
  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <Link className="back" viewTransition to="/inicio" style={{ marginTop: 10 }}>← Volver a inicio</Link>
        <div className="mph">
          <div><h1>Mis publicaciones</h1><p className="mu" style={{ margin: '8px 0 0', maxWidth: '60ch' }}>Lo que ofreces en Trendy. Si retiras algo, deja de verse pero queda en tu historial.</p></div>
          <Link className="btn" viewTransition to="/publicar">Publicar algo</Link>
        </div>
        {aviso && <div data-testid="aviso-retiro"><Alert tone="success">{aviso}</Alert></div>}
        {problema && <Alert tone="error">{problema}</Alert>}
        {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
        <div className="stats">
          <div><b>{estado.tipo === 'ok' ? n('AVAILABLE') : '…'}</b><span>Disponibles</span></div>
          <div><b>{estado.tipo === 'ok' ? n('RESERVED') : '…'}</b><span>Reservadas</span></div>
          <div><b>{estado.tipo === 'ok' ? n('SOLD') : '…'}</b><span>Vendidas</span></div>
        </div>
        <h2>Publicadas</h2>
        <ul className="mylist" data-testid="publicaciones-activas">
          {estado.tipo === 'cargando' && [0, 1].map((i) => <li key={i} className="myit skelrow" />)}
          {estado.tipo === 'ok' && activas.length === 0 && (
            <li className="empty"><img src="/img/planta.webp" alt="" /><h2 style={{ marginTop: 10 }}>No tienes nada publicado</h2><p className="mu" style={{ margin: '0 0 16px' }}>Publica tu primer artículo en menos de un minuto.</p><Link className="btn" to="/publicar">Publicar algo</Link></li>
          )}
          {activas.map((p) => <MiPublicacion key={p.id} p={p} onRemoved={() => marcarRetirada(p)} onConflict={conflicto} />)}
        </ul>
        {historial.length > 0 && (
          <div className="hist"><h2>Historial</h2>
            <ul className="mylist" data-testid="publicaciones-historial">
              {historial.map((p) => <MiPublicacion key={p.id} p={p} onRemoved={() => marcarRetirada(p)} onConflict={conflicto} />)}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}

const ST: Record<string, [string, string]> = { AVAILABLE: ['Disponible', 'ok2'], RESERVED: ['Reservado', 'o'], SOLD: ['Vendido', 'n'], REMOVED: ['Retirado', 'n'] };

function MiPublicacion({ p, onRemoved, onConflict }: { p: Product; onRemoved: () => void; onConflict: (mensaje: string) => void }) {
  const status = p.status ?? 'AVAILABLE';
  const [l, c] = ST[status] ?? [status, 'n'];
  const visible = status !== 'REMOVED';
  return (
    <li className="myit" data-testid={`publicacion-${p.id}`}>
      {p.photoUrl ? <img src={p.photoUrl} alt="" /> : <span className="noimg" />}
      <div>
        <div className="t">{visible ? <Link viewTransition to={`/producto/${p.id}`}>{p.title}</Link> : <strong>{p.title}</strong>}<span className={`chip ${c}`} data-testid="estado-publicacion">{l}</span></div>
        <div className="m">{precio(Number(p.price))} · {barrio(p.neighborhoodId)}{p.createdAt ? ` · Publicado el ${new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</div>
        {status === 'RESERVED' && <div className="note">Reservado: para retirarlo, primero cancela la transacción en <Link viewTransition to="/transacciones">Transacciones</Link>.</div>}
        {status === 'REMOVED' && <div className="m">Ya no aparece en Trendy; se conserva en tu historial.</div>}
      </div>
      {status === 'AVAILABLE' ? (
        <div className="ac">
          <Link className="sbtn" viewTransition to={`/editar/${p.id}`} data-testid={`editar-${p.id}`}>Editar</Link>
          <RetirarPublicacion productId={p.id} title={p.title} onRemoved={onRemoved} onConflict={onConflict} compact />
        </div>
      ) : <div />}
    </li>
  );
}
