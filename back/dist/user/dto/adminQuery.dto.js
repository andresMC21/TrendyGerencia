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
exports.AdminUserQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const valid_roles_enum_1 = require("../enums/valid-roles.enum");
const verification_status_1 = require("../enums/verification-status");
const pagination_dto_1 = require("./pagination.dto");
class AdminUserQueryDto extends pagination_dto_1.PaginationDto {
    role;
    isActive;
    verificationStatus;
    search;
}
exports.AdminUserQueryDto = AdminUserQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        enum: valid_roles_enum_1.ValidRoles,
        example: valid_roles_enum_1.ValidRoles.ADMIN,
        description: 'Filtra por uno de los roles del usuario',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(valid_roles_enum_1.ValidRoles),
    __metadata("design:type", String)
], AdminUserQueryDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Boolean,
        description: 'Filtra por estado; acepta true para activos o false para inactivos.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' ? true : value === 'false' ? false : value),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AdminUserQueryDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        enum: verification_status_1.VerificationStatus,
        example: verification_status_1.VerificationStatus.PENDING,
        description: 'Filtra por estado de verificación.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(verification_status_1.VerificationStatus),
    __metadata("design:type", String)
], AdminUserQueryDto.prototype, "verificationStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        maxLength: 100,
        description: 'Coincidencia parcial por correo o nombre, de hasta 100 caracteres.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.trim() : value),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], AdminUserQueryDto.prototype, "search", void 0);
//# sourceMappingURL=adminQuery.dto.js.map