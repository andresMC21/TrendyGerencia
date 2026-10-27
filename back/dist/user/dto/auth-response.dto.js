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
exports.MessageResponseDto = exports.RegisterResponseDto = exports.LoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const profile_dto_1 = require("./profile.dto");
class LoginResponseDto {
    id;
    email;
    token;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único del usuario autenticado.',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'email',
        example: 'vendedor.postman@trendy.test',
        description: 'Correo electrónico de la cuenta autenticada.',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        description: 'Token JWT para autenticar solicitudes protegidas.',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "token", void 0);
class RegisterResponseDto extends profile_dto_1.UserProfileDto {
    token;
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        description: 'Token JWT para autenticar solicitudes protegidas.',
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "token", void 0);
class MessageResponseDto {
    message;
}
exports.MessageResponseDto = MessageResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        description: 'Mensaje que confirma la operación realizada.',
    }),
    __metadata("design:type", String)
], MessageResponseDto.prototype, "message", void 0);
//# sourceMappingURL=auth-response.dto.js.map