import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Dot, Footer, Header } from '../components/Brand';
import { Alert, Field } from '../components/Form';
import { ApiError } from '../lib/api';
import { useSession } from '../lib/session';
import { mapServerValidation, validateRegister, type RegisterErrors } from '../lib/validation';

/** HU-01 · Crear una cuenta. */
export default function Registro() {
  const { register } = useSession();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [sending, setSending] = useState(false);

  const clear = (field: keyof RegisterErrors) => {
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError(null);
    if (field === 'email') setEmailTaken(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local = validateRegister({ fullName, email, password });
    setErrors(local);
    setFormError(null);
    setEmailTaken(false);
    if (Object.keys(local).length) return;

    setSending(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      navigate('/inicio', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEmailTaken(true);
        setErrors({ email: 'Este correo ya tiene una cuenta en Trendy.' });
      } else if (err instanceof ApiError && err.status === 400) {
        const mapped = mapServerValidation(err.messages);
        setErrors(mapped);
        if (!Object.keys(mapped).length) setFormError('Revisa los datos e inténtalo de nuevo.');
      } else {
        setFormError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      }
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
            <h2>Tu cuenta Trendy</h2>
            <div className="lc-box lc-box--wide">
              <span className="lc-label">PARA QUIÉN</span>
              <p>Caleños que quieren vender o intercambiar objetos en desuso, sin miedo a estafas.</p>
            </div>
            <span className="lc-step">CON TU CUENTA PUEDES</span>
            <ul className="lc-list">
              <li>
                <Dot /> Publicar objetos con descripción, precio y fotos.
              </li>
              <li>
                <Dot /> Encontrar objetos de tu mismo barrio.
              </li>
              <li>
                <Dot /> Recibir puntos de encuentro seguros según el riesgo de la zona.
              </li>
            </ul>
            <span className="lc-step">CONFIANZA</span>
            <div className="lc-box">
              <p>
                Tu cuenta empieza como <strong>usuario sin verificar</strong>. Después podrás
                verificar tu identidad para generar más confianza en tus compradores.
              </p>
            </div>
          </aside>

          <section className="form-card">
            <span className="form-kicker">REGISTRO</span>
            <h1>Crea tu cuenta</h1>
            <p className="form-sub">Solo necesitas tu nombre, tu correo y una contraseña.</p>

            {formError && <Alert tone="error">{formError}</Alert>}

            <form onSubmit={onSubmit} noValidate>
              <Field
                label="Nombre completo"
                name="fullName"
                autoComplete="name"
                placeholder="María Camila Pérez"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clear('fullName');
                }}
                error={errors.fullName}
              />
              <Field
                label="Correo electrónico"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clear('email');
                }}
                error={errors.email}
                hint={undefined}
              />
              {emailTaken && (
                <p className="inline-link">
                  ¿Es tuyo? <Link to="/ingresar">Inicia sesión aquí</Link>
                </p>
              )}
              <Field
                label="Contraseña"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Entre 8 y 12 caracteres"
                maxLength={12}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clear('password');
                }}
                error={errors.password}
                hint={`${password.length}/12 caracteres · mínimo 8`}
              />
              <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                {sending ? 'Creando tu cuenta…' : 'Crear cuenta'}
              </button>
            </form>

            <p className="form-foot">
              ¿Ya tienes cuenta? <Link to="/ingresar">Inicia sesión</Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
