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
exports.ApiErrorResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ApiErrorResponseDto {
    statusCode;
    message;
    error;
}
exports.ApiErrorResponseDto = ApiErrorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 400,
        required: true,
        description: 'Código HTTP de la respuesta.',
    }),
    __metadata("design:type", Number)
], ApiErrorResponseDto.prototype, "statusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        required: true,
        oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
        description: 'Mensaje del error. La validación de DTO devuelve una lista de mensajes; otras excepciones suelen devolver una cadena.',
    }),
    __metadata("design:type", Object)
], ApiErrorResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        required: true,
        description: 'Etiqueta HTTP de la excepción.',
    }),
    __metadata("design:type", String)
], ApiErrorResponseDto.prototype, "error", void 0);
//# sourceMappingURL=api-error-response.dto.js.map