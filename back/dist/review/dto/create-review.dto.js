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
exports.CreateReviewDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateReviewDto {
    transactionId;
    rating;
    comment;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        example: '{{transactionId}}',
        description: 'Identificador UUID de la transacción completada que se va a reseñar.',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        minimum: 1,
        maximum: 5,
        example: 5,
        description: 'Calificación entera entre 1 y 5.',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        example: 'Entrega puntual y producto en buen estado.',
        maxLength: 1000,
        nullable: true,
        description: 'Comentario opcional; en una actualización, null permite borrar el comentario existente.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", Object)
], CreateReviewDto.prototype, "comment", void 0);
//# sourceMappingURL=create-review.dto.js.map