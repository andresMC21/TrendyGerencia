import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';
import { User } from '../user/entities/user.entity';
import { Review } from './entities/review.entity';
import { ReviewService } from './review.service';

const makeUser = (over: Partial<User> = {}) =>
  ({ id: 'buyer-1', fullName: 'Buyer', ...over }) as User;

const makeTransaction = (over: Partial<Transaction> = {}) =>
  ({
    id: 'transaction-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    status: TransactionStatus.COMPLETED,
    ...over,
  }) as Transaction;

const makeReview = (over: Partial<Review> = {}) =>
  ({
    id: 'review-1',
    transactionId: 'transaction-1',
    reviewerId: 'buyer-1',
    reviewer: makeUser({ id: 'buyer-1', fullName: 'Buyer' }),
    targetUserId: 'seller-1',
    targetUser: makeUser({ id: 'seller-1', fullName: 'Seller' }),
    rating: 5,
    comment: 'Excelente',
    createdAt: new Date('2026-10-05T15:00:00Z'),
    ...over,
  }) as Review;

describe('ReviewService (HU-18 · calificar una transacción)', () => {
  let service: ReviewService;

  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  /** EntityManager de la transacción de base de datos. */
  const manager = {
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, value: object) => ({ ...value })),
    save: jest.fn(async (value: object) => ({ id: 'review-1', ...value })),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const dataSource = {
    transaction: jest.fn(async (work: (m: typeof manager) => unknown) =>
      work(manager),
    ),
  };
  const reviewRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  /** manager.findOne responde según la entidad pedida. */
  const givenRows = (rows: {
    transaction?: Transaction | null;
    review?: Review | null;
    existing?: Review | null;
  }) => {
    manager.findOne.mockImplementation(async (entity: unknown, opts: any) => {
      if (entity === Transaction) return rows.transaction ?? null;
      if (entity === User) return { id: opts.where.id };
      if (entity === Review) {
        return opts.where.id ? (rows.review ?? null) : (rows.existing ?? null);
      }
      return null;
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    queryBuilder.getRawOne.mockResolvedValue({ average: '4.5', count: '2' });
    reviewRepository.findOne.mockResolvedValue(makeReview());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: reviewRepository },
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    service = module.get(ReviewService);
  });

  describe('create', () => {
    it('criterio 1: guarda la calificacion para la otra persona y recalcula su promedio y conteo', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });

      // Act
      const result = await service.create('buyer-1', {
        transactionId: 'transaction-1',
        rating: 5,
        comment: '  Excelente  ',
      });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'transaction-1',
          reviewerId: 'buyer-1',
          targetUserId: 'seller-1',
          rating: 5,
          comment: 'Excelente',
        }),
      );
      expect(manager.update).toHaveBeenCalledWith(User, 'seller-1', {
        ratingAverage: 4.5,
        reviewsCount: 2,
      });
      expect(result).toMatchObject({ id: 'review-1', rating: 5 });
    });

    it('el vendedor califica al comprador', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });

      // Act
      await service.create('seller-1', { transactionId: 'transaction-1', rating: 4 });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ reviewerId: 'seller-1', targetUserId: 'buyer-1', comment: null }),
      );
      expect(manager.update).toHaveBeenCalledWith(User, 'buyer-1', expect.anything());
    });

    it('criterio 1: el comentario es opcional; vacio o solo espacios queda en null', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });

      // Act
      await service.create('buyer-1', { transactionId: 'transaction-1', rating: 3, comment: '   ' });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({ comment: null }));
    });

    it('bloquea la fila de la persona calificada mientras recalcula', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });

      // Act
      await service.create('buyer-1', { transactionId: 'transaction-1', rating: 5 });

      // Assert
      expect(manager.findOne).toHaveBeenCalledWith(User, {
        where: { id: 'seller-1' },
        select: { id: true },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it.each([
      TransactionStatus.PENDING,
      TransactionStatus.AGREED_POINT,
      TransactionStatus.CANCELLED,
    ])('criterio 1: 409 si la transaccion esta %s', async (status) => {
      // Arrange
      givenRows({ transaction: makeTransaction({ status }) });

      // Act / Assert
      await expect(
        service.create('buyer-1', { transactionId: 'transaction-1', rating: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('criterio 2: 409 si ya califico esa transaccion', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction(), existing: makeReview() });

      // Act / Assert
      await expect(
        service.create('buyer-1', { transactionId: 'transaction-1', rating: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('criterio 2: si dos envios llegan a la vez, la restriccion unica responde 409 y no 500', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });
      manager.save.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: '23505' }));

      // Act / Assert
      await expect(
        service.create('buyer-1', { transactionId: 'transaction-1', rating: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('403 a quien no participa y 404 si la transaccion no existe', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });

      // Act / Assert
      await expect(
        service.create('otro', { transactionId: 'transaction-1', rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      givenRows({ transaction: null });
      await expect(
        service.create('buyer-1', { transactionId: 'missing', rating: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propaga otros errores de la base de datos', async () => {
      // Arrange
      givenRows({ transaction: makeTransaction() });
      manager.save.mockRejectedValueOnce(new Error('db'));

      // Act / Assert
      await expect(
        service.create('buyer-1', { transactionId: 'transaction-1', rating: 5 }),
      ).rejects.toThrow('db');
    });
  });

  describe('findAll y findOne', () => {
    it('lista resenas escritas o recibidas por el usuario', async () => {
      // Arrange
      reviewRepository.find.mockResolvedValue([makeReview()]);

      // Act
      const result = await service.findAll('buyer-1');

      // Assert
      expect(reviewRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ reviewerId: 'buyer-1' }, { targetUserId: 'buyer-1' }],
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('con transactionId devuelve solo las de esa transaccion', async () => {
      // Arrange
      reviewRepository.find.mockResolvedValue([]);

      // Act
      await service.findAll('buyer-1', 'transaction-1');

      // Assert
      expect(reviewRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { reviewerId: 'buyer-1', transactionId: 'transaction-1' },
            { targetUserId: 'buyer-1', transactionId: 'transaction-1' },
          ],
        }),
      );
    });

    it('findOne solo permite ver resenas propias o recibidas', async () => {
      // Act / Assert
      await expect(service.findOne('review-1', 'otro')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.findOne('review-1', 'seller-1')).resolves.toMatchObject({ id: 'review-1' });
    });

    it('findOne responde 404 si no existe', async () => {
      // Arrange
      reviewRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne('x', 'buyer-1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('criterio 3: el autor edita y se recalcula el promedio de la persona calificada', async () => {
      // Arrange
      givenRows({ review: makeReview() });

      // Act
      await service.update('review-1', 'buyer-1', { rating: 2, comment: ' Llego tarde ' });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ rating: 2, comment: 'Llego tarde' }),
      );
      expect(manager.update).toHaveBeenCalledWith(User, 'seller-1', {
        ratingAverage: 4.5,
        reviewsCount: 2,
      });
    });

    it('permite quitar el comentario con null', async () => {
      // Arrange
      givenRows({ review: makeReview() });

      // Act
      await service.update('review-1', 'buyer-1', { comment: null });

      // Assert
      expect(manager.save).toHaveBeenCalledWith(expect.objectContaining({ rating: 5, comment: null }));
    });

    it('bloquea la resena y a la persona calificada', async () => {
      // Arrange
      givenRows({ review: makeReview() });

      // Act
      await service.update('review-1', 'buyer-1', { rating: 4 });

      // Assert
      expect(manager.findOne).toHaveBeenCalledWith(Review, {
        where: { id: 'review-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(manager.findOne).toHaveBeenCalledWith(User, expect.objectContaining({ where: { id: 'seller-1' } }));
    });

    it('400 si no envia nada que cambiar', async () => {
      // Act / Assert
      await expect(service.update('review-1', 'buyer-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('403 si no es el autor y 404 si no existe', async () => {
      // Arrange
      givenRows({ review: makeReview() });

      // Act / Assert
      await expect(service.update('review-1', 'seller-1', { rating: 1 })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      givenRows({ review: null });
      await expect(service.update('x', 'buyer-1', { rating: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('criterio 3: el autor borra y se recalcula el promedio (0 si ya no quedan resenas)', async () => {
      // Arrange
      givenRows({ review: makeReview() });
      queryBuilder.getRawOne.mockResolvedValue({ average: null, count: '0' });

      // Act
      await service.remove('review-1', 'buyer-1');

      // Assert
      expect(manager.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'review-1' }));
      expect(manager.update).toHaveBeenCalledWith(User, 'seller-1', {
        ratingAverage: 0,
        reviewsCount: 0,
      });
    });

    it('403 si no es el autor', async () => {
      // Arrange
      givenRows({ review: makeReview() });

      // Act / Assert
      await expect(service.remove('review-1', 'seller-1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(manager.remove).not.toHaveBeenCalled();
    });
  });
});
