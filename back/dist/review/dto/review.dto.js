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
exports.ReviewDto = exports.ReviewUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ReviewUserDto {
    id;
    fullName;
}
exports.ReviewUserDto = ReviewUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único del usuario.',
    }),
    __metadata("design:type", String)
], ReviewUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Comprador Postman',
        description: 'Nombre completo del usuario.',
    }),
    __metadata("design:type", String)
], ReviewUserDto.prototype, "fullName", void 0);
class ReviewDto {
    id;
    transactionId;
    reviewer;
    targetUser;
    rating;
    comment;
    createdAt;
    static fromEntity(review) {
        const dto = new ReviewDto();
        dto.id = review.id;
        dto.transactionId = review.transactionId;
        dto.reviewer = {
            id: review.reviewer.id,
            fullName: review.reviewer.fullName,
        };
        dto.targetUser = {
            id: review.targetUser.id,
            fullName: review.targetUser.fullName,
        };
        dto.rating = review.rating;
        dto.comment = review.comment;
        dto.createdAt = review.createdAt;
        return dto;
    }
}
exports.ReviewDto = ReviewDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único de la reseña.',
    }),
    __metadata("design:type", String)
], ReviewDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        example: '{{transactionId}}',
        description: 'Identificador de la transacción reseñada.',
    }),
    __metadata("design:type", String)
], ReviewDto.prototype, "transactionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: ReviewUserDto,
        description: 'Usuario que escribió la reseña.',
    }),
    __metadata("design:type", ReviewUserDto)
], ReviewDto.prototype, "reviewer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: ReviewUserDto,
        description: 'Usuario que recibió la reseña.',
    }),
    __metadata("design:type", ReviewUserDto)
], ReviewDto.prototype, "targetUser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        minimum: 1,
        maximum: 5,
        example: 5,
        description: 'Calificación entera entre 1 y 5.',
    }),
    __metadata("design:type", Number)
], ReviewDto.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        nullable: true,
        example: 'Entrega puntual y producto en buen estado.',
        description: 'Comentario de la reseña o null si no se proporcionó.',
    }),
    __metadata("design:type", Object)
], ReviewDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de creación de la reseña.',
    }),
    __metadata("design:type", Date)
], ReviewDto.prototype, "createdAt", void 0);
//# sourceMappingURL=review.dto.js.map