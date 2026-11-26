import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Brand';
import { Alert, Field, Meter } from '../components/Form';
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
      <main id="contenido" className="view on wrap" data-view="registro">
        <div className="auth">
          <aside className="vitrina">
            <p className="eb">Tu cuenta Trendy</p>
            <h2>Vende o intercambia <em>sin miedo.</em></h2>
            <p className="lead">Para caleños que quieren darle salida a lo que no usan, con gente de su propio barrio.</p>
            <ul className="perks">
              <li><span className="n">1</span><span><b>Publica en minutos</b>Descripción, precio y fotos de tus objetos.</span></li>
              <li><span className="n">2</span><span><b>Encuentra cerca</b>Objetos de tu mismo barrio, ordenados por distancia.</span></li>
              <li><span className="n">3</span><span><b>Encuentros seguros</b>Puntos sugeridos según el riesgo de la zona.</span></li>
            </ul>
            <div className="trust" style={{ marginTop: 28 }}><span className="chip">Sin verificar</span><span>Tu cuenta empieza <b>sin verificar</b>. Después puedes verificar tu identidad para dar más confianza.</span></div>
          </aside>
          <div className="ficha">
            <div className="kick">Registro</div>
            <h1>Crea tu cuenta</h1>
            <p className="sub">Solo necesitas tu nombre, tu correo y una contraseña.</p>
            {formError && <Alert tone="error">{formError}</Alert>}
            <form onSubmit={onSubmit} noValidate>
              <Field label="Nombre completo" name="fullName" autoComplete="name" placeholder="María Camila Pérez" value={fullName}
                onChange={(e) => { setFullName(e.target.value); clear('fullName'); }} error={errors.fullName} />
              <Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" value={email}
                onChange={(e) => { setEmail(e.target.value); clear('email'); }}
                error={errors.email}
                hint={emailTaken ? undefined : undefined} />
              {emailTaken && <p className="mu" style={{ margin: '-8px 0 14px', fontSize: 13 }}>¿Es tuyo? <Link viewTransition to="/ingresar">Inicia sesión aquí</Link></p>}
              <Field label="Contraseña" name="password" type="password" autoComplete="new-password" placeholder="Entre 8 y 12 caracteres" maxLength={12} value={password}
                onChange={(e) => { setPassword(e.target.value); clear('password'); }}
                className={errors.password ? '' : password.length >= 8 ? 'ok' : ''}
                extra={<Meter length={password.length} />}
                error={errors.password}
                hint={password.length === 0 ? 'Mínimo 8 caracteres' : password.length < 8 ? `Te faltan ${8 - password.length}` : 'Lista'}
                count={`${password.length}/12`} />
              <button className="btn" type="submit" disabled={sending}>{sending ? 'Creando tu cuenta…' : 'Crear cuenta'}</button>
            </form>
            <p className="foot">¿Ya tienes cuenta? <Link viewTransition to="/ingresar">Inicia sesión</Link></p>
          </div>
        </div>
      </main>
    </>
  );
}
