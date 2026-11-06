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

/**
 * HU-08 · Reglas de CreateProductDto (backend) para avisar antes de enviar.
 * Los textos se evalúan recortados, igual que en el servidor.
 */
export type ProductField =
  | 'title'
  | 'description'
  | 'category'
  | 'condition'
  | 'neighborhoodId'
  | 'location'
  | 'price';
export type ProductErrors = Partial<Record<ProductField, string>>;

const MAX_PRICE = 9_999_999_999;

export function validateProduct(values: {
  title: string;
  description: string;
  category: string;
  condition: string;
  neighborhoodId: string;
  location: { lat: number; lng: number } | null;
  price: string;
}): ProductErrors {
  const errors: ProductErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();

  if (title.length < 3) errors.title = 'Escribe un título (mínimo 3 caracteres).';
  else if (title.length > 120) errors.title = 'El título admite máximo 120 caracteres.';

  if (!description) errors.description = 'Describe el estado y los detalles del producto.';
  else if (description.length > 2000)
    errors.description = 'La descripción admite máximo 2000 caracteres.';

  if (!values.category.trim()) errors.category = 'Elige una categoría.';
  if (!values.condition) errors.condition = 'Elige la condición del producto.';
  if (!values.neighborhoodId) errors.neighborhoodId = 'Elige el barrio donde entregas.';

  const { location } = values;
  if (
    !location ||
    !Number.isFinite(location.lat) ||
    !Number.isFinite(location.lng) ||
    Math.abs(location.lat) > 90 ||
    Math.abs(location.lng) > 180
  )
    errors.location = 'Necesitamos una ubicación válida: elige un barrio o usa tu ubicación.';

  if (values.price.trim()) {
    const price = Number(values.price);
    if (!Number.isFinite(price) || price < 0)
      errors.price = 'El precio debe ser un número igual o mayor que 0.';
    else if (price > MAX_PRICE) errors.price = 'El precio es demasiado alto.';
    else if (Math.round(price * 100) !== price * 100)
      errors.price = 'El precio admite máximo dos decimales.';
  }

  return errors;
}

const PRODUCT_SERVER_MESSAGES: Record<ProductField, string> = {
  title: 'Revisa el título (entre 3 y 120 caracteres).',
  description: 'Revisa la descripción (máximo 2000 caracteres).',
  category: 'Revisa la categoría.',
  condition: 'Elige una condición válida.',
  neighborhoodId: 'Elige un barrio de la lista.',
  location: 'La ubicación no es válida. Elige un barrio o usa tu ubicación.',
  price: 'Revisa el precio (0 o más, con máximo dos decimales).',
};

/** Traduce los mensajes 400 de POST /products a errores por campo. */
export function mapServerProductValidation(messages: string[]): ProductErrors {
  const errors: ProductErrors = {};
  for (const m of messages) {
    const field = (Object.keys(PRODUCT_SERVER_MESSAGES) as ProductField[]).find((f) =>
      m.startsWith(f),
    );
    if (field) errors[field] = PRODUCT_SERVER_MESSAGES[field];
  }
  return errors;
}
