import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTransactionMessageDto, TransactionMessageDto } from './dto/transaction-message.dto';
import { TransactionMessage } from './entities/transaction-message.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionStatus } from './enums/transaction-status.enum';

/** TRD-25 · Chat de la transacción: solo comprador y vendedor lo leen y escriben. */
@Injectable()
export class TransactionMessageService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionMessage)
    private readonly messageRepository: Repository<TransactionMessage>,
  ) {}

  async list(transactionId: string, userId: string): Promise<TransactionMessageDto[]> {
    await this.findForParticipant(transactionId, userId);
    const messages = await this.messageRepository.find({
      where: { transactionId },
      order: { createdAt: 'ASC' },
      take: 500,
    });
    return messages.map((m) => TransactionMessageDto.fromEntity(m));
  }

  async send(
    transactionId: string,
    userId: string,
    dto: CreateTransactionMessageDto,
  ): Promise<TransactionMessageDto> {
    const transaction = await this.findForParticipant(transactionId, userId);
    if (transaction.status === TransactionStatus.CANCELLED) {
      throw new ConflictException('La transacción fue cancelada y ya no recibe mensajes');
    }
    const saved = await this.messageRepository.save(
      this.messageRepository.create({ transactionId, senderId: userId, body: dto.body }),
    );
    return TransactionMessageDto.fromEntity(saved);
  }

  private async findForParticipant(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({ where: { id } });
    if (!transaction) throw new NotFoundException(`Transaction with id ${id} not found`);
    if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
      throw new ForbiddenException('Solo los participantes pueden ver o escribir en este chat');
    }
    return transaction;
  }
}
