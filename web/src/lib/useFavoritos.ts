import { useEffect, useRef, useState } from 'react';
import { ApiError, productApi, type Product } from './api';
import { useSession } from './session';

/** Lo que una tarjeta de producto necesita para mostrar su corazón (HU-14). */
export type FavoritoDeTarjeta = {
  activo: boolean;
  ocupado: boolean;
  alternar: () => void;
};

/**
 * HU-14 · Marcar o quitar favoritos desde un listado (Explorar, Inicio) sin abrir
 * el producto. Carga mis favoritos una sola vez y usa PUT y DELETE, que son
 * idempotentes: un doble clic o un reintento no duplica ni invierte la acción.
 *
 * `paraTarjeta` devuelve `undefined` cuando no corresponde mostrar el corazón:
 * sin sesión, mientras carga la lista, o en las publicaciones propias.
 */
export function useFavoritos() {
  const { token, user } = useSession();
  // null = todavía no se cargó mi lista (o no hay sesión).
  const [ids, setIds] = useState<Set<string> | null>(null);
  const [ocupados, setOcupados] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState('');
  const enCurso = useRef(new Set<string>());

  useEffect(() => {
    if (!token) return;
    let activo = true;
    productApi
      .favorites(token)
      .then((lista) => {
        if (activo) setIds(new Set(lista.map((p) => p.id)));
      })
      .catch(() => {
        // Sin la lista no sabemos qué está marcado: es mejor no mostrar corazones que mostrarlos mal.
      });
    return () => {
      activo = false;
    };
  }, [token]);

  async function cambiar(p: Product, quiere: boolean) {
    if (!token || enCurso.current.has(p.id)) return;
    enCurso.current.add(p.id);
    setOcupados(new Set(enCurso.current));
    setError('');
    try {
      if (quiere) await productApi.addFavorite(token, p.id);
      else await productApi.removeFavorite(token, p.id);
      setIds((previos) => {
        const siguientes = new Set(previos);
        if (quiere) siguientes.add(p.id);
        else siguientes.delete(p.id);
        return siguientes;
      });
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? 'Tu sesión expiró. Vuelve a ingresar para usar tus favoritos.'
          : err instanceof ApiError && err.status === 404
            ? 'Ese producto ya no está publicado.'
            : 'No pudimos actualizar tus favoritos. Inténtalo de nuevo.',
      );
    } finally {
      enCurso.current.delete(p.id);
      setOcupados(new Set(enCurso.current));
    }
  }

  function paraTarjeta(p: Product): FavoritoDeTarjeta | undefined {
    if (!token || !ids || (p.sellerId && p.sellerId === user?.id)) return undefined;
    const activo = ids.has(p.id);
    return { activo, ocupado: ocupados.has(p.id), alternar: () => void cambiar(p, !activo) };
  }

  return { paraTarjeta, error };
}
