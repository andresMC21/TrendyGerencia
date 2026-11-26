import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Brand';
import { Field } from '../components/Form';
import { Shelf } from '../components/Shelf';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';

/** HU-02 · Iniciar sesión. */
export default function Ingresar() {
  const { login } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const shake = () => form.current?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      shake();
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
          ? 'El correo o la contraseña no coinciden. Revísalos e intenta de nuevo.'
          : err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
      );
      shake();
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />
      <main id="contenido" className="view on wrap" data-view="ingresar">
        <div className="auth">
          <aside className="vitrina">
            <p className="eb">Tu barrio, otra vez</p>
            <h2>Lo cotidiano, con un <em>nuevo comienzo.</em></h2>
            <p className="lead">Un lugar para encontrar lo que necesitas y darle otra vida a lo que ya no usas, cerca de ti en Cali.</p>
            <Shelf items={[['lampara', 4, 92, -3], ['libros', 24, 110, 2], ['camara', 46, 84, -4], ['planta', 64, 78, 3], ['audifonos', 80, 80, -5]]} />
          </aside>
          <div className="ficha">
            <Link className="back" viewTransition to="/explorar">← Seguir explorando</Link>
            <div className="kick">Bienvenido a Trendy</div>
            <h1>Qué bueno verte.</h1>
            <p className="sub">Inicia sesión y continúa donde lo dejaste.</p>
            {error && <div className="alert e" role="alert"><span aria-hidden="true">!</span><span>{error}</span></div>}
            <form ref={form} onSubmit={onSubmit} noValidate aria-busy={sending}>
              <Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email} disabled={sending} onChange={(e) => { setEmail(e.target.value); setError(null); }} />
              <Field label="Contraseña" name="password" type="password" autoComplete="current-password" placeholder="Tu contraseña" value={password} disabled={sending} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
              <button className="btn" type="submit" disabled={sending}>{sending ? 'Ingresando…' : 'Entrar a mi cuenta →'}</button>
            </form>
            <p className="foot">¿Eres nuevo? <Link viewTransition to="/registro">Crea tu cuenta</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}
