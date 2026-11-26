import { notify } from '../lib/toast';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../components/Avatar';
import { AvatarDialog } from '../components/AvatarDialog';
import { Header } from '../components/Brand';
import { Alert, Field, Meter, TextAreaField } from '../components/Form';
import { ApiError, authApi } from '../lib/api';
import { useSession } from '../lib/session';
import {
  mapServerProfileValidation,
  validateProfile,
  type ProfileErrors,
  validateEmailChange,
  validatePasswordChange,
  type EmailChangeErrors,
  type PasswordChangeErrors,
} from '../lib/validation';

/** HU-04 · Con la verificación en revisión o aprobada, el nombre no se puede cambiar. */
const NOMBRE_BLOQUEADO = ['PENDING', 'VERIFIED'];

/** HU-03 · Mi perfil (prototipo TRD-25): carnet con avatar y ajustes por pestañas. */
export default function Perfil() {
  const { user, token, setProfile } = useSession();
  const [tab, setTab] = useState<'d' | 'c' | 'p'>('d');
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [solicitando, setSolicitando] = useState(false);
  if (!user) return null;
  const hayResenas = user.reviewsCount > 0 && user.ratingAverage != null;
  const ver = user.verificationStatus;
  const verChip: Record<string, [string, string]> = { VERIFIED: ['Verificada', 'ok2'], PENDING: ['En revisión', 'bl'], UNVERIFIED: ['Sin verificar', ''], REJECTED: ['Rechazada', 'n'] };
  const solicitar = async () => {
    if (!token || solicitando) return;
    setSolicitando(true);
    try {
      await authApi.requestVerification(token);
      setProfile({ ...user, verificationStatus: 'PENDING' });
      notify('Solicitud enviada');
    } catch (err) {
      notify(err instanceof ApiError && err.status === 409 ? 'Tu identidad ya está verificada o en revisión.' : 'No pudimos enviar la solicitud.');
    } finally { setSolicitando(false); }
  };
  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap">
        <Link className="back" viewTransition to="/inicio" style={{ marginTop: 10 }}>← Volver a inicio</Link>
        <div className="prof">
          <article className="carnet" aria-label="Tu perfil">
            <div className="top">
              <button type="button" className="avbtn" aria-label="Cambiar avatar" onClick={() => setAvatarOpen(true)}>
                <Avatar large name={user.fullName} photoUrl={user.photoUrl} avatar={user.avatar} />
              </button>
              <div>
                <h1 data-testid="perfil-nombre">{user.fullName}</h1>
                <div className="mail"><span data-testid="perfil-email">{user.email}</span> · <button className="linkbtn" type="button" style={{ fontSize: 14, padding: 0, minHeight: 0 }} onClick={() => setAvatarOpen(true)}>Cambiar avatar</button></div>
              </div>
            </div>
            <p className="bio">{user.info?.trim() ? user.info : 'Aún no has agregado información sobre ti.'}</p>
            <dl>
              <div><dt>Verificación</dt><dd><span className={`chip ${verChip[ver][1]}`}>{verChip[ver][0]}</span></dd></div>
              <div><dt>Estado</dt><dd><span className={`chip ${user.isActive ? 'ok2' : 'n'}`}>{user.isActive ? 'Cuenta activa' : 'Inactiva'}</span></dd></div>
              <div><dt>Calificación</dt><dd data-testid="perfil-rating">{hayResenas ? <><span className="rating"><b>{Number(user.ratingAverage).toLocaleString('es-CO', { maximumFractionDigits: 1 })}</b><span className="stars">{'★'.repeat(Math.round(Number(user.ratingAverage)))}{'☆'.repeat(5 - Math.round(Number(user.ratingAverage)))}</span></span><small className="mu" style={{ fontWeight: 400 }}>{user.reviewsCount} {user.reviewsCount === 1 ? 'reseña' : 'reseñas'}</small></> : <span className="mu" style={{ fontWeight: 400 }}>Sin calificaciones</span>}</dd></div>
              <div><dt>Miembro desde</dt><dd>{new Date(user.createdAt).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })}</dd></div>
            </dl>
            {ver !== 'VERIFIED' && (
              <div className={`vbox${ver === 'PENDING' ? ' pend' : ''}`}>
                <span className="ic">{ver === 'PENDING' ? '…' : '!'}</span>
                <div>
                  <b>{ver === 'PENDING' ? 'Verificación en revisión' : ver === 'REJECTED' ? 'Tu verificación fue rechazada' : 'Verifica tu identidad'}</b>
                  <p>{ver === 'PENDING' ? 'Te avisaremos cuando la revisemos. Mientras tanto no puedes cambiar tu nombre.' : 'Las cuentas verificadas generan más confianza y cierran tratos más rápido.'}</p>
                  {ver !== 'PENDING' && <button className="sbtn" type="button" disabled={solicitando} onClick={() => void solicitar()}>{solicitando ? 'Enviando…' : ver === 'REJECTED' ? 'Volver a solicitar' : 'Solicitar verificación'}</button>}
                </div>
              </div>
            )}
            {ver === 'VERIFIED' && <div className="vbox ok"><span className="ic">✓</span><div><b>Identidad verificada</b><p>Los demás ven la marca de verificación en tu perfil y tus publicaciones.</p></div></div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}><Link className="btn2" viewTransition to={`/usuario/${user.id}`} style={{ flex: 1, justifyContent: 'center' }}>Ver mi perfil público</Link></div>
          </article>
          <div className="ficha" style={{ maxWidth: 'none' }}>
            <div className="kick">Ajustes</div>
            <h2 style={{ fontSize: 30, margin: '6px 0 18px' }}>Edita tu cuenta</h2>
            <div className="tabs" role="tablist">
              <button role="tab" type="button" aria-selected={tab === 'd'} onClick={() => setTab('d')}>Mis datos</button>
              <button role="tab" type="button" aria-selected={tab === 'c'} onClick={() => setTab('c')}>Correo</button>
              <button role="tab" type="button" aria-selected={tab === 'p'} onClick={() => setTab('p')}>Contraseña</button>
            </div>
            {tab === 'd' && <DatosDelPerfil />}
            {tab === 'c' && <CambiarCorreo />}
            {tab === 'p' && <CambiarContrasena />}
          </div>
        </div>
        <AvatarDialog open={avatarOpen} onClose={() => setAvatarOpen(false)} />
      </main>
    </>
  );
}

