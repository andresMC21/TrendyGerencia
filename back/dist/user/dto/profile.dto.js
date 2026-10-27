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
exports.UserProfileDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const valid_roles_enum_1 = require("../enums/valid-roles.enum");
const verification_status_1 = require("../enums/verification-status");
class UserProfileDto {
    id;
    email;
    fullName;
    info;
    role;
    verificationStatus;
    isActive;
    ratingAverage;
    reviewsCount;
    createdAt;
    updatedAt;
    static fromEntity(user) {
        return (0, class_transformer_1.plainToInstance)(UserProfileDto, user, {
            excludeExtraneousValues: true,
        });
    }
}
exports.UserProfileDto = UserProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único del usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'email',
        example: 'vendedor.postman@trendy.test',
        description: 'Correo electrónico normalizado del usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Vendedor Postman',
        description: 'Nombre completo del usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        description: 'Información adicional del perfil o null si no está definida.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Object)
], UserProfileDto.prototype, "info", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: valid_roles_enum_1.ValidRoles,
        isArray: true,
        example: [valid_roles_enum_1.ValidRoles.USER],
        description: 'Roles asignados al usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Array)
], UserProfileDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: verification_status_1.VerificationStatus,
        example: verification_status_1.VerificationStatus.PENDING,
        description: 'Estado actual de la verificación de identidad.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], UserProfileDto.prototype, "verificationStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        example: true,
        description: 'Indica si la cuenta está activa.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], UserProfileDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        description: 'Promedio de calificaciones recibidas por el usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], UserProfileDto.prototype, "ratingAverage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Cantidad de reseñas recibidas por el usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], UserProfileDto.prototype, "reviewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de creación del usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], UserProfileDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de la última actualización del usuario.',
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Date)
], UserProfileDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=profile.dto.js.map