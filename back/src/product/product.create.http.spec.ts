import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { User } from '../user/entities/user.entity';
import { JwtStrategy } from '../user/strategies/jwt.strategy';
import { ProductCondition } from './enums/product-condition.enum';
import { ProductStatus } from './enums/product-status.enum';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

/**
 * HU-08 · Integración HTTP de POST /api/products sin base de datos.
 * Usa el guard real (Passport + JwtStrategy) y el ValidationPipe de main.ts;
 * solo se simulan el repositorio de usuarios y ProductService.
 */
describe('POST /api/products (HU-08, integración HTTP)', () => {
  const SECRET = 'hu08-test-secret';
  const seller = {
    id: '11111111-1111-4111-8111-111111111111',
    isActive: true,
    tokenVersion: 0,
    role: ['USER'],
  } as unknown as User;

  const userRepository = { findOneBy: jest.fn() };
  const productService = { create: jest.fn() };

  let app: INestApplication;
  let jwt: JwtService;

  const body = (over: Record<string, unknown> = {}) => ({
    title: 'Bicicleta MTB',
    description: 'Rin 26, cambios Shimano, poco uso',
    price: 250000,
    acceptsBarter: true,
    category: 'deportes',
    condition: ProductCondition.LIKE_NEW,
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: 'granada',
    ...over,
  });

  const tokenFor = (payload: object = {}) =>
    jwt.sign({ id: seller.id, email: 'v@trendy.test', tokenVersion: 0, ...payload });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({ secret: SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [ProductController],
      providers: [
        JwtStrategy,
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: ConfigService, useValue: { getOrThrow: () => SECRET } },
        { provide: ProductService, useValue: productService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findOneBy.mockResolvedValue(seller);
    productService.create.mockImplementation(async (sellerId: string, dto: object) => ({
      id: 'p1',
      ...dto,
      sellerId,
      status: ProductStatus.AVAILABLE,
    }));
  });

  it('201: publica con datos válidos, vinculado al vendedor del JWT y en AVAILABLE', async () => {
    // Act
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(body({ title: '  Bicicleta MTB  ', category: 'Deportes' }))
      .expect(201);

    // Assert
    expect(productService.create).toHaveBeenCalledWith(
      seller.id,
      expect.objectContaining({ title: 'Bicicleta MTB', category: 'deportes' }),
    );
    expect(res.body).toMatchObject({ sellerId: seller.id, status: ProductStatus.AVAILABLE });
  });

  it('401: sin JWT no llega al servicio', async () => {
    // Act
    await request(app.getHttpServer()).post('/api/products').send(body()).expect(401);

    // Assert
    expect(productService.create).not.toHaveBeenCalled();
  });

  it.each([
    ['token mal formado', 'Bearer no-es-un-jwt'],
    ['firma de otro secreto', `Bearer ${new JwtService({ secret: 'otro' }).sign({ id: 'x', tokenVersion: 0 })}`],
    ['esquema distinto a Bearer', 'Basic abc'],
  ])('401: %s', async (_caso, header) => {
    // Act
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', header)
      .send(body())
      .expect(401);

    // Assert
    expect(productService.create).not.toHaveBeenCalled();
  });

  it('401: token de una sesión cerrada (tokenVersion desactualizado)', async () => {
    // Arrange
    userRepository.findOneBy.mockResolvedValue({ ...seller, tokenVersion: 1 });

    // Act / Assert
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(body())
      .expect(401);
    expect(productService.create).not.toHaveBeenCalled();
  });

  it('401: cuenta desactivada', async () => {
    // Arrange
    userRepository.findOneBy.mockResolvedValue({ ...seller, isActive: false });

    // Act / Assert
    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(body())
      .expect(401);
  });

  it('400: datos inválidos se rechazan con la lista de mensajes', async () => {
    // Act
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(body({ title: '  ', condition: 'ROTO', location: { lat: 99, lng: 0 } }))
      .expect(400);

    // Assert
    const messages: string[] = res.body.message;
    expect(messages.some((m) => m.startsWith('title'))).toBe(true);
    expect(messages.some((m) => m.startsWith('condition'))).toBe(true);
    expect(messages.some((m) => m.includes('location.lat'))).toBe(true);
    expect(productService.create).not.toHaveBeenCalled();
  });

  it('400: el cliente no puede elegir vendedor ni estado', async () => {
    // Act
    const res = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${tokenFor()}`)
      .send(body({ sellerId: 'otro', status: ProductStatus.SOLD }))
      .expect(400);

    // Assert
    expect(res.body.message).toEqual(
      expect.arrayContaining([
        'property sellerId should not exist',
        'property status should not exist',
      ]),
    );
    expect(productService.create).not.toHaveBeenCalled();
  });
});
