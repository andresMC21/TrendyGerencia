import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TransactionMessage } from '../entities/transaction-message.entity';

export class CreateTransactionMessageDto {
  @ApiProperty({ type: String, maxLength: 500, example: '¿Te sirve el jueves a las 4?' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El mensaje no puede estar vacío' })
  @MaxLength(500)
  body: string;
}

export class TransactionMessageDto {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  transactionId: string;

  @ApiProperty({ type: String, format: 'uuid', description: 'Quién escribió el mensaje.' })
  senderId: string;

  @ApiProperty({ type: String, maxLength: 500 })
  body: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  static fromEntity(m: TransactionMessage): TransactionMessageDto {
    return { id: m.id, transactionId: m.transactionId, senderId: m.senderId, body: m.body, createdAt: m.createdAt };
  }
}