/** HU-04 · Actualizar mi perfil: nombre e información (PATCH /user/me). */
function DatosDelPerfil() {
  const { token, user, setProfile } = useSession();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [info, setInfo] = useState(user?.info ?? '');
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [sending, setSending] = useState(false);

  if (!user) return null;
  const nombreBloqueado = NOMBRE_BLOQUEADO.includes(user.verificationStatus);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !user) return;
    setError('');
    setOk('');

    const found = validateProfile({ fullName, info });
    if (nombreBloqueado) delete found.fullName;
    setErrors(found);
    if (Object.keys(found).length) return;

    const body: { fullName?: string; info: string } = { info: info.trim() };
    if (!nombreBloqueado && fullName.trim() !== user.fullName) body.fullName = fullName.trim();

    setSending(true);
    try {
      const perfil = await authApi.updateMe(token, body);
      setProfile(perfil);
      notify('Perfil guardado.');
      setFullName(perfil.fullName);
      setInfo(perfil.info ?? '');
      setOk('Guardamos los cambios de tu perfil.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const mapped = mapServerProfileValidation(err.messages);
        setErrors(mapped);
        if (!Object.keys(mapped).length) setError('Revisa los datos e inténtalo de nuevo.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('No puedes cambiar tu nombre mientras tu verificación está en revisión o aprobada.');
      } else {
        setError('No pudimos guardar los cambios. Inténtalo de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="editar-perfil">
      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="Nombre completo"
          name="fullName"
          value={fullName}
          maxLength={100}
          disabled={nombreBloqueado || sending}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.fullName}
          hint={nombreBloqueado ? '🔒 No puedes cambiar tu nombre mientras la verificación está en revisión o aprobada.' : undefined}
        />
        <TextAreaField
          label="Sobre mí"
          name="info"
          rows={4}
          maxLength={300}
          value={info}
          disabled={sending}
          onChange={(e) => setInfo(e.target.value)}
          error={errors.info}
          hint="Cuéntales a los demás quién eres"
          count={`${info.trim().length}/300`}
        />
        <div>
          <button type="submit" className="btn" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

/** HU-05 · Cambiar el correo (PATCH /user/me/email), confirmando con la contraseña actual. */
function CambiarCorreo() {
  const { token, user, setProfile } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [errors, setErrors] = useState<EmailChangeErrors>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !user || sending) return;
    setError('');
    setOk('');
    const found = validateEmailChange({ currentPassword, newEmail }, user.email);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      const perfil = await authApi.changeEmail(token, currentPassword, newEmail.trim().toLowerCase());
      setProfile(perfil);
      notify('Perfil guardado.');
      setCurrentPassword('');
      setNewEmail('');
      setOk(`Listo: desde ahora ingresas con ${perfil.email}.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrors({ currentPassword: 'La contraseña actual no es correcta.' });
      } else if (err instanceof ApiError && err.status === 409) {
        setErrors({ newEmail: 'Ese correo ya está registrado en otra cuenta.' });
      } else if (err instanceof ApiError && err.status === 400) {
        setErrors({ newEmail: 'Revisa el correo: debe ser válido y distinto al actual.' });
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Tu sesión expiró. Vuelve a ingresar.');
      } else {
        setError('No pudimos cambiar el correo. Inténtalo de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <p className="mu" style={{ margin: '0 0 14px', fontSize: 14 }}>Tu correo actual es <b style={{ color: 'var(--ink)' }}>{user?.email}</b>.</p>
      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="Correo nuevo"
          name="newEmail"
          type="email"
          autoComplete="email"
          placeholder="nuevo@correo.com"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          error={errors.newEmail}
          disabled={sending}
        />
        <Field
          label="Contraseña actual"
          name="currentPasswordEmail"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
          hint="La necesitamos para confirmar que eres tú."
          disabled={sending}
        />
        <div>
          <button type="submit" className="btn" disabled={sending}>
            {sending ? 'Guardando…' : 'Cambiar correo'}
          </button>
        </div>
      </form>
    </div>
  );
}

/** HU-05 · Cambiar la contraseña (PATCH /user/me/password), confirmando con la actual. */
function CambiarContrasena() {
  const { token } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || sending) return;
    setError('');
    setOk('');
    const found = validatePasswordChange({ currentPassword, newPassword });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSending(true);
    try {
      await authApi.changePassword(token, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setOk('Tu contraseña se actualizó. Úsala la próxima vez que ingreses.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrors({ currentPassword: 'La contraseña actual no es correcta.' });
      } else if (err instanceof ApiError && err.status === 400) {
        setErrors({
          newPassword: 'La contraseña nueva debe tener entre 8 y 12 caracteres y ser distinta a la actual.',
        });
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Tu sesión expiró. Vuelve a ingresar.');
      } else {
        setError('No pudimos cambiar la contraseña. Inténtalo de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="Contraseña actual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={errors.currentPassword}
          hint="La necesitamos para confirmar que eres tú."
          disabled={sending}
        />
        <Field
          label="Contraseña nueva"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          maxLength={12}
          extra={<Meter length={newPassword.length} />}
          count={`${newPassword.length}/12`}
          hint="Entre 8 y 12 caracteres, distinta a la actual."
          disabled={sending}
        />
        <div>
          <button type="submit" className="btn" disabled={sending}>
            {sending ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
