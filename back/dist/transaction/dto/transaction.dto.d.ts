import { ProductDto } from '../../product/dto/product.dto';
import { Transaction } from '../entities/transaction.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
import { TransactionUserDto } from './transaction-user.dto';
export declare class TransactionDto {
    id: string;
    productId: string;
    buyerId: string;
    sellerId: string;
    status: TransactionStatus;
    safePointId: string | null;
    scheduledTime: Date | null;
    product?: ProductDto;
    buyer?: TransactionUserDto;
    seller?: TransactionUserDto;
    createdAt: Date;
    updatedAt: Date;
    message: string | null;
    static fromEntity(transaction: Transaction): TransactionDto;
}
