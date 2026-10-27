import { Repository } from 'typeorm';
import { ProductService } from '../product/product.service';
import { ConfirmPointDto } from './dto/confirm-point.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
export declare class TransactionService {
    private readonly transactionRepository;
    private readonly productService;
    constructor(transactionRepository: Repository<Transaction>, productService: ProductService);
    create(buyerId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionDto>;
    findAll(userId: string): Promise<TransactionDto[]>;
    findOne(id: string, userId: string): Promise<TransactionDto>;
    update(id: string, userId: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionDto>;
    confirmPoint(id: string, userId: string, confirmPointDto: ConfirmPointDto): Promise<TransactionDto>;
    private findEntity;
    private assertParticipant;
    private assertTransition;
}
