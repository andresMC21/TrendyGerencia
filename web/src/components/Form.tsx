import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

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

export function Alert({ tone, children }: { tone: 'error' | 'success' | 'info'; children: ReactNode }) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
