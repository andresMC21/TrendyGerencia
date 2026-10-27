import { Product } from '../../product/entities/product.entity';
import { User } from '../../user/entities/user.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
export declare class Transaction {
    id: string;
    productId: string;
    product: Product;
    buyerId: string;
    buyer: User;
    sellerId: string;
    seller: User;
    status: TransactionStatus;
    safePointId: string | null;
    scheduledTime: Date | null;
    createdAt: Date;
    updatedAt: Date;
    message: string | null;
}
