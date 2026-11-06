import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Dot, Footer, Header } from '../components/Brand';
import { Alert, Field } from '../components/Form';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';

export default function Ingresar() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/inicio', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 401 || err.status === 400)
          ? 'Correo o contraseña incorrectos.'
          : err instanceof Error
            ? err.message
            : 'Ocurrió un error inesperado.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <main className="auth">
        <div className="container auth-grid">
          <aside className="learning-card">
            <h2>Hola de nuevo</h2>
            <span className="lc-step">EN TRENDY TE ESPERAN</span>
            <ul className="lc-list">
              <li>
                <Dot /> Objetos de vecinos de tu barrio.
              </li>
              <li>
                <Dot /> Vendedores verificados y con reputación.
              </li>
              <li>
                <Dot /> Encuentros en puntos de riesgo bajo.
              </li>
            </ul>
          </aside>

          <section className="form-card">
            <span className="form-kicker">INGRESAR</span>
            <h1>Inicia sesión</h1>
            <p className="form-sub">Entra con el correo y la contraseña de tu cuenta.</p>

            {error && <Alert tone="error">{error}</Alert>}

            <form onSubmit={onSubmit} noValidate>
              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
              />
              <Field
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
              />
              <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                {sending ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>

            <p className="form-foot">
              ¿Eres nuevo? <Link to="/registro">Crea tu cuenta</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
