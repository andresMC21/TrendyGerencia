import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../product/entities/product.entity';
import { ProductStatus } from '../product/enums/product-status.enum';
import { ProductService } from '../product/product.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';
import { TransactionService } from './transaction.service';

const makeProduct = (over: any = {}) => ({
  id: 'p1',
  sellerId: 'seller-1',
  title: 'Bici',
  description: 'desc',
  price: 100,
  acceptsBarter: false,
  category: 'deportes',
  condition: 'USADO',
  status: ProductStatus.AVAILABLE,
  location: { type: 'Point', coordinates: [-76.5, 3.4] },
  neighborhoodId: 'granada',
  estimatedWeightKg: 10,
  viewsCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const makeTransaction = (over: Partial<Transaction> = {}) =>
  ({
    id: 't1',
    productId: 'p1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: TransactionStatus.PENDING,
    safePointId: null,
    scheduledTime: null,
    product: makeProduct(),
    buyer: { id: 'buyer-1', fullName: 'Buyer' },
    seller: { id: 'seller-1', fullName: 'Seller' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Transaction;

describe('TransactionService', () => {
  let service: TransactionService;
  const transactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };
  const productService = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
    invalidateFeedCache: jest.fn(),
  };
  // EntityManager de la transacción de base de datos usada en update (HU-17).
  const manager = {
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, value: object) => ({ id: 't1', ...value })),
    save: jest.fn(async (value: unknown) => value),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: transactionRepository,
        },
        { provide: ProductService, useValue: productService },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    // Assert
    expect(service).toBeDefined();
  });

  describe('create (HU-15 · reserva sin carreras)', () => {
    /** manager.findOne devuelve el producto o la transacción activa según la entidad. */
    const givenRows = (product: unknown, active: unknown = null) =>
      manager.findOne.mockImplementation(async (entity: unknown) =>
        entity === Transaction ? active : product,
      );

    it('reserva el producto y guarda la transaccion en la misma transaccion de base de datos', async () => {
      // Arrange
      givenRows(makeProduct());

      // Act
      const result = await service.create('buyer-1', { productId: 'p1' });

      // Assert
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.create).toHaveBeenCalledWith(Transaction, {
        productId: 'p1',
        message: null,
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        status: TransactionStatus.PENDING,
      });
      expect(productService.updateStatus).toHaveBeenCalledWith(
        'p1',
        ProductStatus.RESERVED,
        manager,
      );
      expect(productService.invalidateFeedCache).toHaveBeenCalledWith('granada');
      expect(result).toMatchObject({
        id: 't1',
        productId: 'p1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
        status: TransactionStatus.PENDING,
        product: expect.objectContaining({ status: ProductStatus.RESERVED }),
      });
    });

    it('bloquea la fila del producto (SELECT ... FOR UPDATE)', async () => {
      // Arrange
      givenRows(makeProduct());

      // Act
      await service.create('buyer-1', { productId: 'p1' });

      // Assert
      expect(manager.findOne).toHaveBeenCalledWith(Product, {
        where: { id: 'p1' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('404 si el producto no existe', async () => {
      // Arrange
      givenRows(null);

      // Act / Assert
      await expect(
        service.create('buyer-1', { productId: 'p1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rechaza si ya hay transaccion activa', async () => {
      // Arrange
      givenRows(makeProduct(), makeTransaction());

      // Act / Assert
      await expect(
        service.create('buyer-1', { productId: 'p1' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
      expect(productService.updateStatus).not.toHaveBeenCalled();
    });

    it('convierte la violacion del indice unico (23505) en 409', async () => {
      // Arrange
      givenRows(makeProduct());
      manager.save.mockRejectedValueOnce(Object.assign(new Error('dup'), { code: '23505' }));

      // Act / Assert
      await expect(
        service.create('buyer-1', { productId: 'p1' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(productService.invalidateFeedCache).not.toHaveBeenCalled();
    });

    it('propaga otros errores sin tocar la cache (la base de datos revierte todo)', async () => {
      // Arrange
      givenRows(makeProduct());
      manager.save.mockRejectedValueOnce(new Error('db'));

      // Act / Assert
      await expect(service.create('buyer-1', { productId: 'p1' })).rejects.toThrow('db');
      expect(productService.updateStatus).not.toHaveBeenCalled();
      expect(productService.invalidateFeedCache).not.toHaveBeenCalled();
    });

    it('rechaza compras del propio vendedor', async () => {
      // Arrange
      givenRows(makeProduct({ sellerId: 'seller-1' }));

      // Act / Assert
      await expect(
        service.create('seller-1', { productId: 'p1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it.each([ProductStatus.RESERVED, ProductStatus.SOLD, ProductStatus.REMOVED])(
      'rechaza productos en estado %s',
      async (status) => {
        // Arrange
        givenRows(makeProduct({ status }));

        // Act / Assert
        await expect(
          service.create('buyer-1', { productId: 'p1' }),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(manager.save).not.toHaveBeenCalled();
      },
    );
  });

  it('findOne solo permite participantes', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValue(makeTransaction());

    // Act
    const result = service.findOne('t1', 'otro');

    // Assert
    await expect(result).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('findOne devuelve 404 si no existe', async () => {
    // Arrange
    transactionRepository.findOne.mockResolvedValue(null);

    // Act
    const result = service.findOne('missing', 'buyer-1');

    // Assert
    await expect(result).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findAll devuelve transacciones de comprador o vendedor ordenadas', async () => {
    // Arrange
    transactionRepository.find.mockResolvedValue([makeTransaction()]);

    // Act
    const result = await service.findAll('buyer-1');

    // Assert
    expect(transactionRepository.find).toHaveBeenCalledWith({
      where: [{ buyerId: 'buyer-1' }, { sellerId: 'buyer-1' }],
      relations: {
        product: true,
        buyer: true,
        seller: true,
      },
      order: { updatedAt: 'DESC' },
    });
    expect(result).toHaveLength(1);
  });

  describe('confirmPoint (HU-16 · acordar una entrega)', () => {
    const FUTURO = '2099-10-05T15:00:00Z';

    it('guarda punto y horario y cambia a AGREED_POINT (criterios 1 y 2)', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction());
      transactionRepository.findOne.mockResolvedValue(
        makeTransaction({
          status: TransactionStatus.AGREED_POINT,
          safePointId: 'sp-1',
          scheduledTime: new Date(FUTURO),
        }),
      );

      // Act
      const result = await service.confirmPoint('t1', 'buyer-1', {
        safePointId: 'sp-1',
        scheduledTime: FUTURO,
      });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          safePointId: 'sp-1',
          scheduledTime: new Date(FUTURO),
          status: TransactionStatus.AGREED_POINT,
        }),
      );
      expect(result.status).toBe(TransactionStatus.AGREED_POINT);
      expect(result.safePointId).toBe('sp-1');
    });

    it('bloquea la fila de la transaccion', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction());
      transactionRepository.findOne.mockResolvedValue(makeTransaction());

      // Act
      await service.confirmPoint('t1', 'seller-1', { safePointId: 'sp-1', scheduledTime: FUTURO });

      // Assert
      expect(manager.findOne).toHaveBeenCalledWith(Transaction, {
        where: { id: 't1' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('rechaza con 403 a una persona ajena (criterio 3)', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction());

      // Act / Assert
      await expect(
        service.confirmPoint('t1', 'otro', { safePointId: 'sp-1', scheduledTime: FUTURO }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it.each([
      ['una fecha invalida', 'fecha-mala'],
      ['un horario en el pasado', '2020-01-01T10:00:00Z'],
    ])('rechaza con 400 %s', async (_label, scheduledTime) => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction());

      // Act / Assert
      await expect(
        service.confirmPoint('t1', 'buyer-1', { safePointId: 'sp-1', scheduledTime }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it.each([
      TransactionStatus.AGREED_POINT,
      TransactionStatus.CANCELLED,
      TransactionStatus.COMPLETED,
    ])('rechaza con 409 si la transaccion esta %s', async (status) => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction({ status }));

      // Act / Assert
      await expect(
        service.confirmPoint('t1', 'buyer-1', { safePointId: 'sp-1', scheduledTime: FUTURO }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('404 si la transaccion no existe', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.confirmPoint('t1', 'buyer-1', { safePointId: 'sp-1', scheduledTime: FUTURO }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update (HU-17 · finalizar o cancelar)', () => {
    const agreed = (over: Partial<Transaction> = {}) =>
      makeTransaction({
        status: TransactionStatus.AGREED_POINT,
        safePointId: 'sp-1',
        scheduledTime: new Date('2026-10-05T15:00:00Z'),
        ...over,
      });

    /** Simula la recarga posterior al commit, con el producto ya actualizado. */
    const reloadAs = (status: TransactionStatus, productStatus: ProductStatus) =>
      transactionRepository.findOne.mockResolvedValue(
        makeTransaction({
          status,
          product: makeProduct({ status: productStatus }) as any,
        }),
      );

    it('completa: la transaccion queda COMPLETED y el producto pasa a SOLD (criterio 1)', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(agreed());
      reloadAs(TransactionStatus.COMPLETED, ProductStatus.SOLD);

      // Act
      const result = await service.update('t1', 'seller-1', {
        status: TransactionStatus.COMPLETED,
      });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 't1', status: TransactionStatus.COMPLETED }),
      );
      expect(productService.updateStatus).toHaveBeenCalledWith(
        'p1',
        ProductStatus.SOLD,
        manager,
      );
      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.product?.status).toBe(ProductStatus.SOLD);
      expect(productService.invalidateFeedCache).toHaveBeenCalledWith('granada');
    });

    it.each([
      ['PENDING', makeTransaction()],
      ['AGREED_POINT', agreed()],
    ])(
      'cancela desde %s: queda CANCELLED y libera el producto (criterio 2)',
      async (_from, transaction) => {
        // Arrange
        manager.findOne.mockResolvedValue(transaction);
        reloadAs(TransactionStatus.CANCELLED, ProductStatus.AVAILABLE);

        // Act
        const result = await service.update('t1', 'buyer-1', {
          status: TransactionStatus.CANCELLED,
        });

        // Assert
        expect(manager.save).toHaveBeenCalledWith(
          expect.objectContaining({ status: TransactionStatus.CANCELLED }),
        );
        expect(productService.updateStatus).toHaveBeenCalledWith(
          'p1',
          ProductStatus.AVAILABLE,
          manager,
        );
        expect(result.status).toBe(TransactionStatus.CANCELLED);
        expect(result.product?.status).toBe(ProductStatus.AVAILABLE);
      },
    );

    it.each([TransactionStatus.COMPLETED, TransactionStatus.CANCELLED])(
      'rechaza con 403 a quien no es comprador ni vendedor al pedir %s (criterio 3)',
      async (status) => {
        // Arrange
        manager.findOne.mockResolvedValue(agreed());

        // Act / Assert
        await expect(
          service.update('t1', 'intruso', { status }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        expect(manager.save).not.toHaveBeenCalled();
        expect(productService.updateStatus).not.toHaveBeenCalled();
      },
    );

    it('bloquea la fila de la transaccion dentro de una transaccion de base de datos', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(agreed());
      reloadAs(TransactionStatus.COMPLETED, ProductStatus.SOLD);

      // Act
      await service.update('t1', 'buyer-1', { status: TransactionStatus.COMPLETED });

      // Assert
      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(manager.findOne).toHaveBeenCalledWith(Transaction, {
        where: { id: 't1' },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('devuelve 404 si la transaccion no existe', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.update('t1', 'buyer-1', { status: TransactionStatus.CANCELLED }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it.each([
      ['completar sin punto acordado', makeTransaction(), TransactionStatus.COMPLETED],
      ['cancelar una completada', agreed({ status: TransactionStatus.COMPLETED }), TransactionStatus.CANCELLED],
      ['completar una cancelada', agreed({ status: TransactionStatus.CANCELLED }), TransactionStatus.COMPLETED],
      ['volver a PENDING', agreed(), TransactionStatus.PENDING],
    ])('rechaza con 409: %s', async (_label, transaction, status) => {
      // Arrange
      manager.findOne.mockResolvedValue(transaction);

      // Act / Assert
      await expect(
        service.update('t1', 'buyer-1', { status }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
      expect(productService.updateStatus).not.toHaveBeenCalled();
    });

    it('rechaza AGREED_POINT sin punto ni horario confirmados', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(makeTransaction());

      // Act / Assert
      await expect(
        service.update('t1', 'buyer-1', { status: TransactionStatus.AGREED_POINT }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('pedir el estado que ya tiene no toca el producto (repetir cancelar no libera una nueva reserva)', async () => {
      // Arrange
      manager.findOne.mockResolvedValue(
        makeTransaction({ status: TransactionStatus.CANCELLED }),
      );
      reloadAs(TransactionStatus.CANCELLED, ProductStatus.RESERVED);

      // Act
      const result = await service.update('t1', 'buyer-1', {
        status: TransactionStatus.CANCELLED,
      });

      // Assert
      expect(manager.save).not.toHaveBeenCalled();
      expect(productService.updateStatus).not.toHaveBeenCalled();
      expect(productService.invalidateFeedCache).not.toHaveBeenCalled();
      expect(result.status).toBe(TransactionStatus.CANCELLED);
    });

    it('si falla el cambio del producto, el error se propaga y no se devuelve la transaccion', async () => {
      // Arrange: la base de datos revierte la transacción al recibir el error.
      manager.findOne.mockResolvedValue(agreed());
      productService.updateStatus.mockRejectedValueOnce(
        new ConflictException('Transición de estado inválida'),
      );

      // Act / Assert
      await expect(
        service.update('t1', 'seller-1', { status: TransactionStatus.COMPLETED }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(transactionRepository.findOne).not.toHaveBeenCalled();
    });
  });
});
