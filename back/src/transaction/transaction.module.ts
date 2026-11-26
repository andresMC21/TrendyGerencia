import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from '../product/product.module';
import { UserModule } from '../user/user.module';
import { TransactionMessage } from './entities/transaction-message.entity';
import { Transaction } from './entities/transaction.entity';
import { TransactionMessageController } from './transaction-message.controller';
import { TransactionMessageService } from './transaction-message.service';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, TransactionMessage]), ProductModule, UserModule],
  controllers: [TransactionController, TransactionMessageController],
  providers: [TransactionService, TransactionMessageService],
})
export class TransactionModule {}
