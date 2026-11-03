import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ProductCondition } from '../enums/product-condition.enum';
import { CreateProductDto } from './create-product.dto';

/**
 * HU-08 · Validación del cuerpo de POST /products con la misma configuración
 * del ValidationPipe global de main.ts.
 */
describe('CreateProductDto (HU-08)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validBody = (over: Record<string, unknown> = {}) => ({
    title: 'Bicicleta MTB',
    description: 'Rin 26, cambios Shimano, poco uso',
    price: 250000,
    acceptsBarter: true,
    category: 'deportes',
    condition: ProductCondition.LIKE_NEW,
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: 'granada',
    estimatedWeightKg: 14.5,
    ...over,
  });

  const validate = (body: unknown) =>
    pipe.transform(body, { type: 'body', metatype: CreateProductDto });

  /** Devuelve la lista de mensajes del 400 producido por el pipe. */
  const messagesFor = async (body: unknown): Promise<string[]> => {
    try {
      await validate(body);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        message: string[];
      };
      return response.message;
    }
    throw new Error('Se esperaba un error de validación');
  };

  it('acepta un cuerpo válido y devuelve una instancia del DTO', async () => {
    // Act
    const dto = await validate(validBody());

    // Assert
    expect(dto).toBeInstanceOf(CreateProductDto);
    expect(dto).toMatchObject({ title: 'Bicicleta MTB', neighborhoodId: 'granada' });
  });

  it('acepta solo los campos obligatorios (price, acceptsBarter y peso son opcionales)', async () => {
    // Arrange
    const { price, acceptsBarter, estimatedWeightKg, ...required } = validBody();
    void price;
    void acceptsBarter;
    void estimatedWeightKg;

    // Act / Assert
    await expect(validate(required)).resolves.toBeInstanceOf(CreateProductDto);
  });

  it('recorta los textos y normaliza categoría y barrio a minúsculas', async () => {
    // Act
    const dto = (await validate(
      validBody({
        title: '  Bicicleta MTB  ',
        description: '  Poco uso ',
        category: ' Deportes ',
        neighborhoodId: ' San-Fernando ',
      }),
    )) as CreateProductDto;

    // Assert
    expect(dto).toMatchObject({
      title: 'Bicicleta MTB',
      description: 'Poco uso',
      category: 'deportes',
      neighborhoodId: 'san-fernando',
    });
  });

  it.each(['title', 'description', 'category', 'condition', 'location', 'neighborhoodId'])(
    'rechaza la publicación si falta %s',
    async (field) => {
      // Arrange
      const body: Record<string, unknown> = validBody();
      delete body[field];

      // Act
      const messages = await messagesFor(body);

      // Assert
      expect(messages.some((m) => m.startsWith(field))).toBe(true);
    },
  );

  it.each([
    ['title', '   '],
    ['title', 'ab'],
    ['title', 'x'.repeat(121)],
    ['description', '    '],
    ['description', 'x'.repeat(2001)],
    ['category', '  '],
    ['category', 'x'.repeat(61)],
    ['neighborhoodId', '   '],
    ['neighborhoodId', 'san fernando'],
    ['neighborhoodId', 'barrio_#1'],
  ])('rechaza %s inválido (%j)', async (field, value) => {
    // Act
    const messages = await messagesFor(validBody({ [field]: value }));

    // Assert
    expect(messages.some((m) => m.startsWith(field))).toBe(true);
  });

  it('rechaza una condición que no pertenece al catálogo', async () => {
    // Act
    const messages = await messagesFor(validBody({ condition: 'ROTO' }));

    // Assert
    expect(messages.some((m) => m.startsWith('condition'))).toBe(true);
  });

  it.each([
    [{ lat: 91, lng: -76.5 }, 'lat'],
    [{ lat: 3.4, lng: -181 }, 'lng'],
    [{ lat: '3.4516', lng: -76.532 }, 'lat'],
    [{ lat: 3.4516 }, 'lng'],
  ])('rechaza la ubicación %j', async (location, field) => {
    // Act
    const messages = await messagesFor(validBody({ location }));

    // Assert
    expect(messages.some((m) => m.includes(`location.${field}`))).toBe(true);
  });

  it.each([null, {}, 'Cali'])('rechaza location=%j', async (location) => {
    // Act
    const messages = await messagesFor(validBody({ location }));

    // Assert
    expect(messages.some((m) => m.startsWith('location'))).toBe(true);
  });

  it.each([
    ['price', -5],
    ['price', 10.555],
    ['acceptsBarter', 'si'],
    ['estimatedWeightKg', 0],
  ])('rechaza %s=%j', async (field, value) => {
    // Act
    const messages = await messagesFor(validBody({ [field]: value }));

    // Assert
    expect(messages.some((m) => m.startsWith(field))).toBe(true);
  });

  it.each([
    ['sellerId', '11111111-1111-4111-8111-111111111111'],
    ['status', 'SOLD'],
    ['viewsCount', 99],
  ])('no permite que el cliente envíe %s', async (field, value) => {
    // Act
    const messages = await messagesFor(validBody({ [field]: value }));

    // Assert
    expect(messages).toContain(`property ${field} should not exist`);
  });
});
