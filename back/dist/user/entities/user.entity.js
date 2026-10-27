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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const verification_status_1 = require("../enums/verification-status");
const valid_roles_enum_1 = require("../enums/valid-roles.enum");
let User = class User {
    id;
    email;
    password;
    fullName;
    tokenVersion;
    info;
    verificationStatus;
    ratingAverage;
    reviewsCount;
    isActive;
    createdAt;
    updatedAt;
    role;
    checkEmailBeforeChanges() {
        this.email = this.email.toLowerCase().trim();
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        unique: true,
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        select: false,
    }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
    }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        default: 0
    }),
    __metadata("design:type", Number)
], User.prototype, "tokenVersion", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
    }),
    __metadata("design:type", Object)
], User.prototype, "info", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        default: verification_status_1.VerificationStatus.UNVERIFIED,
    }),
    __metadata("design:type", String)
], User.prototype, "verificationStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'float',
        default: 0,
    }),
    __metadata("design:type", Number)
], User.prototype, "ratingAverage", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'integer',
        default: 0,
    }),
    __metadata("design:type", Number)
], User.prototype, "reviewsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'boolean',
        default: true,
    }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: valid_roles_enum_1.ValidRoles,
        array: true,
        default: [valid_roles_enum_1.ValidRoles.USER],
    }),
    __metadata("design:type", Array)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "checkEmailBeforeChanges", null);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)()
], User);
//# sourceMappingURL=user.entity.js.map