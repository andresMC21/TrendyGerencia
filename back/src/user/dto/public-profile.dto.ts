import { ApiProperty } from '@nestjs/swagger';
import { Review } from '../../review/entities/review.entity';
import { User } from '../entities/user.entity';
import { VerificationStatus } from '../enums/verification-status';

/** HU-07 · Una reseña recibida, tal como la ven otras personas. */
export class PublicReviewDto {
  @ApiProperty({ type: Number, minimum: 1, maximum: 5, example: 5 })
  rating: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Comunicación clara y producto tal como estaba publicado.',
  })
  comment: string | null;

  @ApiProperty({
    type: String,
    example: 'Carlos Ruiz',
    description: 'Nombre de quien dejó la reseña.',
  })
  reviewerName: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  static fromEntity(review: Review): PublicReviewDto {
    const dto = new PublicReviewDto();
    dto.rating = review.rating;
    dto.comment = review.comment ?? null;
    dto.reviewerName = review.reviewer?.fullName ?? 'Usuario de Trendy';
    dto.createdAt = review.createdAt;
    return dto;
  }
}

/**
 * HU-07 · Perfil de otra persona: lo necesario para decidir si hacer un
 * intercambio con ella. No incluye correo, contraseña, rol, estado de la
 * cuenta ni ningún dato de autenticación (criterio 3).
 */
export class PublicProfileDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'Ana Gomez' })
  fullName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Presentación que escribió la persona, o null.',
  })
  info: string | null;

  @ApiProperty({ type: String, format: 'uri', nullable: true })
  photoUrl: string | null;

  @ApiProperty({
    type: String,
    enum: VerificationStatus,
    description: 'Estado de la verificación de identidad.',
  })
  verificationStatus: VerificationStatus;

  @ApiProperty({
    type: Number,
    example: 4.5,
    description:
      'Promedio de calificaciones recibidas (1 a 5); 0 si aún no tiene reseñas.',
  })
  ratingAverage: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Cantidad de reseñas recibidas.',
  })
  reviewsCount: number;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Productos que tiene publicados y disponibles.',
  })
  availableProductsCount: number;

  @ApiProperty({
    type: [PublicReviewDto],
    description:
      'Hasta 5 reseñas recibidas, de la más reciente a la más antigua.',
  })
  recentReviews: PublicReviewDto[];

  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Desde cuándo está en Trendy.',
  })
  memberSince: Date;

  static from(
    user: User,
    reviews: Review[],
    availableProductsCount: number,
  ): PublicProfileDto {
    const dto = new PublicProfileDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.info = user.info ?? null;
    dto.photoUrl = user.photoUrl ?? null;
    dto.verificationStatus = user.verificationStatus;
    dto.ratingAverage = Number(user.ratingAverage ?? 0);
    dto.reviewsCount = user.reviewsCount ?? 0;
    dto.availableProductsCount = availableProductsCount;
    dto.recentReviews = reviews.map((review) =>
      PublicReviewDto.fromEntity(review),
    );
    dto.memberSince = user.createdAt;
    return dto;
  }
}
