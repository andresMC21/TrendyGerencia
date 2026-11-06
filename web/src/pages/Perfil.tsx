import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Footer, Header } from '../components/Brand';
import { Alert, Field } from '../components/Form';
import { ApiError, authApi } from '../lib/api';
import { fecha, ROL, VERIFICACION } from '../lib/format';
import { useSession } from '../lib/session';

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
