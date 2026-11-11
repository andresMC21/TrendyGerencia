import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { Product } from './entities/product.entity';
import { ProductCondition } from './enums/product-condition.enum';
import { ProductSort } from './enums/product-sort.enum';
import { ProductStatus } from './enums/product-status.enum';
import { ProductService } from './product.service';

/** QueryBuilder encadenable: cada método devuelve el mismo objeto. */
const makeQb = () => {
  const qb: any = {};
  [
    'where', 'andWhere', 'leftJoinAndSelect', 'leftJoin', 'innerJoin',
    'select', 'addSelect', 'orderBy', 'addOrderBy', 'offset', 'limit',
    'groupBy', 'relation', 'of', 'insert', 'into', 'values', 'orIgnore',
  ].forEach((m) => (qb[m] = jest.fn().mockReturnValue(qb)));
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getOne = jest.fn();
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawAndEntities = jest.fn().mockResolvedValue({ entities: [], raw: [] });
  qb.add = jest.fn().mockResolvedValue(undefined);
  qb.execute = jest.fn().mockResolvedValue(undefined);
  qb.remove = jest.fn().mockResolvedValue(undefined);
  return qb;
};

const makeProduct = (over: Partial<Product> = {}): Product =>
  ({
    id: 'p1',
    sellerId: 'seller-1',
    title: 'Bici',
    description: 'desc',
    price: 100,
    acceptsBarter: false,
    category: 'deportes',
    condition: ProductCondition.USED,
    status: ProductStatus.AVAILABLE,
    location: { type: 'Point', coordinates: [-76.5, 3.4] },
    neighborhoodId: 'granada',
    estimatedWeightKg: 10,
    viewsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Product;


describe('ProductService', () => {
  let service: ProductService;
  let qb: ReturnType<typeof makeQb>;
  const productRepo: any = {};

  const build = async (ttl = '30') => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: ConfigService, useValue: { get: () => ttl } },
      ],
    }).compile();
    service = module.get(ProductService);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = makeQb();
    Object.assign(productRepo, {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      manager: { createQueryBuilder: jest.fn().mockReturnValue(qb) },
      create: jest.fn((x) => ({ ...x })),
      save: jest.fn(async (x) => ({ id: 'p1', viewsCount: 0, createdAt: new Date(), updatedAt: new Date(), ...x })),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      increment: jest.fn().mockResolvedValue(undefined),
    });
    await build();
  });

  // ───────── create ─────────
  describe('create', () => {
    it('guarda la fotografia y la devuelve en el contrato publico', async () => {
      const photoUrl = 'data:image/jpeg;base64,/9j/2Q==';
      const result = await service.create('seller-1', {
        title: 'Camara', description: 'Usada', category: 'tecnologia',
        condition: ProductCondition.USED, neighborhoodId: 'granada',
        location: { lat: 3.4, lng: -76.5 }, photoUrl,
      });
      expect(productRepo.save).toHaveBeenCalledWith(expect.objectContaining({ photoUrl }));
      expect(result.photoUrl).toBe(photoUrl);
    });
    it('guarda con GeoJSON [lng, lat], valores por defecto y devuelve el DTO', async () => {
      // Arrange
      const dto = {
        title: 'Bici', description: 'd', category: 'deportes',
        condition: ProductCondition.USED, neighborhoodId: 'granada',
        location: { lat: 3.4, lng: -76.5 },
      };

      // Act
      const result = await service.create('seller-1', dto);

      // Assert
      expect(productRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sellerId: 'seller-1',
          price: 0,
          acceptsBarter: false,
          estimatedWeightKg: null,
          status: ProductStatus.AVAILABLE,
          location: { type: 'Point', coordinates: [-76.5, 3.4] },
        }),
      );
      expect(result.location).toEqual({ lat: 3.4, lng: -76.5 });
    });

    it('invalida el caché del barrio', async () => {
      // Arrange
      const spy = jest.spyOn(service, 'invalidateFeedCache');

      // Act
      await service.create('s', {
        title: 'Bici', description: 'd', category: 'c', condition: ProductCondition.NEW,
        neighborhoodId: 'granada', location: { lat: 1, lng: 1 }, price: 5,
      });

      // Assert
      expect(spy).toHaveBeenCalledWith('granada');
    });

    it('HU-08: vincula al vendedor del JWT y fuerza AVAILABLE aunque el DTO traiga campos ajenos', async () => {
      // Arrange: simula un DTO que llegó sin pasar por el ValidationPipe.
      const dto = {
        title: 'Bici', description: 'd', category: 'deportes',
        condition: ProductCondition.USED, neighborhoodId: 'granada',
        location: { lat: 3.4, lng: -76.5 }, price: 1000, acceptsBarter: true,
        estimatedWeightKg: 12,
        sellerId: 'intruso', status: ProductStatus.SOLD, id: 'p-falso', viewsCount: 99,
      } as unknown as Parameters<ProductService['create']>[1];

      // Act
      const result = await service.create('seller-1', dto);

      // Assert
      const created = productRepo.create.mock.calls[0][0];
      expect(created).toEqual({
        photoUrl: null,
        title: 'Bici',
        description: 'd',
        category: 'deportes',
        condition: ProductCondition.USED,
        neighborhoodId: 'granada',
        price: 1000,
        acceptsBarter: true,
        estimatedWeightKg: 12,
        sellerId: 'seller-1',
        status: ProductStatus.AVAILABLE,
        location: { type: 'Point', coordinates: [-76.5, 3.4] },
      });
      expect(result).toMatchObject({
        id: 'p1',
        sellerId: 'seller-1',
        status: ProductStatus.AVAILABLE,
        favoritesCount: 0,
        viewsCount: 0,
      });
    });

    it('HU-08: si falla el guardado responde 500 controlado y no invalida el caché', async () => {
      // Arrange
      productRepo.save.mockRejectedValueOnce(new Error('db caída'));
      const spy = jest.spyOn(service, 'invalidateFeedCache');
      const logSpy = jest
        .spyOn((service as any).logger, 'error')
        .mockImplementation(() => undefined);

      // Act / Assert
      await expect(
        service.create('s', {
          title: 'Bici', description: 'd', category: 'c', condition: ProductCondition.NEW,
          neighborhoodId: 'granada', location: { lat: 1, lng: 1 },
        }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
      expect(spy).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalled();
    });
  });

  // ───────── findAll ─────────
  describe('findAll', () => {
    it('rechaza lat sin lng', async () => {
      // Arrange

      // Act

      // Assert
      await expect(service.findAll({ lat: 3 })).rejects.toBeInstanceOf(BadRequestException);
      await expect(service.findAll({ lng: 3 })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rechaza sort=distance sin coordenadas', async () => {
      // Arrange

      // Act

      // Assert
      await expect(service.findAll({ sort: ProductSort.DISTANCE })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('devuelve resultado paginado con favoritos', async () => {
      // Arrange
      qb.getCount.mockResolvedValue(1);
      qb.getRawAndEntities.mockResolvedValue({ entities: [makeProduct()], raw: [{}] });
      qb.getRawMany.mockResolvedValue([{ id: 'p1', count: '3' }]);

      // Act
      const res = await service.findAll({ neighborhood: 'granada', category: 'Deportes', condition: ProductCondition.USED, page: 2, limit: 5 });

      // Assert
      expect(res).toMatchObject({ total: 1, page: 2, limit: 5 });
      expect(res.items[0].favoritesCount).toBe(3);
      expect(res.items[0].distanceKm).toBeUndefined();
      expect(qb.offset).toHaveBeenCalledWith(5);
      expect(qb.limit).toHaveBeenCalledWith(5);
    });

    it('con lat/lng filtra por ST_DWithin y devuelve distanceKm en km', async () => {
      // Arrange
      qb.getCount.mockResolvedValue(1);
      qb.getRawAndEntities.mockResolvedValue({ entities: [makeProduct()], raw: [{ distance: '1234.5' }] });

      // Act
      const res = await service.findAll({ lat: 3.4, lng: -76.5, radius: 2, sort: ProductSort.DISTANCE });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('ST_DWithin'),
        expect.objectContaining({ meters: 2000 }),
      );
      expect(qb.orderBy).toHaveBeenCalledWith('distance', 'ASC');
      expect(res.items[0].distanceKm).toBe(1.23);
    });

    it.each([
      [ProductSort.PRICE_ASC, 'product.price', 'ASC'],
      [ProductSort.PRICE_DESC, 'product.price', 'DESC'],
      [ProductSort.POPULAR, 'product.viewsCount', 'DESC'],
      [ProductSort.RECENT, 'product.createdAt', 'DESC'],
    ])('ordena por %s', async (sort, column, dir) => {
      // Arrange

      // Act
      await service.findAll({ sort });

      // Assert
      expect(qb.orderBy).toHaveBeenCalledWith(column, dir);
    });

    it('HU-09 · filtra por neighborhoodId', async () => {
      // Act
      await service.findAll({ neighborhoodId: 'granada' });

      // Assert
      expect(qb.andWhere).toHaveBeenCalledWith(
        'product.neighborhoodId = :neighborhood',
        { neighborhood: 'granada' },
      );
    });

    it('HU-09 · neighborhood sigue funcionando como alias y neighborhoodId tiene prioridad', async () => {
      // Act
      await service.findAll({ neighborhood: 'centro' });
      await service.findAll({ neighborhoodId: 'granada', neighborhood: 'centro' });

      // Assert
      expect(qb.andWhere).toHaveBeenNthCalledWith(
        1,
        'product.neighborhoodId = :neighborhood',
        { neighborhood: 'centro' },
      );
      expect(qb.andWhere).toHaveBeenNthCalledWith(
        2,
        'product.neighborhoodId = :neighborhood',
        { neighborhood: 'granada' },
      );
    });

    it('HU-09 · un barrio vacío no filtra', async () => {
      // Act
      await service.findAll({ neighborhoodId: '' });

      // Assert
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('HU-09 · solo consulta productos AVAILABLE, con o sin barrio', async () => {
      // Act
      await service.findAll({});
      await service.findAll({ neighborhoodId: 'granada' });

      // Assert
      expect(qb.where).toHaveBeenCalledTimes(2);
      for (const call of qb.where.mock.calls) {
        expect(call).toEqual(['product.status = :status', { status: ProductStatus.AVAILABLE }]);
      }
    });

    it('HU-09 · retirar un producto saca del caché el feed de su barrio', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      await service.findAll({ neighborhoodId: 'granada' });

      // Act
      await service.remove('p1', 'seller-1');
      await service.findAll({ neighborhoodId: 'granada' });

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(2);
    });

    it('devuelve una lista vacía', async () => {
      // Arrange

      // Act
      const res = await service.findAll({});

      // Assert
      expect(res.items).toEqual([]);
    });

    it('usa el caché en la segunda llamada y se vacía al invalidar', async () => {
      // Arrange

      // Act
      await service.findAll({ neighborhood: 'granada' });
      await service.findAll({ neighborhood: 'granada' });

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(1);

      await service.invalidateFeedCache('granada');
      await service.findAll({ neighborhood: 'granada' });
      expect(qb.getCount).toHaveBeenCalledTimes(2);
    });

    it('invalidar un barrio también limpia las consultas sin barrio, pero no las de otros barrios', async () => {
      // Arrange

      // Act
      await service.findAll({});
      await service.findAll({ neighborhood: 'centro' });
      await service.invalidateFeedCache('granada');
      await service.findAll({});
      await service.findAll({ neighborhood: 'centro' });

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(3); // all se recalcula, centro sigue en caché
    });

    it('con TTL 0 el caché queda deshabilitado', async () => {
      // Arrange
      await build('0');

      // Act
      await service.findAll({});
      await service.findAll({});

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(2);
    });

    it('descarta la entrada más antigua al llenar el caché', async () => {
      // Arrange

      // Act
      for (let i = 0; i < 502; i++) await service.findAll({ page: i + 1 });
      qb.getCount.mockClear();
      await service.findAll({ page: 1 }); // la primera ya fue expulsada

      // Assert
      expect(qb.getCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('buildFeedCacheKey', () => {
    it('es estable ante mayúsculas y valores por defecto', () => {
      // Arrange

      // Act

      // Assert
      expect(service.buildFeedCacheKey({ category: 'Libros' })).toBe(
        service.buildFeedCacheKey({ category: 'libros', page: 1, limit: 20, radius: 5, sort: ProductSort.RECENT }),
      );
    });
    it('incluye el barrio en el prefijo', () => {
      // Arrange

      // Act

      // Assert
      expect(service.buildFeedCacheKey({ neighborhood: 'granada' })).toMatch(/^feed:granada:/);
      expect(service.buildFeedCacheKey({})).toMatch(/^feed:all:/);
    });
    it('HU-09 · comparte la clave entre neighborhoodId y su alias, y un barrio vacío cuenta como all', () => {
      // Assert
      expect(service.buildFeedCacheKey({ neighborhoodId: 'granada' })).toBe(
        service.buildFeedCacheKey({ neighborhood: 'granada' }),
      );
      expect(service.buildFeedCacheKey({ neighborhoodId: '' })).toMatch(/^feed:all:/);
    });
  });

  // ───────── findOne / findById / findNearby ─────────
  describe('findOne', () => {
    it('404 si no existe o fue eliminado', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
      qb.getOne.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('suma una visita y devuelve el vendedor sin datos sensibles', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(
        makeProduct({ seller: { id: 'seller-1', fullName: 'Ana', ratingAverage: 4.5, reviewsCount: 2, password: 'hash', email: 'a@a.com' } as any }),
      );

      // Act
      const res = await service.findOne('p1');

      // Assert
      expect(productRepo.increment).toHaveBeenCalledWith({ id: 'p1' }, 'viewsCount', 1);
      expect(res.viewsCount).toBe(1);
      expect(res.seller).toEqual({ id: 'seller-1', fullName: 'Ana', ratingAverage: 4.5, reviewsCount: 2 });
    });

    it('usa 0 por defecto si el vendedor no tiene rating', async () => {
      // Arrange
      qb.getOne.mockResolvedValue(makeProduct({ seller: { id: 's', fullName: 'A' } as any }));

      // Act
      const res = await service.findOne('p1');

      // Assert
      expect(res.seller.ratingAverage).toBe(0);
      expect(res.seller.reviewsCount).toBe(0);
    });
  });

  describe('findById', () => {
    it('devuelve la entidad', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act

      // Assert
      expect((await service.findById('p1')).id).toBe('p1');
    });
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.findById('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findNearby', () => {
    it('consulta con ST_DWithin en metros', async () => {
      // Arrange
      qb.getMany.mockResolvedValue([makeProduct()]);

      // Act
      const res = await service.findNearby({ lat: 3.4, lng: -76.5 }, 3, 10);

      // Assert
      expect(res).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith(expect.stringContaining('ST_DWithin'), expect.objectContaining({ meters: 3000 }));
      expect(qb.limit).toHaveBeenCalledWith(10);
    });
  });

  // ───────── update ─────────
  describe('update', () => {
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.update('x', 'u', {})).rejects.toBeInstanceOf(NotFoundException);
    });
    it('403 si no es el dueño', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct());

      // Act

      // Assert
      await expect(service.update('p1', 'otro', {})).rejects.toBeInstanceOf(ForbiddenException);
    });
    it('409 si no está AVAILABLE', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct({ status: ProductStatus.RESERVED }));

      // Act

      // Assert
      await expect(service.update('p1', 'seller-1', {})).rejects.toBeInstanceOf(ConflictException);
    });
    it('actualiza campos y ubicación', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct());

      // Act
      const res = await service.update('p1', 'seller-1', { price: 50, location: { lat: 1, lng: 2 } });
      const saved = productRepo.save.mock.calls[0][0];

      // Assert
      expect(saved.price).toBe(50);
      expect(saved.location).toEqual({ type: 'Point', coordinates: [2, 1] });
      expect(res.location).toEqual({ lat: 1, lng: 2 });
    });
    it('invalida ambos barrios si cambia de barrio', async () => {
      // Arrange
      productRepo.findOne.mockResolvedValue(makeProduct());
      const spy = jest.spyOn(service, 'invalidateFeedCache');

      // Act
      await service.update('p1', 'seller-1', { neighborhoodId: 'centro' });

      // Assert
      expect(spy).toHaveBeenCalledWith('granada');
      expect(spy).toHaveBeenCalledWith('centro');
    });
  });

  // ───────── remove ─────────
  describe('remove', () => {
    it('404 si no existe o ya está eliminado', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.remove('x', 'u')).rejects.toBeInstanceOf(NotFoundException);
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.remove('p1', 'seller-1')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('403 si no es el dueño ni moderador', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act

      // Assert
      await expect(service.remove('p1', 'otro', [ValidRoles.USER])).rejects.toBeInstanceOf(ForbiddenException);
    });
    it.each([ProductStatus.RESERVED, ProductStatus.SOLD])('409 si está %s', async (status) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status }));

      // Act / Assert
      await expect(service.remove('p1', 'seller-1')).rejects.toBeInstanceOf(ConflictException);
      expect(productRepo.update).not.toHaveBeenCalled();
    });
    it('el 409 de un producto reservado explica que hay que cancelar la transacción', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.RESERVED }));

      // Act / Assert
      await expect(service.remove('p1', 'seller-1')).rejects.toThrow(/cancela la transacción/);
    });
    it('HU-13 · borrado lógico por el dueño: UPDATE condicional a AVAILABLE e invalida la caché', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      const invalidate = jest.spyOn(service, 'invalidateFeedCache');

      // Act
      await service.remove('p1', 'seller-1');

      // Assert
      expect(productRepo.update).toHaveBeenCalledWith(
        { id: 'p1', status: ProductStatus.AVAILABLE },
        { status: ProductStatus.REMOVED },
      );
      expect(invalidate).toHaveBeenCalledWith('granada');
    });
    it('HU-13 · si lo reservaron entre la lectura y el UPDATE, responde 409 y no lo retira', async () => {
      // Arrange
      productRepo.findOneBy
        .mockResolvedValueOnce(makeProduct())
        .mockResolvedValueOnce(makeProduct({ status: ProductStatus.RESERVED }));
      productRepo.update.mockResolvedValueOnce({ affected: 0 });
      const invalidate = jest.spyOn(service, 'invalidateFeedCache');

      // Act / Assert
      await expect(service.remove('p1', 'seller-1')).rejects.toThrow(/reservado/);
      expect(invalidate).not.toHaveBeenCalled();
    });
    it.each([ValidRoles.ADMIN, ValidRoles.MODERATOR])('%s puede eliminar productos ajenos', async (role) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.remove('p1', 'otro', [role]);

      // Assert
      expect(productRepo.update).toHaveBeenCalled();
    });
  });

  describe('findMine (HU-13)', () => {
    it('devuelve las publicaciones del vendedor en cualquier estado, las más recientes primero', async () => {
      // Arrange
      productRepo.find = jest.fn().mockResolvedValue([
        makeProduct({ id: 'p2', status: ProductStatus.REMOVED }),
        makeProduct({ id: 'p1', status: ProductStatus.AVAILABLE }),
      ]);

      // Act
      const result = await service.findMine('seller-1');

      // Assert
      expect(productRepo.find).toHaveBeenCalledWith({
        where: { sellerId: 'seller-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result.map((p) => [p.id, p.status])).toEqual([
        ['p2', ProductStatus.REMOVED],
        ['p1', ProductStatus.AVAILABLE],
      ]);
    });
  });

  // ───────── favoritos ─────────
  describe('toggleFavorite', () => {
    it('404 si no existe o fue eliminado', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.toggleFavorite('x', 'u')).rejects.toBeInstanceOf(NotFoundException);
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.toggleFavorite('p1', 'u')).rejects.toBeInstanceOf(NotFoundException);
    });
    it('agrega si no era favorito', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      qb.getCount.mockResolvedValue(0);

      // Act

      // Assert
      expect(await service.toggleFavorite('p1', 'u1')).toEqual({ isFavorite: true });
      expect(qb.add).toHaveBeenCalledWith('u1');
    });
    it('quita si ya era favorito', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());
      qb.getCount.mockResolvedValue(1);

      // Act

      // Assert
      expect(await service.toggleFavorite('p1', 'u1')).toEqual({ isFavorite: false });
      expect(qb.remove).toHaveBeenCalledWith('u1');
    });
  });

  // ───────── HU-14 · gestionar favoritos ─────────
  describe('addFavorite (HU-14)', () => {
    it('404 si el producto no existe o fue retirado', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act + Assert
      await expect(service.addFavorite('x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));
      await expect(service.addFavorite('p1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
      expect(qb.execute).not.toHaveBeenCalled();
    });
    it('inserta la combinación usuario-producto y devuelve isFavorite: true', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      const result = await service.addFavorite('p1', 'u1');

      // Assert
      expect(result).toEqual({ isFavorite: true });
      expect(qb.into).toHaveBeenCalledWith('product_favorites', ['productId', 'userId']);
      expect(qb.values).toHaveBeenCalledWith({ productId: 'p1', userId: 'u1' });
      expect(qb.execute).toHaveBeenCalledTimes(1);
    });
    it('no duplica: el INSERT ignora el conflicto, así que repetir no falla', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.addFavorite('p1', 'u1');
      const again = await service.addFavorite('p1', 'u1');

      // Assert
      expect(again).toEqual({ isFavorite: true });
      expect(qb.orIgnore).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeFavorite (HU-14)', () => {
    it('404 si el producto no existe', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act + Assert
      await expect(service.removeFavorite('x', 'u1')).rejects.toBeInstanceOf(NotFoundException);
      expect(qb.remove).not.toHaveBeenCalled();
    });
    it('quita solo la relación del usuario y no toca la publicación', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      const result = await service.removeFavorite('p1', 'u1');

      // Assert
      expect(result).toEqual({ isFavorite: false });
      expect(qb.of).toHaveBeenCalledWith('p1');
      expect(qb.remove).toHaveBeenCalledWith('u1');
      expect(productRepo.update).not.toHaveBeenCalled();
      expect(productRepo.save).not.toHaveBeenCalled();
    });
    it('permite limpiar un producto que el vendedor ya retiró', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.REMOVED }));

      // Act
      const result = await service.removeFavorite('p1', 'u1');

      // Assert
      expect(result).toEqual({ isFavorite: false });
      expect(qb.remove).toHaveBeenCalledWith('u1');
    });
  });

  describe('findFavorites (HU-14)', () => {
    it('devuelve lista vacía si no hay favoritos', async () => {
      // Arrange
      qb.getMany.mockResolvedValue([]);

      // Act
      const result = await service.findFavorites('u1');

      // Assert
      expect(result).toEqual([]);
    });
    it('lista solo los favoritos del usuario, sin retirados, con su conteo', async () => {
      // Arrange
      qb.getMany.mockResolvedValue([makeProduct({ id: 'p1' }), makeProduct({ id: 'p2' })]);
      qb.getRawMany.mockResolvedValue([{ id: 'p1', count: '3' }]);

      // Act
      const result = await service.findFavorites('u1');

      // Assert
      expect(qb.innerJoin).toHaveBeenCalledWith('product.favoritedBy', 'fan', 'fan.id = :userId', { userId: 'u1' });
      expect(qb.where).toHaveBeenCalledWith('product.status != :removed', { removed: ProductStatus.REMOVED });
      expect(result.map((p) => [p.id, p.favoritesCount])).toEqual([['p1', 3], ['p2', 0]]);
    });
  });

  // ───────── updateStatus ─────────
  describe('updateStatus', () => {
    it('404 si no existe', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(null);

      // Act

      // Assert
      await expect(service.updateStatus('x', ProductStatus.RESERVED)).rejects.toBeInstanceOf(NotFoundException);
    });
    it('no hace nada si el estado ya es el pedido', async () => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct());

      // Act
      await service.updateStatus('p1', ProductStatus.AVAILABLE);

      // Assert
      expect(productRepo.update).not.toHaveBeenCalled();
    });
    it.each([
      [ProductStatus.AVAILABLE, ProductStatus.RESERVED],
      [ProductStatus.AVAILABLE, ProductStatus.SOLD],
      [ProductStatus.RESERVED, ProductStatus.AVAILABLE],
      [ProductStatus.RESERVED, ProductStatus.SOLD],
    ])('permite %s → %s', async (from, to) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: from }));

      // Act
      await service.updateStatus('p1', to);

      // Assert
      expect(productRepo.update).toHaveBeenCalledWith({ id: 'p1', status: from }, { status: to });
    });
    it('409 si el estado cambió entre la lectura y la escritura (no lo sobrescribe)', async () => {
      // Arrange: se leyó AVAILABLE, pero alguien lo retiró antes del UPDATE
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: ProductStatus.AVAILABLE }));
      productRepo.update.mockResolvedValueOnce({ affected: 0 });
      const invalidate = jest.spyOn(service, 'invalidateFeedCache');

      // Act / Assert
      await expect(service.updateStatus('p1', ProductStatus.RESERVED)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(invalidate).not.toHaveBeenCalled();
    });
    it.each([
      [ProductStatus.SOLD, ProductStatus.AVAILABLE],
      [ProductStatus.REMOVED, ProductStatus.RESERVED],
      [ProductStatus.RESERVED, ProductStatus.REMOVED],
    ])('rechaza %s → %s', async (from, to) => {
      // Arrange
      productRepo.findOneBy.mockResolvedValue(makeProduct({ status: from }));

      // Act

      // Assert
      await expect(service.updateStatus('p1', to)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('updateStatus dentro de una transacción de base de datos (HU-17)', () => {
    const makeManager = (product: unknown) => {
      const repo = {
        findOne: jest.fn().mockResolvedValue(product),
        findOneBy: jest.fn(),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
      };
      return { repo, manager: { getRepository: jest.fn().mockReturnValue(repo) } as any };
    };

    it('usa el manager recibido y bloquea la fila del producto', async () => {
      // Arrange
      const { repo, manager } = makeManager(makeProduct({ status: ProductStatus.RESERVED }));

      // Act
      await service.updateStatus('p1', ProductStatus.SOLD, manager);

      // Assert
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'p1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'p1', status: ProductStatus.RESERVED },
        { status: ProductStatus.SOLD },
      );
      expect(productRepo.update).not.toHaveBeenCalled();
    });

    it('404 si el producto no existe dentro de la transacción', async () => {
      // Arrange
      const { manager } = makeManager(null);

      // Act / Assert
      await expect(
        service.updateStatus('p1', ProductStatus.AVAILABLE, manager),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('assertOwnership', () => {
    it('no lanza para el dueño y lanza 403 para otro', () => {
      // Arrange

      // Act

      // Assert
      expect(() => service.assertOwnership(makeProduct(), 'seller-1')).not.toThrow();
      expect(() => service.assertOwnership(makeProduct(), 'otro')).toThrow(ForbiddenException);
    });
  });
});
