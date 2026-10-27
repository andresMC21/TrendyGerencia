/**
 * Reglas de HU-01, idénticas a las del backend (RegisterUserDto), para avisar
 * antes de enviar. El servidor sigue siendo quien decide.
 */
export type RegisterErrors = Partial<Record<'fullName' | 'email' | 'password', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegister(values: {
  fullName: string;
  email: string;
  password: string;
}): RegisterErrors {
  const errors: RegisterErrors = {};
  const name = values.fullName.trim();
  const email = values.email.trim();

  if (name.length < 2) errors.fullName = 'Escribe tu nombre (mínimo 2 caracteres).';
  else if (name.length > 100) errors.fullName = 'El nombre admite máximo 100 caracteres.';

  if (!email) errors.email = 'Escribe tu correo.';
  else if (!EMAIL_RE.test(email) || email.length > 254)
    errors.email = 'Ese correo no parece válido.';

  if (values.password.length < 8 || values.password.length > 12)
    errors.password = 'La contraseña debe tener entre 8 y 12 caracteres.';

  return errors;
}

/** Traduce los mensajes de class-validator a algo que entienda la persona. */
export function mapServerValidation(messages: string[]): RegisterErrors {
  const errors: RegisterErrors = {};
  for (const m of messages) {
    if (m.startsWith('email')) errors.email = 'Ese correo no parece válido.';
    else if (m.startsWith('password'))
      errors.password = 'La contraseña debe tener entre 8 y 12 caracteres.';
    else if (m.startsWith('fullName'))
      errors.fullName = 'Revisa tu nombre (entre 2 y 100 caracteres).';
  }
  return errors;
}
