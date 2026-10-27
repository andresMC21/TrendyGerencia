"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_status_enum_1 = require("../product/enums/product-status.enum");
const product_service_1 = require("../product/product.service");
const transaction_dto_1 = require("./dto/transaction.dto");
const transaction_entity_1 = require("./entities/transaction.entity");
const transaction_status_enum_1 = require("./enums/transaction-status.enum");
const ACTIVE_TRANSACTION_STATUSES = [
    transaction_status_enum_1.TransactionStatus.PENDING,
    transaction_status_enum_1.TransactionStatus.AGREED_POINT,
];
const ALLOWED_STATUS_TRANSITIONS = {
    [transaction_status_enum_1.TransactionStatus.PENDING]: [
        transaction_status_enum_1.TransactionStatus.AGREED_POINT,
        transaction_status_enum_1.TransactionStatus.CANCELLED,
    ],
    [transaction_status_enum_1.TransactionStatus.AGREED_POINT]: [
        transaction_status_enum_1.TransactionStatus.COMPLETED,
        transaction_status_enum_1.TransactionStatus.CANCELLED,
    ],
    [transaction_status_enum_1.TransactionStatus.COMPLETED]: [],
    [transaction_status_enum_1.TransactionStatus.CANCELLED]: [],
};
let TransactionService = class TransactionService {
    transactionRepository;
    productService;
    constructor(transactionRepository, productService) {
        this.transactionRepository = transactionRepository;
        this.productService = productService;
    }
    async create(buyerId, createTransactionDto) {
        const product = await this.productService.findById(createTransactionDto.productId);
        if (product.sellerId === buyerId) {
            throw new common_1.ForbiddenException('No puedes iniciar una transaccion sobre tu propio producto');
        }
        if (product.status !== product_status_enum_1.ProductStatus.AVAILABLE) {
            throw new common_1.ConflictException(`El producto no esta disponible: ${product.status}`);
        }
        const active = await this.transactionRepository.findOne({
            where: {
                productId: product.id,
                status: (0, typeorm_2.In)(ACTIVE_TRANSACTION_STATUSES),
            },
        });
        if (active) {
            throw new common_1.ConflictException('El producto ya tiene una transaccion activa');
        }
        const transaction = this.transactionRepository.create({
            productId: product.id,
            buyerId,
            sellerId: product.sellerId,
            status: transaction_status_enum_1.TransactionStatus.PENDING,
            message: createTransactionDto.message ?? null
        });
        await this.productService.updateStatus(product.id, product_status_enum_1.ProductStatus.RESERVED);
        try {
            const saved = await this.transactionRepository.save(transaction);
            saved.product = product;
            return transaction_dto_1.TransactionDto.fromEntity(saved);
        }
        catch (error) {
            await this.productService.updateStatus(product.id, product_status_enum_1.ProductStatus.AVAILABLE);
            throw error;
        }
    }
    async findAll(userId) {
        const transactions = await this.transactionRepository.find({
            where: [{ buyerId: userId }, { sellerId: userId }],
            relations: {
                product: true,
                buyer: true,
                seller: true,
            },
            order: { updatedAt: 'DESC' },
        });
        return transactions.map((transaction) => transaction_dto_1.TransactionDto.fromEntity(transaction));
    }
    async findOne(id, userId) {
        const transaction = await this.findEntity(id);
        this.assertParticipant(transaction, userId);
        return transaction_dto_1.TransactionDto.fromEntity(transaction);
    }
    async update(id, userId, updateTransactionDto) {
        const transaction = await this.findEntity(id);
        this.assertParticipant(transaction, userId);
        this.assertTransition(transaction.status, updateTransactionDto.status);
        if (updateTransactionDto.status === transaction_status_enum_1.TransactionStatus.AGREED_POINT &&
            (!transaction.safePointId || !transaction.scheduledTime)) {
            throw new common_1.BadRequestException('Confirma un punto seguro antes de pasar a AGREED_POINT');
        }
        transaction.status = updateTransactionDto.status;
        const saved = await this.transactionRepository.save(transaction);
        if (saved.status === transaction_status_enum_1.TransactionStatus.COMPLETED) {
            await this.productService.updateStatus(saved.productId, product_status_enum_1.ProductStatus.SOLD);
        }
        if (saved.status === transaction_status_enum_1.TransactionStatus.CANCELLED) {
            await this.productService.updateStatus(saved.productId, product_status_enum_1.ProductStatus.AVAILABLE);
        }
        return transaction_dto_1.TransactionDto.fromEntity(saved);
    }
    async confirmPoint(id, userId, confirmPointDto) {
        const transaction = await this.findEntity(id);
        this.assertParticipant(transaction, userId);
        if (transaction.status !== transaction_status_enum_1.TransactionStatus.PENDING) {
            throw new common_1.ConflictException('Solo transacciones PENDING pueden confirmar punto');
        }
        const scheduledTime = new Date(confirmPointDto.scheduledTime);
        if (Number.isNaN(scheduledTime.getTime())) {
            throw new common_1.BadRequestException('scheduledTime debe ser una fecha ISO valida');
        }
        transaction.safePointId = confirmPointDto.safePointId;
        transaction.scheduledTime = scheduledTime;
        transaction.status = transaction_status_enum_1.TransactionStatus.AGREED_POINT;
        const saved = await this.transactionRepository.save(transaction);
        return transaction_dto_1.TransactionDto.fromEntity(saved);
    }
    async findEntity(id) {
        const transaction = await this.transactionRepository.findOne({
            where: { id },
            relations: {
                product: true,
                buyer: true,
                seller: true,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException(`Transaction with id ${id} not found`);
        }
        return transaction;
    }
    assertParticipant(transaction, userId) {
        if (transaction.buyerId !== userId && transaction.sellerId !== userId) {
            throw new common_1.ForbiddenException('Solo los participantes pueden ver o modificar esta transaccion');
        }
    }
    assertTransition(from, to) {
        if (from === to)
            return;
        if (!ALLOWED_STATUS_TRANSITIONS[from].includes(to)) {
            throw new common_1.ConflictException(`Transicion de estado invalida: ${from} -> ${to}`);
        }
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(transaction_entity_1.Transaction)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        product_service_1.ProductService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map