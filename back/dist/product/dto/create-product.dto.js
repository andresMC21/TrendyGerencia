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
exports.CreateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const product_condition_enum_1 = require("../enums/product-condition.enum");
const geo_point_dto_1 = require("./geo-point.dto");
class CreateProductDto {
    title;
    description;
    price;
    acceptsBarter;
    category;
    condition;
    location;
    neighborhoodId;
    estimatedWeightKg;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Bicicleta MTB {{neighborhoodId}}',
        minLength: 3,
        maxLength: 120,
        description: 'Título del producto, entre 3 y 120 caracteres.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Rin 26, cambios Shimano, poco uso',
        maxLength: 2000,
        description: 'Descripción del producto, de hasta 2000 caracteres.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 250000,
        default: 0,
        minimum: 0,
        maximum: 9999999999,
        multipleOf: 0.01,
        description: 'Precio con hasta dos decimales; usa 0 para donación o trueque.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(9999999999),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Boolean,
        example: true,
        default: false,
        description: 'Indica si se acepta trueque.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "acceptsBarter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'deportes',
        maxLength: 60,
        description: 'Categoría del producto, de hasta 60 caracteres.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(60),
    __metadata("design:type", String)
], CreateProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: product_condition_enum_1.ProductCondition,
        example: product_condition_enum_1.ProductCondition.LIKE_NEW,
        description: 'Condición del producto.',
    }),
    (0, class_validator_1.IsEnum)(product_condition_enum_1.ProductCondition),
    __metadata("design:type", String)
], CreateProductDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: geo_point_dto_1.GeoPointDto,
        description: 'Ubicación geográfica expresada como latitud y longitud.',
    }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => geo_point_dto_1.GeoPointDto),
    __metadata("design:type", geo_point_dto_1.GeoPointDto)
], CreateProductDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: '{{neighborhoodId}}',
        description: 'Identificador del barrio usado para el filtro hiperlocal.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "neighborhoodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        example: 14.5,
        minimum: 0,
        maximum: 100000,
        exclusiveMinimum: true,
        description: 'Peso estimado en kilogramos para calcular el impacto ambiental.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.IsPositive)(),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "estimatedWeightKg", void 0);
//# sourceMappingURL=create-product.dto.js.map