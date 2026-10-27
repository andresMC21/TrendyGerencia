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
exports.RegisterUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class RegisterUserDto {
    email;
    password;
    fullName;
}
exports.RegisterUserDto = RegisterUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'email',
        example: 'vendedor.postman@trendy.test',
        description: 'Correo electrónico de la cuenta; se normaliza a minúsculas.',
    }),
    (0, class_transformer_1.Transform)(({ value }) => typeof value === 'string' ? value.toLowerCase().trim() : value),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        minLength: 8,
        maxLength: 12,
        example: 'Passw0rd1',
        writeOnly: true,
        description: 'Contraseña de 8 a 12 caracteres.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(12),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Vendedor Postman',
        description: 'Nombre completo de la persona registrada.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterUserDto.prototype, "fullName", void 0);
//# sourceMappingURL=register.dto.js.map