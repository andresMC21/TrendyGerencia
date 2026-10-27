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
exports.FindProductsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const product_condition_enum_1 = require("../enums/product-condition.enum");
const product_sort_enum_1 = require("../enums/product-sort.enum");
class FindProductsQueryDto {
    neighborhood;
    lat;
    lng;
    radius;
    category;
    condition;
    sort;
    page;
    limit;
}
exports.FindProductsQueryDto = FindProductsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        example: '{{neighborhoodId}}',
        description: 'Filtra por el identificador del barrio.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindProductsQueryDto.prototype, "neighborhood", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 3.452,
        minimum: -90,
        maximum: 90,
        description: 'Latitud del punto de búsqueda; requiere lng.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLatitude)(),
    __metadata("design:type", Number)
], FindProductsQueryDto.prototype, "lat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: -76.531,
        minimum: -180,
        maximum: 180,
        description: 'Longitud del punto de búsqueda; requiere lat.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsLongitude)(),
    __metadata("design:type", Number)
], FindProductsQueryDto.prototype, "lng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 2,
        default: 5,
        minimum: 0.1,
        maximum: 50,
        description: 'Radio de búsqueda en kilómetros (de 0.1 a 50); aplica solo con lat y lng.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], FindProductsQueryDto.prototype, "radius", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        example: 'LIBROS',
        description: 'Filtra por categoría.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindProductsQueryDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        enum: product_condition_enum_1.ProductCondition,
        example: product_condition_enum_1.ProductCondition.USED,
        description: 'Filtra por condición del producto.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(product_condition_enum_1.ProductCondition),
    __metadata("design:type", String)
], FindProductsQueryDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: String,
        enum: product_sort_enum_1.ProductSort,
        example: product_sort_enum_1.ProductSort.PRICE_ASC,
        default: product_sort_enum_1.ProductSort.RECENT,
        description: 'Criterio de orden; distance requiere lat y lng.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(product_sort_enum_1.ProductSort),
    __metadata("design:type", String)
], FindProductsQueryDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 2,
        default: 1,
        minimum: 1,
        description: 'Número de página, empezando en 1.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FindProductsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 2,
        default: 20,
        minimum: 1,
        maximum: 50,
        description: 'Cantidad de productos por página (de 1 a 50).',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(50),
    __metadata("design:type", Number)
], FindProductsQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=find-products-query.dto.js.map