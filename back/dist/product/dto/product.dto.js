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
exports.FavoriteResultDto = exports.PaginatedProductsDto = exports.ProductDetailDto = exports.ProductSellerDto = exports.ProductDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const geo_interface_1 = require("../interfaces/geo.interface");
const product_condition_enum_1 = require("../enums/product-condition.enum");
const product_status_enum_1 = require("../enums/product-status.enum");
const geo_point_dto_1 = require("./geo-point.dto");
class ProductDto {
    id;
    sellerId;
    title;
    description;
    price;
    acceptsBarter;
    category;
    condition;
    status;
    location;
    neighborhoodId;
    estimatedWeightKg;
    favoritesCount;
    viewsCount;
    distanceKm;
    createdAt;
    updatedAt;
    static fromEntity(product, extra = {}) {
        const dto = new ProductDto();
        dto.id = product.id;
        dto.sellerId = product.sellerId;
        dto.title = product.title;
        dto.description = product.description;
        dto.price = product.price;
        dto.acceptsBarter = product.acceptsBarter;
        dto.category = product.category;
        dto.condition = product.condition;
        dto.status = product.status;
        dto.location = (0, geo_interface_1.fromGeoJson)(product.location);
        dto.neighborhoodId = product.neighborhoodId;
        dto.estimatedWeightKg = product.estimatedWeightKg ?? null;
        dto.favoritesCount = extra.favoritesCount ?? 0;
        dto.viewsCount = product.viewsCount;
        if (extra.distanceKm !== undefined)
            dto.distanceKm = extra.distanceKm;
        dto.createdAt = product.createdAt;
        dto.updatedAt = product.updatedAt;
        return dto;
    }
}
exports.ProductDto = ProductDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador del vendedor propietario del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Bicicleta MTB {{neighborhoodId}}',
        description: 'Título del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Rin 26, cambios Shimano, poco uso',
        description: 'Descripción del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 250000,
        description: 'Precio del producto.',
    }),
    __metadata("design:type", Number)
], ProductDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        example: true,
        description: 'Indica si se acepta trueque.',
    }),
    __metadata("design:type", Boolean)
], ProductDto.prototype, "acceptsBarter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'deportes',
        description: 'Categoría del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: product_condition_enum_1.ProductCondition,
        example: product_condition_enum_1.ProductCondition.LIKE_NEW,
        description: 'Condición del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        enum: product_status_enum_1.ProductStatus,
        example: product_status_enum_1.ProductStatus.AVAILABLE,
        description: 'Estado actual del producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: geo_point_dto_1.GeoPointDto,
        description: 'Ubicación geográfica del producto.',
    }),
    __metadata("design:type", geo_point_dto_1.GeoPointDto)
], ProductDto.prototype, "location", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: '{{neighborhoodId}}',
        description: 'Identificador del barrio asociado al producto.',
    }),
    __metadata("design:type", String)
], ProductDto.prototype, "neighborhoodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        nullable: true,
        example: 14.5,
        description: 'Peso estimado en kilogramos o null si no se especificó.',
    }),
    __metadata("design:type", Object)
], ProductDto.prototype, "estimatedWeightKg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 1,
        description: 'Cantidad de usuarios que marcaron el producto como favorito.',
    }),
    __metadata("design:type", Number)
], ProductDto.prototype, "favoritesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Cantidad de visitas al producto.',
    }),
    __metadata("design:type", Number)
], ProductDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: Number,
        description: 'Distancia en kilómetros; solo aparece si se enviaron lat y lng.',
    }),
    __metadata("design:type", Number)
], ProductDto.prototype, "distanceKm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de publicación del producto.',
    }),
    __metadata("design:type", Date)
], ProductDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'date-time',
        description: 'Fecha y hora de la última actualización del producto.',
    }),
    __metadata("design:type", Date)
], ProductDto.prototype, "updatedAt", void 0);
class ProductSellerDto {
    id;
    fullName;
    ratingAverage;
    reviewsCount;
}
exports.ProductSellerDto = ProductSellerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        format: 'uuid',
        description: 'Identificador único del vendedor.',
    }),
    __metadata("design:type", String)
], ProductSellerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: String,
        example: 'Vendedor Postman',
        description: 'Nombre completo del vendedor.',
    }),
    __metadata("design:type", String)
], ProductSellerDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Promedio de calificaciones recibidas por el vendedor.',
    }),
    __metadata("design:type", Number)
], ProductSellerDto.prototype, "ratingAverage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        description: 'Cantidad de reseñas recibidas por el vendedor.',
    }),
    __metadata("design:type", Number)
], ProductSellerDto.prototype, "reviewsCount", void 0);
class ProductDetailDto extends ProductDto {
    seller;
}
exports.ProductDetailDto = ProductDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: ProductSellerDto,
        description: 'Perfil público del vendedor.',
    }),
    __metadata("design:type", ProductSellerDto)
], ProductDetailDto.prototype, "seller", void 0);
class PaginatedProductsDto {
    items;
    total;
    page;
    limit;
}
exports.PaginatedProductsDto = PaginatedProductsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [ProductDto],
        description: 'Productos incluidos en la página actual.',
    }),
    __metadata("design:type", Array)
], PaginatedProductsDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 4,
        description: 'Cantidad total de productos que coinciden con los filtros.',
    }),
    __metadata("design:type", Number)
], PaginatedProductsDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 2,
        description: 'Número de página devuelto.',
    }),
    __metadata("design:type", Number)
], PaginatedProductsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Number,
        example: 2,
        description: 'Cantidad de productos por página.',
    }),
    __metadata("design:type", Number)
], PaginatedProductsDto.prototype, "limit", void 0);
class FavoriteResultDto {
    isFavorite;
}
exports.FavoriteResultDto = FavoriteResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        type: Boolean,
        example: true,
        description: 'Nuevo estado del favorito para el usuario autenticado.',
    }),
    __metadata("design:type", Boolean)
], FavoriteResultDto.prototype, "isFavorite", void 0);
//# sourceMappingURL=product.dto.js.map