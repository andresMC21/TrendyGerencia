import { Link } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { fecha, iniciales, ROL, VERIFICACION } from '../lib/format';
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
              <span className="avatar avatar--lg">{iniciales(user.fullName)}</span>
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
        </div>
      </main>
      <Footer />
    </>
  );
}
