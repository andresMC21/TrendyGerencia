import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '../components/Avatar';
import { Footer, Header } from '../components/Brand';
import { Alert } from '../components/Form';
import { ApiError, userApi, type PublicProfile } from '../lib/api';
import { fecha, VERIFICACION } from '../lib/format';
import { useSession } from '../lib/session';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; perfil: PublicProfile }
  | { tipo: 'no-existe' }
  | { tipo: 'error'; mensaje: string };

/** Estrellas de 1 a 5 redondeadas a la media estrella más cercana, en texto. */
function estrellas(valor: number): string {
  const llenas = Math.round(valor);
  return '★'.repeat(llenas) + '☆'.repeat(Math.max(0, 5 - llenas));
}

/** HU-07 · Consultar el perfil y la reputación de otra persona (GET /user/:id). */
export default function PerfilPublico() {
  const { id = '' } = useParams();
  return <PerfilPublicoPagina key={id} id={id} />;
}

function PerfilPublicoPagina({ id }: { id: string }) {
  const { token, user } = useSession();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });

  useEffect(() => {
    if (!token) return;
    let activo = true;
    userApi
      .publicProfile(token, id)
      .then((perfil) => activo && setEstado({ tipo: 'ok', perfil }))
      .catch((err) => {
        if (!activo) return;
        if (err instanceof ApiError && (err.status === 404 || err.status === 400))
          return setEstado({ tipo: 'no-existe' });
        setEstado({
          tipo: 'error',
          mensaje:
            err instanceof ApiError && err.status === 401
              ? 'Tu sesión expiró. Vuelve a ingresar para ver este perfil.'
              : 'No pudimos cargar el perfil. Inténtalo de nuevo.',
        });
      });
    return () => {
      activo = false;
    };
  }, [id, token]);

  return (
    <>
      <Header />
      <main className="dashboard">
        <div className="container container--narrow">
          <button type="button" className="link-button back-link" onClick={() => navigate(-1)}>
            ← Volver
          </button>

          {estado.tipo === 'cargando' && <div className="feed-loading">Cargando perfil…</div>}
          {estado.tipo === 'no-existe' && (
            <Alert tone="info">Este perfil no existe o la cuenta ya no está activa.</Alert>
          )}
          {estado.tipo === 'error' && <Alert tone="error">{estado.mensaje}</Alert>}
          {estado.tipo === 'ok' && <Detalle perfil={estado.perfil} esMio={estado.perfil.id === user?.id} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Detalle({ perfil, esMio }: { perfil: PublicProfile; esMio: boolean }) {
  const ver = VERIFICACION[perfil.verificationStatus];
  const conResenas = perfil.reviewsCount > 0;
  const nombre = perfil.fullName.split(' ')[0];

  return (
    <>
      {esMio && (
        <Alert tone="info">
          Así ven tu perfil las demás personas. Para editarlo, ve a <Link to="/perfil">Mi perfil</Link>.
        </Alert>
      )}

      <section className="profile-card profile-card--full public-profile" aria-label={`Perfil de ${perfil.fullName}`}>
        <div className="profile-head">
          <Avatar name={perfil.fullName} photoUrl={perfil.photoUrl} size="lg" />
          <div>
            <h1 className="public-profile__name" data-testid="perfil-publico-nombre">
              {perfil.fullName}
            </h1>
            <span className={`chip chip--${ver.tone}`} data-testid="perfil-publico-verificacion">
              {ver.label}
            </span>
          </div>
        </div>

        <div className="reputation" data-testid="perfil-publico-reputacion">
          <div className="reputation__score">
            <strong>{conResenas ? perfil.ratingAverage.toFixed(1) : '—'}</strong>
            <span className="reputation__stars" aria-hidden="true">
              {estrellas(conResenas ? perfil.ratingAverage : 0)}
            </span>
          </div>
          <div>
            <strong>
              {conResenas
                ? `${perfil.reviewsCount} ${perfil.reviewsCount === 1 ? 'reseña' : 'reseñas'}`
                : 'Sin calificaciones todavía'}
            </strong>
            <span>
              {conResenas
                ? `Promedio de ${perfil.ratingAverage.toFixed(1)} sobre 5 en sus intercambios.`
                : `${nombre} aún no ha recibido reseñas de otros intercambios.`}
            </span>
          </div>
        </div>

        <dl className="profile-data">
          <div>
            <dt>Sobre {esMio ? 'mí' : nombre}</dt>
            <dd>{perfil.info?.trim() ? perfil.info : 'Sin presentación.'}</dd>
          </div>
          <div>
            <dt>Productos disponibles</dt>
            <dd data-testid="perfil-publico-productos">
              {perfil.availableProductsCount === 0
                ? 'Ninguno por ahora'
                : `${perfil.availableProductsCount} ${perfil.availableProductsCount === 1 ? 'producto' : 'productos'}`}
            </dd>
          </div>
          <div>
            <dt>Miembro desde</dt>
            <dd>{fecha(perfil.memberSince)}</dd>
          </div>
        </dl>
      </section>

      <h2 className="detail-h">Reseñas recientes</h2>
      {perfil.recentReviews.length === 0 ? (
        <p className="field-hint">Todavía no hay reseñas.</p>
      ) : (
        <ul className="review-list" data-testid="perfil-publico-resenas">
          {perfil.recentReviews.map((r, i) => (
            <li key={`${r.createdAt}-${i}`} className="review-item">
              <div className="review-item__head">
                <span className="reputation__stars" aria-label={`${r.rating} de 5`}>
                  {estrellas(r.rating)}
                </span>
                <span>
                  {r.reviewerName} · {fecha(r.createdAt)}
                </span>
              </div>
              {r.comment && <p>{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
