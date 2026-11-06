import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class UpdateTransactionDto {
  @ApiProperty({
    type: String,
    enum: TransactionStatus,
    example: TransactionStatus.CANCELLED,
    description:
      'Estado solicitado: CANCELLED. COMPLETED no se pide aquí: se alcanza cuando vendedor y comprador confirman con POST /transactions/:id/confirm-exchange. AGREED_POINT tampoco: se alcanza cuando la otra persona acepta la propuesta de encuentro.',
  })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}
