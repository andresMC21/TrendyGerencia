import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Footer, Header } from '../components/Brand';
import { Alert, Field } from '../components/Form';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';
import { PullLamp } from '../components/PullLamp';

export default function Ingresar() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [revealed, setRevealed] = useState(false);

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
      <main className="auth auth--login">
        <div className={`container auth-grid login-grid${revealed ? ' login-is-revealed' : ''}`}>
          <aside className="login-story">
            <p className="eyebrow">Tu ciudad. Nuevas posibilidades.</p>
            <h2>Lo cotidiano,<br />con un <em>nuevo comienzo.</em></h2>
            <p className="login-story-lead">Un lugar para encontrar lo que necesitas y darle otra oportunidad a lo que ya no usas.</p>
            <div className="login-art" aria-hidden="true">
              <div className="login-orbit login-orbit--outer" />
              <div className="login-orbit login-orbit--inner" />
              <div className="login-object"><span className="login-object-label">SEGUNDA EDICIÓN</span><span>Las cosas<br />que <em>quedan.</em></span><small>Una historia por continuar</small></div>
              <div className="login-art-note"><span>↗</span><div>Siempre hay algo por descubrir.<small>Cerca de ti, en Cali.</small></div></div>
            </div>
            <div className="login-story-foot"><span className="live-dot" /> Menos guardado. Más vivido.</div>
          </aside>

          <div className="login-switch-panel">
            <div className={`login-lamp-intro${revealed ? ' is-open' : ''}`}>
              <PullLamp large on={revealed} onToggle={() => setRevealed((value) => !value)} disabled={sending} label={revealed ? 'Tira para ocultar el formulario de ingreso' : 'Tira para mostrar el formulario de ingreso'} controls="login-fields" />
              <p>{revealed ? 'Un nuevo comienzo, a un paso.' : 'Enciende tu próximo comienzo.'}</p>
              <span>{revealed ? 'Tira de nuevo para apagar.' : 'Tira del cordón hacia abajo o toca la lámpara.'}</span>
            </div>
          <section id="login-fields" className="form-card login-form" hidden={!revealed}>
            <Link viewTransition to="/explorar" className="login-back">← Seguir explorando</Link>
            <div className="login-welcome-icon" aria-hidden="true">↗</div>
            <span className="form-kicker">BIENVENIDO A TRENDY</span>
            <h1>Qué bueno verte.</h1>
            <p className="form-sub">Inicia sesión y continúa donde lo dejaste.</p>

            {error && <Alert tone="error">{error}</Alert>}

            <form onSubmit={onSubmit} noValidate aria-busy={sending}>
              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                disabled={sending}
                required
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
                disabled={sending}
                required
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
              />
              <button type="submit" className="btn btn-primary btn-block" disabled={sending} aria-busy={sending}>
                {sending && <span className="button-spinner" aria-hidden="true" />}
                {sending ? 'Ingresando…' : 'Entrar a mi cuenta'}
                {!sending && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="form-foot">
              ¿Eres nuevo? <Link viewTransition to="/registro">Crea tu cuenta</Link>
            </p>
            <p className="login-privacy">Tu próximo hallazgo está a un paso.</p>
          </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
