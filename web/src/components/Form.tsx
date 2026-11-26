import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

type Extra = { label: ReactNode; error?: string; hint?: ReactNode; count?: ReactNode; className?: string; before?: ReactNode; after?: ReactNode };

/** Campo del prototipo: etiqueta, caja con borde y una línea de ayuda o error debajo. */
function Shell({ id, label, error, hint, count, className = '', children, extra }: Extra & { id: string; children: ReactNode; extra?: ReactNode }) {
  const msg = error ?? hint;
  return (
    <div className={`fld${error ? ' err' : ''} ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      {children}
      {extra}
      {(msg || count !== undefined) && (
        <span className="hint" id={`${id}-msg`}>
          <span>{msg}</span>
          {count !== undefined && <b>{count}</b>}
        </span>
      )}
    </div>
  );
}

export function Field({ label, error, hint, count, className, before, after, type = 'text', extra, ...props }: InputHTMLAttributes<HTMLInputElement> & Extra & { extra?: ReactNode }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <Shell id={id} label={label} error={error} hint={hint} count={count} className={className} extra={extra}>
      <span className="in">
        {before}
        <input id={id} type={isPassword && visible ? 'text' : type} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...props} />
        {after}
        {isPassword && (
          <button type="button" className="eye" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} disabled={props.disabled}>
            {visible ? 'Ocultar' : 'Ver'}
          </button>
        )}
      </span>
    </Shell>
  );
}

export function TextAreaField({ label, error, hint, count, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & Extra) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} count={count} className={className}>
      <span className="in ta"><textarea id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...props} /></span>
    </Shell>
  );
}

export function SelectField({ label, error, hint, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & Extra) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint} className={className}>
      <span className="in"><select id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...props}>{children}</select></span>
    </Shell>
  );
}

export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  const cls = tone === 'error' ? 'e' : tone === 'success' ? 's' : 'i';
  return (
    <div className={`alert ${cls}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span aria-hidden="true">{tone === 'error' ? '!' : tone === 'success' ? '✓' : 'i'}</span>
      <span>{children}</span>
    </div>
  );
}

/** Barrita de seguridad de la contraseña (rojo, amarillo, verde). */
export function Meter({ length }: { length: number }) {
  return <span className={`meter ${length === 0 ? '' : length < 8 ? 'm1' : length < 11 ? 'm2' : 'm3'}`} aria-hidden="true"><i /><i /><i /></span>;
}
