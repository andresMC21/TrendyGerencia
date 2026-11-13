import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { TransactionStatus } from '../transaction/enums/transaction-status.enum';
import { User } from '../user/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';

const DUPLICATE_REVIEW_MESSAGE =
  'Ya calificaste esta transacción: puedes editar o borrar tu reseña';

/**
 * HU-18 · Calificar una transacción.
 *
 * - Solo los participantes de una transacción COMPLETED pueden calificar, y
 *   siempre califican a la otra persona (criterio 1).
 * - Cada participante deja como máximo una reseña por transacción; lo
 *   respalda la restricción única (transactionId, reviewerId) y un 409 claro
 *   también cuando dos envíos llegan a la vez (criterio 2).
 * - Crear, editar o borrar recalcula ratingAverage y reviewsCount de la
 *   persona calificada en la misma transacción de base de datos, con su fila
 *   bloqueada: los cambios simultáneos sobre la misma persona se atienden de a
 *   uno y el promedio siempre coincide con sus reseñas (criterio 3).
 */
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    reviewerId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewDto> {
    let savedId: string;
    try {
      savedId = await this.dataSource.transaction(async (manager) => {
        const transaction = await manager.findOne(Transaction, {
          where: { id: createReviewDto.transactionId },
        });
        if (!transaction) {
          throw new NotFoundException(
            `Transaction with id ${createReviewDto.transactionId} not found`,
          );
        }
        this.assertParticipant(transaction, reviewerId);
        if (transaction.status !== TransactionStatus.COMPLETED) {
          throw new ConflictException(
            'Solo se pueden calificar transacciones completadas',
          );
        }

        const targetUserId =
          transaction.buyerId === reviewerId
            ? transaction.sellerId
            : transaction.buyerId;
        await this.lockUser(manager, targetUserId);

        const existing = await manager.findOne(Review, {
          where: { transactionId: transaction.id, reviewerId },
        });
        if (existing) throw new ConflictException(DUPLICATE_REVIEW_MESSAGE);

        const saved = await manager.save(
          manager.create(Review, {
            transactionId: transaction.id,
            reviewerId,
            targetUserId,
            rating: createReviewDto.rating,
            comment: this.normalizeComment(createReviewDto.comment),
          }),
        );
        await this.refreshUserRating(manager, targetUserId);
        return saved.id;
      });
    } catch (error) {
      // Dos envíos simultáneos: la restricción única rechaza el segundo.
      if ((error as { code?: string })?.code === '23505') {
        throw new ConflictException(DUPLICATE_REVIEW_MESSAGE);
      }
      throw error;
    }

    return ReviewDto.fromEntity(await this.findEntity(savedId));
  }

  /** Reseñas escritas o recibidas; con transactionId, solo las de esa transacción. */
  async findAll(userId: string, transactionId?: string): Promise<ReviewDto[]> {
    const own = [{ reviewerId: userId }, { targetUserId: userId }];
    const reviews = await this.reviewRepository.find({
      where: transactionId
        ? own.map((where) => ({ ...where, transactionId }))
        : own,
      relations: {
        reviewer: true,
        targetUser: true,
      },
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ReviewDto.fromEntity(review));
  }

  async findOne(id: string, userId: string): Promise<ReviewDto> {
    const review = await this.findEntity(id);
    this.assertReviewParticipant(review, userId);
    return ReviewDto.fromEntity(review);
  }

  async update(
    id: string,
    reviewerId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    if (
      updateReviewDto.rating === undefined &&
      updateReviewDto.comment === undefined
    ) {
      throw new BadRequestException('Envía la calificación o el comentario');
    }

    await this.dataSource.transaction(async (manager) => {
      const review = await this.findOwnForChange(manager, id, reviewerId);
      await this.lockUser(manager, review.targetUserId);

      if (updateReviewDto.rating !== undefined) {
        review.rating = updateReviewDto.rating;
      }
      if (updateReviewDto.comment !== undefined) {
        review.comment = this.normalizeComment(updateReviewDto.comment);
      }

      await manager.save(review);
      await this.refreshUserRating(manager, review.targetUserId);
    });

    return ReviewDto.fromEntity(await this.findEntity(id));
  }

  async remove(id: string, reviewerId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const review = await this.findOwnForChange(manager, id, reviewerId);
      await this.lockUser(manager, review.targetUserId);

      await manager.remove(review);
      await this.refreshUserRating(manager, review.targetUserId);
    });
  }

  private async findOwnForChange(
    manager: EntityManager,
    id: string,
    reviewerId: string,
  ): Promise<Review> {
    const review = await manager.findOne(Review, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }
    if (review.reviewerId !== reviewerId) {
      throw new ForbiddenException('Solo el autor puede modificar su reseña');
    }
    return review;
  }

  private async findEntity(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        reviewer: true,
        targetUser: true,
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with id ${id} not found`);
    }

    return review;
  }

  private assertParticipant(transaction: Transaction, userId: string): void {
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException(
        'Solo los participantes pueden calificar esta transaccion',
      );
    }
  }

  private assertReviewParticipant(review: Review, userId: string): void {
    if (review.reviewerId !== userId && review.targetUserId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta reseña');
    }
  }

  /** Bloquea la fila de la persona calificada mientras se recalcula su promedio. */
  private async lockUser(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    await manager.findOne(User, {
      where: { id: userId },
      select: { id: true },
      lock: { mode: 'pessimistic_write' },
    });
  }

  /** Un comentario vacío o solo con espacios se guarda como null. */
  private normalizeComment(comment: string | null | undefined): string | null {
    const trimmed = comment?.trim();
    return trimmed ? trimmed : null;
  }

  private async refreshUserRating(
    manager: EntityManager,
    userId: string,
  ): Promise<void> {
    const result = await manager
      .createQueryBuilder(Review, 'review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('review.targetUserId = :userId', { userId })
      .getRawOne<{ average: string | null; count: string }>();

    await manager.update(User, userId, {
      ratingAverage: result?.average ? Number(result.average) : 0,
      reviewsCount: result?.count ? Number(result.count) : 0,
    });
  }
}
