import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

export function Field({
  label,
  error,
  hint,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: ReactNode }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={`${id}-msg`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {visible ? 'Ocultar' : 'Ver'}
          </button>
        )}
      </div>
      <p id={`${id}-msg`} className={error ? 'field-error' : 'field-hint'}>
        {error ?? hint ?? ' '}
      </p>
    </div>
  );
}

/** Igual que Field, para textos largos. */
export function TextAreaField({
  label,
  error,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <textarea id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...props} />
      </div>
      <p id={`${id}-msg`} className={error ? 'field-error' : 'field-hint'}>
        {error ?? hint ?? ' '}
      </p>
    </div>
  );
}

/** Igual que Field, para elegir de una lista. */
export function SelectField({
  label,
  error,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <select id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...props}>
          {children}
        </select>
      </div>
      <p id={`${id}-msg`} className={error ? 'field-error' : 'field-hint'}>
        {error ?? hint ?? ' '}
      </p>
    </div>
  );
}

export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
