import { User } from '../user/entities/user.entity';
import { ConfirmPointDto } from './dto/confirm-point.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionService } from './transaction.service';
export declare class TransactionController {
    private readonly transactionService;
    constructor(transactionService: TransactionService);
    create(user: User, createTransactionDto: CreateTransactionDto): Promise<TransactionDto>;
    findAll(user: User): Promise<TransactionDto[]>;
    findOne(id: string, user: User): Promise<TransactionDto>;
    updateStatus(id: string, user: User, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDto>;
    confirmPoint(id: string, user: User, confirmPointDto: ConfirmPointDto): Promise<TransactionDto>;
}
