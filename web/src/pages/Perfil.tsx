import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Footer, Header } from '../components/Brand';
import { Alert, Field } from '../components/Form';
import { ApiError, authApi } from '../lib/api';
import { fecha, ROL, VERIFICACION } from '../lib/format';
import { useSession } from '../lib/session';
import {
  validateEmailChange,
  validatePasswordChange,
  type EmailChangeErrors,
  type PasswordChangeErrors,
} from '../lib/validation';

/** HU-03 · Consultar mi perfil (GET /user/me). */
export default function Perfil() {
  const { user } = useSession();
  if (!user) return null;

  const ver = VERIFICACION[user.verificationStatus];
  const hayResenas = user.reviewsCount > 0 && user.ratingAverage != null;

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <Link to="/inicio" className="back-link">
            ← Volver a Mi Trendy
          </Link>
          <h1 className="dash-title">Mi perfil</h1>

          <section className="profile-card profile-card--full" aria-label="Datos de mi perfil">
            <div className="profile-head">
              <Avatar name={user.fullName} photoUrl={user.photoUrl} size="lg" />
              <div>
                <strong data-testid="perfil-nombre">{user.fullName}</strong>
                <span data-testid="perfil-email">{user.email}</span>
              </div>
            </div>

            <dl className="profile-data">
              <div>
                <dt>Sobre mí</dt>
                <dd>{user.info?.trim() ? user.info : 'Aún no has agregado información.'}</dd>
              </div>
              <div>
                <dt>Rol</dt>
                <dd>
                  <span className="chip chip--blue">
                    {user.role.map((r) => ROL[r] ?? r).join(', ')}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Verificación</dt>
                <dd>
                  <span className={`chip chip--${ver.tone}`}>{ver.label}</span>
                </dd>
              </div>
              <div>
                <dt>Estado de la cuenta</dt>
                <dd>
                  <span className={`chip chip--${user.isActive ? 'green' : 'gray'}`}>
                    {user.isActive ? 'Cuenta activa' : 'Inactiva'}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Calificación</dt>
                <dd data-testid="perfil-rating">
                  {hayResenas
                    ? `★ ${Number(user.ratingAverage).toFixed(1)} · ${user.reviewsCount} ${
                        user.reviewsCount === 1 ? 'reseña' : 'reseñas'
                      }`
                    : 'Sin calificaciones todavía'}
                </dd>
              </div>
              <div>
                <dt>Miembro desde</dt>
                <dd>{fecha(user.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <FotoDePerfil />
          <CambiarCorreo />
          <CambiarContrasena />
        </div>
      </main>
      <Footer />
    </>
  );
}

/** HU-03 · Cambiar o quitar la foto de perfil (URL de una imagen). */
function FotoDePerfil() {
  const { token, user, setProfile } = useSession();
  const [url, setUrl] = useState(user?.photoUrl ?? '');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [sending, setSending] = useState(false);

  async function guardar(photoUrl: string | null) {
    if (!token) return;
    setSending(true);
    setError('');
    setOk('');
    try {
      const perfil = await authApi.updateMe(token, { photoUrl });
      setProfile(perfil);
      setUrl(perfil.photoUrl ?? '');
      setOk(photoUrl ? 'Foto actualizada.' : 'Quitaste tu foto de perfil.');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Escribe la dirección completa de una imagen, empezando por https://'
          : 'No pudimos guardar la foto. Inténtalo de nuevo.',
      );
    } finally {
      setSending(false);
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void guardar(url.trim() || null);
  };

  return (
    <section className="form-card photo-card" aria-label="Foto de perfil">
      <h2 className="detail-h">Foto de perfil</h2>
      {error && <Alert tone="error">{error}</Alert>}
      {ok && <Alert tone="success">{ok}</Alert>}
      <form onSubmit={onSubmit} noValidate>
        <Field
          label="Dirección (URL) de la imagen"
          name="photoUrl"
          type="url"
          placeholder="https://…/mi-foto.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          hint="Pega el enlace de una imagen pública. Se verá en tu perfil."
        />
        <div className="tx-actions">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Guardando…' : 'Guardar foto'}
          </button>
          {user?.photoUrl && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={sending}
              onClick={() => void guardar(null)}
            >
              Quitar foto
            </button>
          )}
        </div>
      </form>
    </section>
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
    <section className="form-card photo-card" aria-label="Cambiar correo">
      <h2 className="detail-h">Cambiar correo</h2>
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
        <div className="tx-actions">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Guardando…' : 'Cambiar correo'}
          </button>
        </div>
      </form>
    </section>
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
    <section className="form-card photo-card" aria-label="Cambiar contraseña">
      <h2 className="detail-h">Cambiar contraseña</h2>
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
          hint="Entre 8 y 12 caracteres, distinta a la actual."
          disabled={sending}
        />
        <div className="tx-actions">
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </section>
  );
}
