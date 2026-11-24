import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ProductCondition } from '../enums/product-condition.enum';
import { UpdateProductDto } from './update-product.dto';

/**
 * HU-12 · criterio 3: validación del cuerpo de PUT /products/:id con la misma
 * configuración del ValidationPipe global de main.ts.
 */
describe('UpdateProductDto (HU-12)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validate = (body: unknown) =>
    pipe.transform(body, { type: 'body', metatype: UpdateProductDto });

  const messagesFor = async (body: unknown): Promise<string[]> => {
    try {
      await validate(body);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      return ((error as BadRequestException).getResponse() as { message: string[] })
        .message;
    }
    throw new Error('Se esperaba un error de validación');
  };

  it('acepta un cuerpo parcial con un solo campo', async () => {
    const dto = await validate({ price: 200000 });

    expect(dto).toBeInstanceOf(UpdateProductDto);
    expect(dto).toMatchObject({ price: 200000 });
  });

  it('acepta todos los campos editables a la vez', async () => {
    await expect(
      validate({
        title: 'Bicicleta ruta',
        description: 'Recién ajustada',
        price: 320000.5,
        acceptsBarter: false,
        category: 'deportes',
        condition: ProductCondition.NEW,
        location: { lat: 3.45, lng: -76.53 },
        neighborhoodId: 'san-fernando',
        estimatedWeightKg: 12.5,
        photoUrl: '/images/products/bicicleta.jpg',
      }),
    ).resolves.toBeInstanceOf(UpdateProductDto);
  });

  it('recorta y normaliza igual que al publicar', async () => {
    const dto = await validate({
      title: '  Bicicleta  ',
      category: '  DEPORTES ',
      neighborhoodId: ' San-Fernando ',
    });

    expect(dto).toMatchObject({
      title: 'Bicicleta',
      category: 'deportes',
      neighborhoodId: 'san-fernando',
    });
  });

  it.each([
    ['title', 'ab', 'title'],
    ['title', '   ', 'title'],
    ['title', 'x'.repeat(121), 'title'],
    ['description', 'x'.repeat(2001), 'description'],
    ['price', -1, 'price'],
    ['price', 12.345, 'price'],
    ['price', 10_000_000_000, 'price'],
    ['condition', 'ROTO', 'condition'],
    ['neighborhoodId', 'Barrio Con Espacios', 'neighborhoodId'],
    ['estimatedWeightKg', 0, 'estimatedWeightKg'],
    ['acceptsBarter', 'si', 'acceptsBarter'],
    ['photoUrl', 'javascript:alert(1)', 'photoUrl'],
  ])('rechaza %s = %p con error de validación', async (field, value, expected) => {
    const messages = await messagesFor({ [field]: value });

    expect(messages.some((m) => m.startsWith(expected))).toBe(true);
  });

  it('rechaza una ubicación fuera de rango', async () => {
    const messages = await messagesFor({ location: { lat: 91, lng: 0 } });

    expect(messages.length).toBeGreaterThan(0);
  });

  it.each(['sellerId', 'status', 'id', 'viewsCount'])(
    'rechaza el campo no permitido %s',
    async (field) => {
      const messages = await messagesFor({ price: 1, [field]: 'x' });

      expect(messages).toContain(`property ${field} should not exist`);
    },
  );
});
