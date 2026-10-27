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
exports.Transaction = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../../product/entities/product.entity");
const user_entity_1 = require("../../user/entities/user.entity");
const transaction_status_enum_1 = require("../enums/transaction-status.enum");
let Transaction = class Transaction {
    id;
    productId;
    product;
    buyerId;
    buyer;
    sellerId;
    seller;
    status;
    safePointId;
    scheduledTime;
    createdAt;
    updatedAt;
    message;
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Transaction.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], Transaction.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Transaction.prototype, "buyerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'buyerId' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "buyer", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'varchar' }),
    __metadata("design:type", String)
], Transaction.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'sellerId' }),
    __metadata("design:type", user_entity_1.User)
], Transaction.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'text', default: transaction_status_enum_1.TransactionStatus.PENDING }),
    __metadata("design:type", String)
], Transaction.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "safePointId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "scheduledTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Transaction.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Transaction.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true
    }),
    __metadata("design:type", Object)
], Transaction.prototype, "message", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)()
], Transaction);
//# sourceMappingURL=transaction.entity.js.map