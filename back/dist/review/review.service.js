"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const transaction_entity_1 = require("../transaction/entities/transaction.entity");
const transaction_status_enum_1 = require("../transaction/enums/transaction-status.enum");
const user_entity_1 = require("../user/entities/user.entity");
const review_dto_1 = require("./dto/review.dto");
const review_entity_1 = require("./entities/review.entity");
let ReviewService = class ReviewService {
    reviewRepository;
    transactionRepository;
    userRepository;
    constructor(reviewRepository, transactionRepository, userRepository) {
        this.reviewRepository = reviewRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }
    async create(reviewerId, createReviewDto) {
        const transaction = await this.transactionRepository.findOne({
            where: { id: createReviewDto.transactionId },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with id ${createReviewDto.transactionId} not found`);
        }
        this.assertParticipant(transaction, reviewerId);
        if (transaction.status !== transaction_status_enum_1.TransactionStatus.COMPLETED) {
            throw new common_1.ConflictException('Solo se pueden reseñar transacciones completadas');
        }
        const existing = await this.reviewRepository.findOne({
            where: {
                transactionId: transaction.id,
                reviewerId,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Ya existe una reseña de este usuario para esta transaccion');
        }
        const targetUserId = transaction.buyerId === reviewerId
            ? transaction.sellerId
            : transaction.buyerId;
        const review = this.reviewRepository.create({
            transactionId: transaction.id,
            reviewerId,
            targetUserId,
            rating: createReviewDto.rating,
            comment: createReviewDto.comment ?? null,
        });
        const saved = await this.reviewRepository.save(review);
        await this.refreshUserRating(targetUserId);
        return review_dto_1.ReviewDto.fromEntity(await this.findEntity(saved.id));
    }
    async findAll(userId) {
        const reviews = await this.reviewRepository.find({
            where: [{ reviewerId: userId }, { targetUserId: userId }],
            relations: {
                reviewer: true,
                targetUser: true,
            },
            order: { createdAt: 'DESC' },
        });
        return reviews.map((review) => review_dto_1.ReviewDto.fromEntity(review));
    }
    async findOne(id, userId) {
        const review = await this.findEntity(id);
        this.assertReviewParticipant(review, userId);
        return review_dto_1.ReviewDto.fromEntity(review);
    }
    async update(id, reviewerId, updateReviewDto) {
        const review = await this.findEntity(id);
        if (review.reviewerId !== reviewerId) {
            throw new common_1.ForbiddenException('Solo el autor puede modificar la reseña');
        }
        if (updateReviewDto.rating !== undefined) {
            review.rating = updateReviewDto.rating;
        }
        if (updateReviewDto.comment !== undefined) {
            review.comment = updateReviewDto.comment ?? null;
        }
        await this.reviewRepository.save(review);
        await this.refreshUserRating(review.targetUserId);
        return review_dto_1.ReviewDto.fromEntity(await this.findEntity(id));
    }
    async remove(id, reviewerId) {
        const review = await this.findEntity(id);
        if (review.reviewerId !== reviewerId) {
            throw new common_1.ForbiddenException('Solo el autor puede eliminar la reseña');
        }
        await this.reviewRepository.remove(review);
        await this.refreshUserRating(review.targetUserId);
    }
    async findEntity(id) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: {
                reviewer: true,
                targetUser: true,
            },
        });
        if (!review) {
            throw new common_1.NotFoundException(`Review with id ${id} not found`);
        }
        return review;
    }
    assertParticipant(transaction, userId) {
        if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
            throw new common_1.ForbiddenException('Solo los participantes pueden reseñar esta transaccion');
        }
    }
    assertReviewParticipant(review, userId) {
        if (review.reviewerId !== userId && review.targetUserId !== userId) {
            throw new common_1.ForbiddenException('No tienes permiso para ver esta reseña');
        }
    }
    async refreshUserRating(userId) {
        const result = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'average')
            .addSelect('COUNT(*)', 'count')
            .where('review.targetUserId = :userId', { userId })
            .getRawOne();
        await this.userRepository.update(userId, {
            ratingAverage: result?.average ? Number(result.average) : 0,
            reviewsCount: result?.count ? Number(result.count) : 0,
        });
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReviewService);
//# sourceMappingURL=review.service.js.map