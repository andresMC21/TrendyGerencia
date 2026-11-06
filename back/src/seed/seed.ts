import dataSource from '../database/data-source';
import bcrypt from 'bcrypt';
import { Product } from '../product/entities/product.entity';
import { toGeoJson } from '../product/interfaces/geo.interface';
import { Review } from '../review/entities/review.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from '../user/entities/user.entity';
import {
  seedProducts,
  seedReviews,
  seedTransactions,
  seedUsers,
} from './seed-data';

const BCRYPT_ROUNDS = 10;

async function seed(): Promise<void> {
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const productRepository = manager.getRepository(Product);
      const transactionRepository = manager.getRepository(Transaction);
      const reviewRepository = manager.getRepository(Review);

      for (const seedUser of seedUsers) {
        const existing = await userRepository.findOne({
          where: { id: seedUser.id },
          select: { id: true, password: true },
        });
        const password =
          existing?.password ??
          (await bcrypt.hash(seedUser.password, BCRYPT_ROUNDS));
        await userRepository.save(
          userRepository.create({
            ...seedUser,
            role: [...seedUser.role],
            password,
            isActive: true,
            ratingAverage: 0,
            reviewsCount: 0,
          }),
        );
      }

      for (const seedProduct of seedProducts) {
        const { location, ...product } = seedProduct;
        // El seed corre en cada arranque del despliegue: un producto que ya existe
        // conserva su estado (reservado, vendido, retirado) y sus visitas, para no
        // dejar una compra en curso con el producto otra vez disponible.
        const existing = await productRepository.findOne({
          where: { id: product.id },
          select: { id: true, status: true, viewsCount: true },
        });
        await productRepository.save(
          productRepository.create({
            ...product,
            status: existing?.status ?? product.status,
            location: toGeoJson(location),
            viewsCount: existing?.viewsCount ?? 0,
          }),
        );
      }

      for (const seedTransaction of seedTransactions) {
        await transactionRepository.save(
          transactionRepository.create({
            ...seedTransaction,
            scheduledTime: new Date(seedTransaction.scheduledTime),
            agreedAt: new Date(seedTransaction.agreedAt),
            sellerConfirmedAt: new Date(seedTransaction.sellerConfirmedAt),
            buyerConfirmedAt: new Date(seedTransaction.buyerConfirmedAt),
          }),
        );
      }

      for (const seedReview of seedReviews) {
        const { reviewerId, targetUserId, ...review } = seedReview;
        await reviewRepository.save(
          reviewRepository.create({
            ...review,
            reviewerId,
            targetUserId,
            reviewer: { id: reviewerId } as User,
            targetUser: { id: targetUserId } as User,
          }),
        );
      }

      for (const seedUser of seedUsers) {
        const result = await reviewRepository
          .createQueryBuilder('review')
          .select('AVG(review.rating)', 'average')
          .addSelect('COUNT(*)', 'count')
          .where('review.targetUserId = :userId', { userId: seedUser.id })
          .getRawOne<{ average: string | null; count: string }>();

        await userRepository.update(seedUser.id, {
          ratingAverage: result?.average ? Number(result.average) : 0,
          reviewsCount: result?.count ? Number(result.count) : 0,
        });
      }
    });
  } finally {
    await dataSource.destroy();
  }
}

seed()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('Seed data loaded successfully');
  })
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed', error);
    process.exitCode = 1;
  });
