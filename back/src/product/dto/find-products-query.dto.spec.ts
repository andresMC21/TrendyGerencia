import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { FindProductsQueryDto } from './find-products-query.dto';

/**
 * HU-09 · Validación de los filtros de GET /products con la misma configuración
 * del ValidationPipe global de main.ts.
 */
describe('FindProductsQueryDto (HU-09)', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validate = (query: unknown): Promise<FindProductsQueryDto> =>
    pipe.transform(query, { type: 'query', metatype: FindProductsQueryDto });

  it('acepta neighborhoodId', async () => {
    await expect(validate({ neighborhoodId: 'granada' })).resolves.toMatchObject({
      neighborhoodId: 'granada',
    });
  });

  it('normaliza el barrio igual que al publicar', async () => {
    await expect(
      validate({ neighborhoodId: '  San-Fernando ', neighborhood: ' GRANADA' }),
    ).resolves.toMatchObject({
      neighborhoodId: 'san-fernando',
      neighborhood: 'granada',
    });
  });

  it('rechaza un barrio repetido en la URL', async () => {
    await expect(
      validate({ neighborhoodId: ['granada', 'centro'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rechaza filtros desconocidos', async () => {
    await expect(validate({ barrio: 'granada' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
