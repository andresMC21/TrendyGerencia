"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = __importDefault(require("../database/data-source"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const product_entity_1 = require("../product/entities/product.entity");
const geo_interface_1 = require("../product/interfaces/geo.interface");
const review_entity_1 = require("../review/entities/review.entity");
const transaction_entity_1 = require("../transaction/entities/transaction.entity");
const user_entity_1 = require("../user/entities/user.entity");
const seed_data_1 = require("./seed-data");
const BCRYPT_ROUNDS = 10;
async function seed() {
    await data_source_1.default.initialize();
    try {
        await data_source_1.default.transaction(async (manager) => {
            const userRepository = manager.getRepository(user_entity_1.User);
            const productRepository = manager.getRepository(product_entity_1.Product);
            const transactionRepository = manager.getRepository(transaction_entity_1.Transaction);
            const reviewRepository = manager.getRepository(review_entity_1.Review);
            for (const seedUser of seed_data_1.seedUsers) {
                const existing = await userRepository.findOne({
                    where: { id: seedUser.id },
                    select: { id: true, password: true },
                });
                const password = existing?.password ??
                    (await bcrypt_1.default.hash(seedUser.password, BCRYPT_ROUNDS));
                await userRepository.save(userRepository.create({
                    ...seedUser,
                    role: [...seedUser.role],
                    password,
                    isActive: true,
                    ratingAverage: 0,
                    reviewsCount: 0,
                }));
            }
            for (const seedProduct of seed_data_1.seedProducts) {
                const { location, ...product } = seedProduct;
                await productRepository.save(productRepository.create({
                    ...product,
                    location: (0, geo_interface_1.toGeoJson)(location),
                    viewsCount: 0,
                }));
            }
            for (const seedTransaction of seed_data_1.seedTransactions) {
                await transactionRepository.save(transactionRepository.create({
                    ...seedTransaction,
                    scheduledTime: new Date(seedTransaction.scheduledTime),
                }));
            }
            for (const seedReview of seed_data_1.seedReviews) {
                const { reviewerId, targetUserId, ...review } = seedReview;
                await reviewRepository.save(reviewRepository.create({
                    ...review,
                    reviewerId,
                    targetUserId,
                    reviewer: { id: reviewerId },
                    targetUser: { id: targetUserId },
                }));
            }
            for (const seedUser of seed_data_1.seedUsers) {
                const result = await reviewRepository
                    .createQueryBuilder('review')
                    .select('AVG(review.rating)', 'average')
                    .addSelect('COUNT(*)', 'count')
                    .where('review.targetUserId = :userId', { userId: seedUser.id })
                    .getRawOne();
                await userRepository.update(seedUser.id, {
                    ratingAverage: result?.average ? Number(result.average) : 0,
                    reviewsCount: result?.count ? Number(result.count) : 0,
                });
            }
        });
    }
    finally {
        await data_source_1.default.destroy();
    }
}
seed()
    .then(() => {
    console.log('Seed data loaded successfully');
})
    .catch((error) => {
    console.error('Seed failed', error);
    process.exitCode = 1;
});
//# sourceMappingURL=seed.js.map