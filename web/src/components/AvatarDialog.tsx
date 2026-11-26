import { useEffect, useRef, useState } from 'react';
import { ApiError, authApi } from '../lib/api';
import { AVATAR_COLORES, AVATAR_OBJETOS, avatarPorNombre, escribirAvatar, leerAvatar } from '../lib/avatar';
import { useSession } from '../lib/session';
import { notify } from '../lib/toast';
import { Avatar } from './Avatar';
import { preparePhoto } from './PhotoPicker';

/** TRD-25 · Elegir el avatar: un objeto y un color, o una foto propia. */
export function AvatarDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, token, setProfile } = useSession();
  const ref = useRef<HTMLDialogElement>(null);
  const actual = leerAvatar(user?.avatar) ?? avatarPorNombre(user?.fullName ?? '?');
  const [obj, setObj] = useState(actual.objeto);
  const [color, setColor] = useState(actual.color);
  const [foto, setFoto] = useState<string | null>(user?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setObj(actual.objeto); setColor(actual.color); setFoto(user?.photoUrl ?? null); setError('');
      d.showModal();
    }
    if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!user) return null;
  const guardar = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const perfil = await authApi.updateMe(token, { avatar: escribirAvatar({ objeto: obj, color }), photoUrl: foto });
      setProfile(perfil);
      notify('Avatar actualizado');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? 'Esa foto no se pudo guardar. Prueba con otra más pequeña.' : 'No pudimos guardar tu avatar. Inténtalo de nuevo.');
    } finally { setSaving(false); }
  };

  return (
    <dialog ref={ref} className="avd" aria-labelledby="avT" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="in2">
        <h2 id="avT">Elige tu avatar</h2>
        <p className="mu" style={{ margin: 0 }}>Tu objeto te representa en Trendy: en tus publicaciones, reseñas y transacciones.</p>
        <div className="pv">
          <Avatar large name={user.fullName} photoUrl={foto} avatar={`${obj}:${color}`} />
          <div><b>{user.fullName}</b><span>{foto ? 'Tu foto' : `${AVATAR_OBJETOS[obj]} sobre ${AVATAR_COLORES[color]}`}</span></div>
        </div>
        <h3>Objeto</h3>
        <div className="objs">
          {Object.entries(AVATAR_OBJETOS).map(([k, n]) => (
            <button key={k} type="button" aria-pressed={!foto && obj === k} aria-label={n} style={{ ['--avbg' as string]: color }} onClick={() => { setObj(k); setFoto(null); }}>
              <img src={`/img/${k}.webp`} alt="" />
            </button>
          ))}
        </div>
        <h3>Color</h3>
        <div className="sw">
          {Object.entries(AVATAR_COLORES).map(([c, n]) => <button key={c} type="button" aria-pressed={color === c} aria-label={`Fondo ${n}`} style={{ background: c }} onClick={() => setColor(c)} />)}
        </div>
        <div className="up">
          <span>¿Prefieres una foto tuya?</span>
          <label>Subir foto<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = '';
            if (!f) return;
            try { setFoto(await preparePhoto(f, 400)); } catch (er) { setError(er instanceof Error ? er.message : 'No pudimos leer esa imagen.'); }
          }} /></label>
        </div>
        {error && <p className="err">{error}</p>}
        <div className="actsrow">
          <button className="btn" type="button" disabled={saving} onClick={() => void guardar()}>{saving ? 'Guardando…' : 'Guardar avatar'}</button>
          <button className="btn2" type="button" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </dialog>
  );
}
