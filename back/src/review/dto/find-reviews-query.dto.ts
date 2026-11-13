import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** HU-18 · Filtro opcional para ver solo las reseñas de una transacción. */
export class FindReviewsQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description:
      'Si se envía, devuelve solo las reseñas de esa transacción (escritas o recibidas por el usuario).',
  })
  @IsOptional()
  @IsUUID()
  transactionId?: string;
}
