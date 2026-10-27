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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const product_dto_1 = require("../../product/dto/product.dto");
const transaction_status_enum_1 = require("../enums/transaction-status.enum");
const transaction_user_dto_1 = require("./transaction-user.dto");
class TransactionDto {
    id;
    productId;
    buyerId;
    sellerId;
    status;
    safePointId;
    scheduledTime;
    product;
    buyer;
    seller;
    createdAt;
    updatedAt;
    message;
    static fromEntity(transaction) {
        const dto = new TransactionDto();
        dto.id = transaction.id;
        dto.productId = transaction.productId;
        dto.buyerId = transaction.buyerId;
        dto.sellerId = transaction.sellerId;
        dto.status = transaction.status;
        dto.safePointId = transaction.safePointId;
        dto.scheduledTime = transaction.scheduledTime;
        if (transaction.product)
            dto.product = product_dto_1.ProductDto.fromEntity(transaction.product);
        dto.buyer = transaction_user_dto_1.TransactionUserDto.fromEntity(transaction.buyer);
        dto.seller = transaction_user_dto_1.TransactionUserDto.fromEntity(transaction.seller);
        dto.createdAt = transaction.createdAt;
        dto.updatedAt = transaction.updatedAt;
        dto.message = transaction.message;
        return dto;
    }
}
exports.TransactionDto = TransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único de la transacción.',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador del producto asociado.',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador del comprador.',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "buyerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador del vendedor.',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: transaction_status_enum_1.TransactionStatus,
        example: transaction_status_enum_1.TransactionStatus.PENDING,
        description: 'Estado actual de la transacción.',
    }),
    __metadata("design:type", String)
], TransactionDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        example: 'sp-1',
        description: 'Identificador del punto de encuentro o null si no se definió.',
    }),
    __metadata("design:type", Object)
], TransactionDto.prototype, "safePointId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        nullable: true,
        example: '2030-10-05T15:00:00Z',
        description: 'Fecha y hora programada para el encuentro o null si no se definió.',
    }),
    __metadata("design:type", Object)
], TransactionDto.prototype, "scheduledTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: product_dto_1.ProductDto,
        description: 'Producto relacionado; se incluye cuando la operación carga la relación.',
    }),
    __metadata("design:type", product_dto_1.ProductDto)
], TransactionDto.prototype, "product", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: transaction_user_dto_1.TransactionUserDto,
        description: 'Perfil público del comprador; se incluye cuando la operación carga la relación.',
    }),
    __metadata("design:type", transaction_user_dto_1.TransactionUserDto)
], TransactionDto.prototype, "buyer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: transaction_user_dto_1.TransactionUserDto,
        description: 'Perfil público del vendedor; se incluye cuando la operación carga la relación.',
    }),
    __metadata("design:type", transaction_user_dto_1.TransactionUserDto)
], TransactionDto.prototype, "seller", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de creación de la transacción.',
    }),
    __metadata("design:type", Date)
], TransactionDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de la última actualización.',
    }),
    __metadata("design:type", Date)
], TransactionDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        example: 'Me interesa, ¿sigue disponible?',
        description: 'Mensaje opcional enviado por el comprador o null si no envió.',
    }),
    __metadata("design:type", Object)
], TransactionDto.prototype, "message", void 0);
//# sourceMappingURL=transaction.dto.js.map