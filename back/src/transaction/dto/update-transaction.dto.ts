import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTransactionDto {
  @ApiProperty({
    type: String,
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    description:
      'Estado solicitado: COMPLETED o CANCELLED. La transición debe estar permitida desde el estado actual. AGREED_POINT no se pide aquí: se alcanza cuando la otra persona acepta la propuesta de encuentro.',
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
