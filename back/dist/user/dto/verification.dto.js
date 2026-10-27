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
exports.ResolveVerification = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ResolveVerification {
    approved;
    reason;
}
exports.ResolveVerification = ResolveVerification;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        example: true,
        description: 'true aprueba la solicitud; false la rechaza.',
    }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ResolveVerification.prototype, "approved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        example: 'Documento ilegible',
        maxLength: 300,
        description: 'Motivo de hasta 300 caracteres; se registra en logs, no en el perfil.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], ResolveVerification.prototype, "reason", void 0);
//# sourceMappingURL=verification.dto.js.map